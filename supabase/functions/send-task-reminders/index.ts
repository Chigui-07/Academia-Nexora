import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type Reminder = {
  reminder_id: string;
  reminder_kind: "unseen_24h" | "due_24h";
  user_id: string;
  email: string;
  display_name: string;
  activity_title: string;
  activity_type: "notebook_task" | "virtual_task" | "exercise_sheet";
  course_name: string;
  course_key: string;
  closes_at: string | null;
};

function getSupabaseSecretKey() {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;

  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed.default ?? Object.values(parsed)[0] ?? null;
  } catch {
    return null;
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function activityLabel(type: Reminder["activity_type"]) {
  if (type === "notebook_task") return "Tarea de cuaderno";
  if (type === "virtual_task") return "Tarea virtual";
  return "Hoja de ejercicios";
}

function buildCourseUrl(publicUrl: string, reminder: Reminder) {
  const base = publicUrl.endsWith("/") ? publicUrl : `${publicUrl}/`;
  const tab = reminder.activity_type === "exercise_sheet" ? "hoja-ejercicios" : "tareas";
  return new URL(
    `course/?course=${encodeURIComponent(reminder.course_key)}&tab=${encodeURIComponent(tab)}`,
    base,
  ).toString();
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secretKey = getSupabaseSecretKey();
  if (!supabaseUrl || !secretKey) {
    return Response.json({ ok: false, error: "supabase_backend_not_configured" }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const suppliedToken = req.headers.get("x-nexora-cron-token");
  const { data: expectedToken, error: tokenError } = await admin.rpc("get_email_reminder_cron_token");
  if (tokenError || !suppliedToken || !expectedToken || suppliedToken !== expectedToken) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("NEXORA_REMINDER_FROM");
  if (!resendApiKey || !from) {
    return Response.json({
      ok: true,
      configured: false,
      reason: "email_provider_not_configured",
      message: "Configura RESEND_API_KEY y NEXORA_REMINDER_FROM para activar los correos.",
    });
  }

  const publicUrl = Deno.env.get("NEXORA_PUBLIC_URL") ?? "https://chigui-07.github.io/Academia-Nexora/";
  const { data, error: claimError } = await admin.rpc("claim_due_student_email_reminders", { p_limit: 25 });

  if (claimError) {
    return Response.json({ ok: false, error: "claim_failed" }, { status: 500 });
  }

  const reminders = (data ?? []) as Reminder[];
  let sent = 0;
  let failed = 0;

  for (const reminder of reminders) {
    const courseUrl = buildCourseUrl(publicUrl, reminder);
    const dueDate = reminder.closes_at
      ? new Intl.DateTimeFormat("es-GT", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "America/Guatemala",
        }).format(new Date(reminder.closes_at))
      : null;

    const isUnseen = reminder.reminder_kind === "unseen_24h";
    const subject = isUnseen
      ? `Tienes una tarea nueva en ${reminder.course_name}`
      : `Recordatorio: ${reminder.activity_title} vence pronto`;

    const intro = isUnseen
      ? "Tienes una actividad nueva que todavía no has abierto en Academia Nexora."
      : "Esta actividad sigue pendiente y su fecha de cierre se acerca.";

    const dueLine = dueDate ? `Fecha de cierre: ${dueDate}.` : "";
    const text = [
      `Hola ${reminder.display_name},`,
      "",
      intro,
      `${activityLabel(reminder.activity_type)}: ${reminder.activity_title}`,
      `Materia: ${reminder.course_name}`,
      dueLine,
      "",
      `Abrir en Nexora: ${courseUrl}`,
      "",
      "Este es un recordatorio automático y no se repetirá continuamente.",
    ].filter(Boolean).join("\n");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2937;line-height:1.55">
        <h2 style="margin-bottom:8px">Academia Nexora</h2>
        <p>Hola <strong>${escapeHtml(reminder.display_name)}</strong>,</p>
        <p>${escapeHtml(intro)}</p>
        <div style="border:1px solid #e5e7eb;border-radius:14px;padding:16px;margin:18px 0">
          <strong>${escapeHtml(activityLabel(reminder.activity_type))}</strong><br>
          ${escapeHtml(reminder.activity_title)}<br>
          <span style="color:#6b7280">${escapeHtml(reminder.course_name)}</span>
          ${dueDate ? `<br><span style="color:#6b7280">Fecha de cierre: ${escapeHtml(dueDate)}</span>` : ""}
        </div>
        <p><a href="${escapeHtml(courseUrl)}" style="display:inline-block;padding:11px 16px;border-radius:10px;background:#2563eb;color:white;text-decoration:none;font-weight:700">Abrir Academia Nexora</a></p>
        <p style="font-size:12px;color:#6b7280">Este recordatorio es automático y está limitado para evitar mensajes repetitivos.</p>
      </div>
    `;

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from,
          to: [reminder.email],
          subject,
          text,
          html,
        }),
      });

      const payload = await response.json().catch(() => ({})) as { id?: string; message?: string; name?: string };

      if (!response.ok) {
        failed += 1;
        await admin.rpc("fail_student_email_reminder", {
          p_reminder_id: reminder.reminder_id,
          p_error: payload.message ?? payload.name ?? `Resend HTTP ${response.status}`,
        });
        continue;
      }

      sent += 1;
      await admin.rpc("complete_student_email_reminder", {
        p_reminder_id: reminder.reminder_id,
        p_provider_message_id: payload.id ?? null,
      });
    } catch (error) {
      failed += 1;
      await admin.rpc("fail_student_email_reminder", {
        p_reminder_id: reminder.reminder_id,
        p_error: error instanceof Error ? error.message : "Error de red al enviar el correo",
      });
    }
  }

  return Response.json({ ok: true, configured: true, claimed: reminders.length, sent, failed });
});
