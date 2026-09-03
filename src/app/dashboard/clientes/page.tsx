import Link from "next/link";
import { requireBusiness } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/dates/format";
import { formatClientName } from "@/lib/clients/name";
import { ClientSearch } from "@/components/clients/client-search";
import { NewClientDialog } from "@/components/clients/new-client-dialog";
import { EmptyState } from "@/components/dashboard/empty-state";

export const metadata = {
  title: "Clientes — Zazú",
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { supabase, businessId, business } = await requireBusiness();
  const { q } = await searchParams;
  const timezone = business?.timezone ?? "Europe/Madrid";
  const now = new Date().toISOString();

  let query = supabase
    .from("clients")
    .select("id, first_name, last_name, phone")
    .eq("business_id", businessId)
    .order("first_name");

  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`,
    );
  }

  const { data: clients } = await query;

  const clientIds = clients?.map((c) => c.id) ?? [];
  const { data: appointments } = clientIds.length
    ? await supabase
        .from("appointments")
        .select("client_id, starts_at")
        .eq("business_id", businessId)
        .in("client_id", clientIds)
        .neq("status", "cancelled")
        .order("starts_at")
    : { data: [] };

  const appointmentsByClient = new Map<
    string,
    { lastPast?: string; nextFuture?: string; count: number }
  >();

  for (const appt of appointments ?? []) {
    const entry = appointmentsByClient.get(appt.client_id) ?? { count: 0 };
    entry.count += 1;
    if (appt.starts_at < now) {
      entry.lastPast = appt.starts_at;
    } else if (!entry.nextFuture) {
      entry.nextFuture = appt.starts_at;
    }
    appointmentsByClient.set(appt.client_id, entry);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <NewClientDialog />
      </div>

      <ClientSearch />

      {!clients || clients.length === 0 ? (
        <EmptyState
          title={
            q
              ? "No se encontraron clientes con ese criterio."
              : "Todavía no tienes clientes."
          }
          action={!q ? <NewClientDialog label="Añadir primer cliente" /> : undefined}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Teléfono</th>
                <th className="px-4 py-2 font-medium">Citas</th>
                <th className="px-4 py-2 font-medium">Última cita</th>
                <th className="px-4 py-2 font-medium">Próxima cita</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const info = appointmentsByClient.get(client.id);
                return (
                  <tr key={client.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/clientes/${client.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {formatClientName(client.first_name, client.last_name)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {client.phone}
                    </td>
                    <td className="px-4 py-3">{info?.count ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {info?.lastPast
                        ? formatDateTime(info.lastPast, timezone)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {info?.nextFuture
                        ? formatDateTime(info.nextFuture, timezone)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
