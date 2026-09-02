/**
 * Placeholder. El dashboard real (resumen, vista Hoy/Mañana) se implementa
 * en la Fase 8 (SPEC.md sección 12-15), sobre datos reales de Supabase.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarded?: string }>;
}) {
  const { onboarded } = await searchParams;

  return (
    <div className="flex flex-col gap-2">
      {onboarded ? (
        <p className="text-sm font-medium text-primary">
          Tu agenda está lista.
        </p>
      ) : null}
      <h1 className="text-2xl font-semibold">Agenda</h1>
      <p className="text-muted-foreground">Próximamente.</p>
    </div>
  );
}
