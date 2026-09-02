export const metadata = {
  title: "Política de privacidad",
};

/**
 * Plantilla provisional (SPEC.md sección 38). No constituye asesoramiento
 * legal ni una declaración de cumplimiento normativo: debe ser revisada y
 * adaptada por un profesional jurídico antes de usarse en producción.
 */
export default function PrivacidadPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Política de privacidad</h1>
        <p className="mt-2 rounded-md bg-secondary px-4 py-3 text-sm text-muted-foreground">
          Este texto es una plantilla provisional y debe ser revisado y
          adaptado por un profesional jurídico antes de su uso en
          producción. No constituye asesoramiento legal.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Qué datos tratamos</h2>
        <p className="text-sm text-muted-foreground">
          Para prestar el servicio, Zazú trata los datos que introduces al
          usarlo: tu email y nombre de profesional, los datos de tu negocio,
          y los datos de tus clientes que tú mismo registras (nombre,
          teléfono y notas opcionales). No solicitamos ni almacenamos DNI,
          dirección, fecha de nacimiento, información médica ni información
          financiera de tus clientes.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Aislamiento por negocio</h2>
        <p className="text-sm text-muted-foreground">
          Los datos de cada negocio están aislados: ningún usuario puede
          acceder a los clientes, servicios o citas de un negocio del que no
          sea miembro.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Recordatorios por WhatsApp</h2>
        <p className="text-sm text-muted-foreground">
          Al pulsar &quot;Recordar por WhatsApp&quot;, el nombre del cliente
          y los detalles de la cita se incluyen en la URL que abre
          WhatsApp. Esto significa que quedan en el historial del navegador
          del profesional que envía el recordatorio. Es una limitación
          inherente a este mecanismo (enlaces{" "}
          <code className="text-xs">wa.me</code>) y un riesgo aceptado en
          esta versión del producto.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Eliminación de tus datos</h2>
        <p className="text-sm text-muted-foreground">
          Desde Configuración &gt; Cuenta puedes eliminar tu cuenta. Esto
          borra de forma irreversible tu negocio y todos los datos
          asociados: clientes, servicios, citas y recordatorios.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Contacto</h2>
        <p className="text-sm text-muted-foreground">
          Para cualquier consulta sobre tus datos, contacta con el
          responsable del servicio.
        </p>
      </section>
    </main>
  );
}
