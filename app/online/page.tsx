import AppShell from "@/components/AppShell";
import OnlinePresenceManager from "@/components/OnlinePresenceManager";

export default function OnlinePage() {
  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">Comunidad</p>
          <h1>Usuarios en línea</h1>
          <p>Consulta quién está usando Academia Nexora en este momento.</p>
        </div>
      </div>

      <OnlinePresenceManager />
    </AppShell>
  );
}
