import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type PushConfig = {
  public_key: string;
  private_key: string;
  subject: string;
  cron_token: string;
};

type PushJob = {
  job_id: string;
  subscription_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
  title: string;
  body: string;
  target_url: string;
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { data: configRows, error: configError } = await supabase.rpc("get_push_vapid_config");
  if (configError || !configRows?.length) {
    return Response.json({ ok: false, error: configError?.message ?? "push_config_missing" }, { status: 500 });
  }

  const config = configRows[0] as PushConfig;
  const providedToken = req.headers.get("x-nexora-push-token");
  if (!providedToken || providedToken !== config.cron_token) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  webpush.setVapidDetails(config.subject, config.public_key, config.private_key);

  const { data: jobs, error: jobsError } = await supabase.rpc("claim_due_student_push_jobs", { p_limit: 50 });
  if (jobsError) {
    return Response.json({ ok: false, error: jobsError.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  let removed = 0;

  for (const rawJob of (jobs ?? []) as PushJob[]) {
    const payload = JSON.stringify({
      title: rawJob.title,
      body: rawJob.body,
      url: rawJob.target_url,
    });

    try {
      const response = await webpush.sendNotification(
        {
          endpoint: rawJob.endpoint,
          keys: {
            p256dh: rawJob.p256dh,
            auth: rawJob.auth_key,
          },
        },
        payload,
        { TTL: 3600, urgency: "normal" },
      );

      await supabase.rpc("complete_student_push_job", {
        p_job_id: rawJob.job_id,
        p_provider_status: response?.statusCode ?? 201,
      });
      sent += 1;
    } catch (error) {
      const statusCode = Number((error as { statusCode?: number })?.statusCode ?? 0) || null;
      const subscriptionGone = statusCode === 404 || statusCode === 410;
      const message = error instanceof Error ? error.message : String(error);

      await supabase.rpc("fail_student_push_job", {
        p_job_id: rawJob.job_id,
        p_error: message,
        p_provider_status: statusCode,
        p_subscription_gone: subscriptionGone,
      });

      failed += 1;
      if (subscriptionGone) removed += 1;
    }
  }

  return Response.json({
    ok: true,
    claimed: jobs?.length ?? 0,
    sent,
    failed,
    removed,
  });
});
