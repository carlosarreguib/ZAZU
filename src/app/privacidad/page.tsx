export const metadata = {
  title: "Política de privacidad — Zazú",
};

/**
 * Contenido legal real se redacta en la Fase 11 (SPEC.md sección 38).
 * Debe quedar marcado como plantilla pendiente de revisión jurídica.
 *
 * Pendiente para la Fase 11 (SPEC.md sección 17): mencionar que el nombre
 * del cliente y los detalles de la cita viajan en la query string de la
 * URL wa.me, quedando en el historial del navegador del profesional —
 * limitación inherente al enfoque wa.me, riesgo aceptado del MVP.
 */
export default function PrivacidadPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold">Política de privacidad</h1>
      <p className="text-sm text-muted-foreground">
        Este texto es una plantilla provisional y debe ser revisado y
        adaptado por un profesional jurídico antes de su uso en producción.
      </p>
    </main>
  );
}
