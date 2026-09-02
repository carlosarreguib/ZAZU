/**
 * Placeholder. Detalle/edición de cita real se implementa en la Fase 7
 * (SPEC.md sección 18-20).
 */
export default async function CitaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">Cita {id}</h1>
      <p className="text-muted-foreground">Próximamente.</p>
    </div>
  );
}
