export const metadata = {
  title: "Términos y condiciones",
};

/**
 * Plantilla provisional (SPEC.md sección 38). No constituye asesoramiento
 * legal: debe ser revisada y adaptada por un profesional jurídico antes de
 * usarse en producción.
 */
export default function TerminosPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Términos y condiciones</h1>
        <p className="mt-2 rounded-md bg-secondary px-4 py-3 text-sm text-muted-foreground">
          Este texto es una plantilla provisional y debe ser revisado y
          adaptado por un profesional jurídico antes de su uso en
          producción. No constituye asesoramiento legal.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Qué es Zazú</h2>
        <p className="text-sm text-muted-foreground">
          Zazú es una agenda para profesionales y autónomos que gestionan
          citas con clientes, con recordatorios preparados para enviar por
          WhatsApp mediante un enlace (<code className="text-xs">wa.me</code>).
          El profesional es quien pulsa &quot;Enviar&quot; en WhatsApp; Zazú
          no envía mensajes de forma automática.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Responsabilidad sobre los datos de clientes</h2>
        <p className="text-sm text-muted-foreground">
          El profesional que usa Zazú es responsable de la exactitud de los
          datos de sus clientes y de contar con la base legítima adecuada
          para tratarlos y contactarlos.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Disponibilidad del servicio</h2>
        <p className="text-sm text-muted-foreground">
          Zazú se ofrece &quot;tal cual&quot;, sin garantías de disponibilidad
          continua. No se garantiza que los mensajes preparados para
          WhatsApp lleguen a su destinatario: esa parte depende de
          WhatsApp y de la acción del propio profesional.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Cuenta y baja</h2>
        <p className="text-sm text-muted-foreground">
          Puedes eliminar tu cuenta en cualquier momento desde Configuración
          &gt; Cuenta. La eliminación es irreversible y borra todos tus
          datos asociados.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Cambios en estos términos</h2>
        <p className="text-sm text-muted-foreground">
          Estos términos podrán actualizarse. El uso continuado del
          servicio tras un cambio implica su aceptación.
        </p>
      </section>
    </main>
  );
}
