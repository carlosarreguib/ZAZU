export const metadata = {
  title: "Términos y condiciones — Zazú",
};

/**
 * Contenido legal real se redacta en la Fase 11 (SPEC.md sección 38).
 * Debe quedar marcado como plantilla pendiente de revisión jurídica.
 */
export default function TerminosPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold">Términos y condiciones</h1>
      <p className="text-sm text-muted-foreground">
        Este texto es una plantilla provisional y debe ser revisado y
        adaptado por un profesional jurídico antes de su uso en producción.
      </p>
    </main>
  );
}
