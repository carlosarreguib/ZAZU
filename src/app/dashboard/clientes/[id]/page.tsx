/**
 * Placeholder. Ficha de cliente real se implementa en la Fase 5
 * (SPEC.md sección 21).
 */
export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">Cliente {id}</h1>
      <p className="text-muted-foreground">Próximamente.</p>
    </div>
  );
}
