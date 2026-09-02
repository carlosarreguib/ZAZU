# PROMPT MAESTRO — ZAZÚ (v2, revisado para Claude Code)

Actúa como **Senior Full-Stack Engineer, Product Engineer y Software Architect**. Vas a construir desde cero una aplicación SaaS web llamada **Zazú**.

Tu objetivo no es crear un mockup ni una demo visual, sino **una aplicación funcional, mantenible, segura y preparada para desplegar en producción**, aunque el alcance inicial sea un MVP.

Quiero que tomes decisiones técnicas razonables por tu cuenta, pero **no inventes funcionalidades fuera del alcance definido en este documento**.

> **Nota sobre esta versión**: respecto al prompt original, esta versión añade una guía de checkpoints de trabajo (sección 0), cierra ambigüedades técnicas que quedaban abiertas (solapamientos, eliminación de clientes/cuentas, RLS recursivo, timezone), y precisa el stack. Los cambios están marcados con **[REVISADO]**.

---

# 0. CÓMO QUIERO QUE TRABAJES EN ESTA SESIÓN **[REVISADO]**

Este proyecto es grande. No lo ejecutes como un único bloque continuo sin parar.

Reglas de trabajo:

1. Trabaja fase por fase, en el orden de la sección 49.
2. **Al terminar cada fase**: haz commit con un mensaje descriptivo, ejecuta `tsc`, lint y los tests que ya existan, y escribe un resumen corto (5-10 líneas) de qué se implementó y qué decisiones tomaste.
3. **Detente y pide confirmación explícita** después de estas fases concretas, porque son las de mayor riesgo si algo está mal:
   - Fase 2 (Base de datos + RLS) — antes de seguir, muéstrame las policies y confirma que probaste el aislamiento cross-tenant.
   - Fase 7 (Citas) — confirma que el constraint de solapamiento a nivel de BD funciona, no solo la validación en el formulario.
   - Fase 13 (Auditoría final) — resumen completo antes de darlo por terminado.
4. En el resto de fases, no me pidas aprobación para cada decisión menor — sigue las reglas de este documento y las buenas prácticas de Next.js + Supabase.
5. Si en algún momento el contexto se vuelve muy largo, resume el estado del proyecto (qué está hecho, qué falta, decisiones tomadas) antes de continuar, para no perder coherencia entre fases.

---

# 1. CONTEXTO DEL PRODUCTO

## Nombre

**Zazú**

Zazú es un SaaS B2B dirigido inicialmente a profesionales/autónomos que trabajan con citas.

La propuesta de valor:

> **La agenda sencilla para autónomos que no quieren perder clientes por olvidos.**

Zazú permite:

1. Gestionar clientes.
2. Gestionar servicios.
3. Crear y modificar citas.
4. Consultar fácilmente las citas de hoy y próximos días.
5. Recordar una cita al cliente mediante WhatsApp con un solo clic.
6. Registrar si el recordatorio ha sido enviado.
7. Mantener toda la información aislada por negocio.

## Filosofía del producto

Zazú NO debe intentar competir con grandes suites de gestión.

No queremos:

* TPV.
* Inventario.
* Contabilidad.
* Facturación.
* Nóminas.
* Marketplace.
* CRM complejo.
* IA.
* Automatizaciones complejas.
* Gestión médica.
* Historial clínico.
* Gestión de empleados avanzada.

El producto debe transmitir:

> **"Abro Zazú y en 10 segundos sé quién tengo hoy y a quién tengo que recordar."**

La simplicidad es una funcionalidad principal.

---

# 2. USUARIO OBJETIVO

Profesionales que trabajan solos y gestionan citas recurrentes con clientes: fisioterapeutas, psicólogos, entrenadores personales, peluqueros/barberos, tatuadores, masajistas, y similares.

No diseñes funcionalidades específicas para cada profesión. La arquitectura debe permitir posteriormente especializar la experiencia, pero el MVP debe ser genérico.

---

# 3. PROPUESTA DE VALOR

### Mensaje principal
> **No pierdas citas por un simple olvido.**

### Submensaje
> Organiza tu agenda y recuerda a tus clientes por WhatsApp en segundos.

### Diferenciadores
1. Simplicidad
2. Cero configuración compleja
3. Recordatorios WhatsApp en un clic
4. Precio accesible
5. Diseñada para el micro-autónomo

IMPORTANTE: no describas el producto como "automatización de WhatsApp". En el MVP el sistema utiliza un enlace `wa.me` que abre WhatsApp con el mensaje preparado; el profesional debe pulsar "Enviar" en WhatsApp. Lenguaje correcto: **"Recordatorio por WhatsApp en un clic."** Incorrecto: "Enviamos automáticamente WhatsApps."

---

# 4. STACK TECNOLÓGICO **[REVISADO]**

* Next.js (última versión estable disponible en el momento de construir el proyecto — documenta la versión exacta usada en el README).
* App Router.
* TypeScript (modo estricto).
* Supabase (Auth + PostgreSQL + RLS).
* Tailwind CSS.
* shadcn/ui.
* date-fns **y date-fns-tz** (o `Intl.DateTimeFormat` con soporte de IANA timezone) — necesario para convertir correctamente horas entre UTC y `Europe/Madrid` respetando el horario de verano. `date-fns` solo no resuelve conversión de timezone de forma fiable.
* Zod.
* React Hook Form.
* Lucide Icons.
* Vercel como plataforma de despliegue.
* Supabase CLI + Docker para desarrollo local y tests de integración (ver sección 43).

Responsive: móvil, tablet, escritorio. Preparar arquitectura para PWA, sin depender de la instalación como PWA para funcionar.

---

# 5. PRINCIPIOS DE ARQUITECTURA

## 5.1 Multi-tenant desde el primer día

Zazú será un SaaS multi-tenant. Un usuario pertenece a uno o varios negocios potencialmente. Todos los datos empresariales deben estar asociados a un `business_id`. Nunca dependas únicamente de IDs enviados desde el cliente para determinar qué datos puede consultar un usuario. La seguridad debe estar garantizada mediante Supabase RLS.

**[REVISADO] En el MVP no construyas UI de selector/cambio de negocio.** El modelo de datos soporta multi-negocio por usuario (para el futuro), pero el flujo de registro crea exactamente un negocio por usuario y la UI asume un único negocio activo. No añadas un "business switcher" — está fuera de alcance del MVP aunque el esquema lo permita.

## 5.2 Patrón obligatorio para evitar recursión en RLS **[NUEVO]**

Si una policy de RLS sobre `business_members` necesita comprobar la propia tabla `business_members` para verificar membresía (p. ej. "¿pertenece este usuario a este negocio?"), NO hagas una subquery directa contra `business_members` dentro de su propia policy — Postgres puede entrar en recursión o comportamiento inesperado.

Usa en su lugar una función `SECURITY DEFINER` (p. ej. `is_business_member(business_id uuid) RETURNS boolean`) que se ejecute con los privilegios del definer, evitando así que la propia policy se dispare recursivamente al evaluarse. Todas las policies de `clients`, `services`, `appointments`, `appointment_reminders`, `business_settings` deben apoyarse en esta función (o equivalente) en vez de repetir la subquery en cada policy.

---

# 6. MODELO DE DATOS

## `profiles`
* `id UUID PRIMARY KEY` (relacionado con `auth.users.id`)
* `email`
* `full_name`
* `created_at`, `updated_at`

## `businesses`
* `id UUID PRIMARY KEY`
* `name TEXT NOT NULL`
* `contact_name TEXT`
* `phone TEXT`
* `timezone TEXT NOT NULL DEFAULT 'Europe/Madrid'`
* `created_at`, `updated_at`

## `business_members`
* `id UUID PRIMARY KEY`
* `business_id UUID`
* `user_id UUID`
* `role TEXT` (`owner` | `member`)
* `created_at`

Debe existir una restricción `UNIQUE (business_id, user_id)` que evite duplicar el mismo usuario dentro del mismo negocio. Aunque la UI del MVP solo use `owner`, diseña la arquitectura correctamente.

## `clients`
* `id UUID PRIMARY KEY`
* `business_id UUID NOT NULL`
* `full_name TEXT NOT NULL`
* `phone TEXT NOT NULL`
* `notes TEXT NULL`
* `created_at`, `updated_at`

No guardar: DNI, dirección, fecha de nacimiento, información médica, información financiera.

## `services`
* `id UUID PRIMARY KEY`
* `business_id UUID NOT NULL`
* `name TEXT NOT NULL`
* `duration_minutes INTEGER NOT NULL`
* `active BOOLEAN NOT NULL DEFAULT TRUE`
* `created_at`, `updated_at`

## `appointments`
* `id UUID PRIMARY KEY`
* `business_id UUID NOT NULL`
* `client_id UUID NOT NULL`
* `service_id UUID NULL`
* `starts_at TIMESTAMPTZ NOT NULL`
* `ends_at TIMESTAMPTZ NOT NULL`
* `status TEXT NOT NULL` (`scheduled` | `confirmed` | `cancelled` | `completed` | `no_show`)
* `notes TEXT NULL`
* `created_at`, `updated_at`

**[REVISADO] Mapeo UI (español) ↔ valor en BD (inglés) — usar exactamente estos nombres, no inventar otros:**

| UI (MVP)   | Valor en BD  |
|------------|--------------|
| Pendiente  | `scheduled`  |
| Confirmada | `confirmed`  |
| Cancelada  | `cancelled`  |

`completed` y `no_show` existen en el esquema pero no tienen UI dedicada en el MVP (se preparan para V2).

**[NUEVO] Constraint anti-solapamiento a nivel de base de datos, obligatorio:**

No basta con validar solapamientos en la Server Action — dos peticiones concurrentes pueden colarse. Añade en la migración un `EXCLUDE` constraint usando la extensión `btree_gist`:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointments
ADD CONSTRAINT no_overlapping_appointments
EXCLUDE USING gist (
  business_id WITH =,
  tstzrange(starts_at, ends_at) WITH &&
) WHERE (status <> 'cancelled');
```

Esto garantiza que la BD rechace solapamientos incluso ante condiciones de carrera. La validación de aplicación (para mostrar "Ya tienes una cita a esa hora" de forma amigable) sigue siendo necesaria, pero es una capa adicional, no la única.

## `appointment_reminders`
* `id UUID PRIMARY KEY`
* `business_id UUID NOT NULL`
* `appointment_id UUID NOT NULL`
* `channel TEXT NOT NULL` (`whatsapp`)
* `status TEXT NOT NULL` (`pending` | `prepared` | `sent`)
* `sent_at TIMESTAMPTZ NULL`
* `created_at`, `updated_at`

IMPORTANTE: `sent` significa que el usuario ha confirmado en Zazú que ha enviado el mensaje. Zazú no puede verificar que WhatsApp realmente lo haya enviado cuando se usa `wa.me`.

## `business_settings`
* `business_id UUID PRIMARY KEY`
* `default_reminder_template TEXT`
* `week_starts_on INTEGER DEFAULT 1`
* `created_at`, `updated_at`

Plantilla por defecto:
> Hola {{client_name}}, te recordamos tu cita de {{service}} mañana a las {{time}} en {{business_name}}. ¡Te esperamos!

Variables soportadas: `{{client_name}}`, `{{service}}`, `{{date}}`, `{{time}}`, `{{business_name}}`.

---

# 7. BASE DE DATOS Y MIGRACIONES

No me pidas crear manualmente las tablas desde el dashboard de Supabase. Crea migraciones SQL dentro del proyecto:

```text
supabase/
  migrations/
    001_initial_schema.sql
    002_rls.sql
    003_seed.sql
```

Migraciones reproducibles. Crear: foreign keys, índices, constraints, unique constraints, check constraints, timestamps, cascadas apropiadas.

---

# 8. SEGURIDAD — RLS

Obligatorio. No desactivar RLS. Todas las tablas con datos empresariales deben tener RLS activado. Un usuario solamente puede acceder a datos de negocios de los que sea miembro. Crear políticas para SELECT, INSERT, UPDATE, DELETE según corresponda.

Regla fundamental: **un negocio jamás puede consultar, modificar o eliminar datos pertenecientes a otro negocio.**

Ver sección 5.2 sobre el patrón `SECURITY DEFINER` para evitar recursión.

Prueba explícitamente este comportamiento. No confíes exclusivamente en la protección de Next.js — la base de datos debe ser segura incluso si alguien manipula directamente las peticiones.

---

# 9. AUTENTICACIÓN **[REVISADO]**

Supabase Auth, con email + password. Implementar: registro, login, logout, recuperación de contraseña, protección de rutas, sesión persistente.

**Necesitas una ruta de callback** (`/auth/callback` o equivalente en App Router) para gestionar el intercambio de código en el flujo de recuperación de contraseña y confirmación de email de Supabase — no está implícito en "implementar reset password", es una pieza técnica obligatoria aparte.

El sistema debe impedir acceder al dashboard sin sesión válida.

Después del registro:
1. Crear usuario en Supabase Auth.
2. Crear `profile`.
3. Crear `business`.
4. Crear `business_member` con role `owner`.
5. Crear `business_settings`.
6. Redirigir al onboarding/dashboard.

---

# 10. ONBOARDING

Máximo 3 pasos:
1. Nombre del negocio.
2. Nombre del profesional.
3. Crear primer servicio (nombre + duración).

Al terminar: "Tu agenda está lista." CTA: "Ir a mi agenda". No hacer un onboarding largo.

---

# 11. ESTRUCTURA DE RUTAS

```text
src/
  app/
    page.tsx
    login/page.tsx
    register/page.tsx
    forgot-password/page.tsx
    auth/callback/route.ts
    dashboard/
      layout.tsx
      page.tsx
      clientes/page.tsx
      clientes/[id]/page.tsx
      citas/page.tsx
      citas/[id]/page.tsx
      servicios/page.tsx
      configuracion/page.tsx
    privacidad/page.tsx
    terminos/page.tsx
```

Puedes modificar esta estructura si existe una razón arquitectónica clara.

---

# 12. DASHBOARD — PANTALLA PRINCIPAL

No crear un dashboard lleno de estadísticas. La prioridad es la agenda.

Header: logo Zazú, nombre del negocio, avatar/menú de usuario, navegación.

Resumen (números reales, no mock):
```text
Hoy: 3 citas
Mañana: 5 citas
Recordatorios pendientes: 2
```

---

# 13. VISTA "HOY"

Citas del día agrupadas cronológicamente. Cada cita muestra: hora, cliente, servicio, duración, estado, estado del recordatorio, acción WhatsApp.

```text
HOY · Miércoles 2 septiembre

09:00 — María López — Fisioterapia · 50 min — [Recordar por WhatsApp]
10:30 — Carlos Pérez — Fisioterapia · 50 min — [✓ Recordatorio enviado]
12:00 — Laura Gómez — Fisioterapia · 50 min — [Recordar por WhatsApp]
```

---

# 14. VISTA "MAÑANA"

Mostrar "Citas de mañana" con CTA "Recordar citas de mañana", que inicia el flujo secuencial de la sección 15.

---

# 15. FLUJO "RECORDAR CITAS DE MAÑANA"

```text
Recordatorios de mañana
1 de 5
María López — Mañana · 10:00 — Fisioterapia
[ Abrir WhatsApp ]
```

Al pulsar:
1. Generar mensaje.
2. Generar URL `wa.me`.
3. Abrir WhatsApp en nueva pestaña.
4. Marcar el recordatorio como `prepared`.
5. Mostrar: "¿Has enviado el mensaje?" con botones [ Sí, enviado ] / [ Volver ].

Si "Sí, enviado": actualizar `appointment_reminders.status = sent`, guardar `sent_at`, avanzar a la siguiente cita.

---

# 16. WHATSAPP

Utilidad centralizada en `src/lib/whatsapp.ts`, responsable de: normalizar teléfono, eliminar espacios y caracteres no válidos, gestionar `+34`, generar mensaje, codificar correctamente el mensaje, generar URL.

**[REVISADO] Formato correcto para `wa.me`:** el número debe ir en formato internacional sin el símbolo `+` y sin ceros a la izquierda: `https://wa.me/34600112233?text=...`. El texto debe pasarse por `encodeURIComponent`. Documenta explícitamente en el código qué transformación se aplica a cada tipo de entrada (número con `+34`, número con `0034`, número sin prefijo asumido como España).

**[NUEVO] Limitación explícita del MVP:** la normalización de teléfono asume números españoles (prefijo `+34`). Números internacionales no están soportados en el MVP — documentarlo en el código y en el README, no intentar soportar todos los países.

No utilizar la API de WhatsApp Business, Twilio, Zapier ni automatización externa.

---

# 17. MENSAJE DE WHATSAPP

Plantilla inicial:
> Hola {{client_name}}, te recordamos tu cita de {{service}} mañana a las {{time}} en {{business_name}}. ¡Te esperamos!

Generación dinámica, modificable desde configuración. Mostrar vista previa antes de abrir WhatsApp si aporta a la UX.

**[NUEVO] Nota de privacidad:** el nombre del cliente y los detalles de la cita viajan en la query string de la URL `wa.me`, lo que significa que quedan en el historial del navegador del profesional. Es una limitación inherente al enfoque `wa.me` (no hay alternativa sin usar la API de WhatsApp Business, fuera de alcance). Menciónalo en `/privacidad` como riesgo aceptado del MVP.

---

# 18. CREAR UNA CITA

CTA principal: "+ Nueva cita". Modal/drawer según dispositivo.

Campos: Cliente (combobox/buscador con opción "+ Crear nuevo cliente"), Servicio (selector), Fecha (date picker), Hora (selector), Duración (derivada del servicio), Notas (opcional).

CTA: "Agendar cita".

---

# 19. CREAR CLIENTE DURANTE LA CITA

No obligar a salir del formulario. Si el cliente no existe: "+ Nuevo cliente" → nombre, teléfono, notas opcionales. Guardar y continuar automáticamente con la cita.

Si ya existe un cliente con el mismo teléfono en el negocio, ofrecer usar ese cliente en vez de crear un duplicado.

---

# 20. VALIDACIÓN DE CITAS **[REVISADO]**

Antes de crear una cita: validar fecha, hora, servicio, cliente; calcular `ends_at`; comprobar solapamientos en la Server Action (para dar feedback amigable) **y confiar en el `EXCLUDE` constraint de la sección 6 como garantía final** ante condiciones de carrera.

Si el `INSERT` falla por el constraint de exclusión, capturar el error de Postgres y traducirlo a: "Ya tienes una cita a esa hora." Nunca mostrar el error SQL crudo al usuario.

---

# 21. CLIENTES **[REVISADO]**

Ruta: `/dashboard/clientes`

Listado: buscador, nombre, teléfono, número de citas, última cita, próxima cita. CTA "Nuevo cliente".

Ficha de cliente: datos básicos, próximas citas, historial de citas, editar, eliminar.

**Regla de eliminación (decidida, no ambigua):** si el cliente tiene citas futuras con estado distinto de `cancelled`, **bloquear el borrado** y mostrar: "Este cliente tiene citas futuras. Cancélalas o reagéndalas antes de eliminarlo." Si no tiene citas futuras activas, pedir confirmación explícita ("¿Seguro que quieres eliminar este cliente?") y proceder. No hay borrado silencioso de datos relacionados en ningún caso.

---

# 22. SERVICIOS

Ruta: `/dashboard/servicios`. CRUD sencillo: crear, editar, activar/desactivar. Campos: nombre, duración. No añadir precios en el MVP salvo razón clara.

---

# 23. CALENDARIO

Vista de calendario existe, pero **no debe dominar la aplicación** — el dashboard principal prioriza la lista de citas. Puede permitir: mes, semana (si es razonable), día seleccionado, crear cita, editar cita.

Usar `date-fns` / `date-fns-tz`. Timezone `Europe/Madrid` correctamente aplicado. No hacer manipulación ingenua de fechas con strings locales. Todas las fechas almacenadas como `TIMESTAMPTZ`.

---

# 24. ZONA HORARIA

Por defecto `Europe/Madrid`. No asumir que el servidor está en horario español. Toda presentación de fechas debe convertir correctamente al timezone del negocio (columna `businesses.timezone`, aunque en el MVP no haya UI para cambiarla). Preparar la arquitectura para múltiples timezones por negocio en el futuro.

---

# 25. CONFIGURACIÓN **[REVISADO]**

Ruta: `/dashboard/configuracion`

**Negocio**: nombre, nombre de contacto, teléfono.
**Recordatorios**: editor de plantilla, variables disponibles visibles.
**Cuenta**: email, cerrar sesión, eliminar cuenta.
**Suscripción**: sección preparada, mostrando inicialmente "Próximamente". No implementar Stripe todavía.

**Eliminar cuenta — comportamiento definido:**
- Requiere la Supabase Admin API (service role key), ejecutada **solo en un endpoint/Server Action server-side**, nunca expuesta al cliente.
- En el MVP, cada usuario es `owner` único de su negocio (no hay invitación de `member` implementada en la UI todavía), así que eliminar la cuenta del `owner` implica eliminar en cascada el negocio y todos sus datos (`clients`, `services`, `appointments`, `appointment_reminders`, `business_settings`) vía `ON DELETE CASCADE` en las foreign keys.
- Pedir confirmación explícita con texto claro sobre qué se va a borrar de forma irreversible.

---

# 26. LANDING PAGE

Landing profesional pero sencilla, sensación de SaaS español para pequeños profesionales, no estética genérica de "AI startup".

Hero: "No pierdas citas por un simple olvido."
Subtexto: "Zazú organiza tu agenda y te permite recordar a tus clientes por WhatsApp en segundos."
CTA: "Probar Zazú gratis"

Secciones: Cómo funciona (1. Añade la cita. 2. Recuerda al cliente. 3. Reduce las citas perdidas.), Por qué Zazú (Fácil, Rápido, Sin configuraciones complicadas, Pensado para autónomos), Precio ("Próximamente desde 9,90 €/mes" — no afirmar precios definitivos sin Stripe implementado).

---

# 27. DISEÑO VISUAL

Identidad propia. El nombre Zazú puede evocar un pequeño asistente/pájaro, pero **no copiar personajes, ilustraciones, logos ni elementos protegidos de Disney ni de El Rey León** — crear una identidad 100% original.

Estética: limpia, moderna, amable, profesional, minimalista. Paleta: azul como color principal, verde exclusivamente para acciones de WhatsApp, fondos claros, gris neutro para elementos secundarios. No abusar del verde — WhatsApp es un canal, no la identidad de marca.

---

# 28. RESPONSIVE DESIGN

Mobile-first. Móvil: navegación compacta, "Nueva cita" siempre accesible, citas en cards, botones grandes, formularios cómodos. Desktop: sidebar, contenido central, calendario/lista. Debe ser usable con una mano en móvil.

---

# 29. ESTADOS DE UI

Implementar siempre: loading, empty, error, success, disabled, optimistic feedback cuando tenga sentido. Nunca pantalla en blanco mientras carga.

Ejemplos: "Todavía no tienes clientes." → CTA "Añadir primer cliente". "Hoy no tienes ninguna cita." → CTA "Agendar una cita".

---

# 30. MANEJO DE ERRORES

Nunca mostrar errores de Postgrest/SQL crudos al usuario. Mensajes amigables. Registrar errores técnicos en consola/logs. Los formularios deben mantener los datos introducidos ante un error recuperable.

---

# 31. VALIDACIÓN

Zod en frontend y backend/Server Actions. No confiar solo en validación del navegador.

---

# 32. SUPABASE CLIENT

Cliente browser, cliente server, gestión de cookies/sesión, middleware si es necesario. Nunca exponer service role key, secretos ni credenciales privadas en código de navegador.

---

# 33. SERVER ACTIONS / MUTACIONES

Preferir Server Actions para escritura: crear/editar/eliminar cliente, crear/editar servicio, crear/editar/cancelar cita, actualizar recordatorio, actualizar configuración. Siempre validar autenticación y autorización en la propia acción, aunque exista RLS.

---

# 34. NO DUPLICAR LÓGICA

```text
src/
  lib/
    supabase/
    auth/
    whatsapp/
    dates/
    validations/
```

No repetir lógica de teléfonos, formato de fechas, permisos, generación de mensajes, consultas idénticas.

---

# 35. COMPONENTES

```text
components/
  ui/
  layout/
  dashboard/
  appointments/
  clients/
  services/
  whatsapp/
```

Ejemplos: `AppointmentCard`, `AppointmentForm`, `NewAppointmentDialog`, `ClientForm`, `ClientSelector`, `ServiceSelector`, `WhatsAppReminderButton`, `ReminderFlow`, `DayAppointments`, `DashboardSummary`, `EmptyState`, `LoadingState`, `ConfirmDialog`. No crear componentes gigantescos si pueden dividirse razonablemente.

---

# 36. ACCESIBILIDAD

Labels reales, navegación por teclado, focus states, aria-label cuando sea necesario, contraste suficiente, botones con nombres claros, modales accesibles. No usar emojis como único indicador semántico.

---

# 37. PWA

Manifest, iconos, nombre, descripción, theme, display standalone. No es necesario offline-first completo — la app necesita conexión para trabajar con Supabase.

---

# 38. RGPD / PRIVACIDAD

Diseñar respetando minimización, aislamiento, eliminación, transparencia. Crear `/privacidad` y `/terminos`, claramente identificadas como plantilla que debe revisar un profesional jurídico antes de producción — no inventar afirmaciones de cumplimiento legal.

En configuración: "Eliminar mi cuenta y mis datos" (ver comportamiento definido en sección 25).

---

# 39. DATOS DE DEMOSTRACIÓN

Seed/demo data para desarrollo: negocio demo, varios clientes, varios servicios, citas de hoy y de mañana, distintos estados de recordatorio. No introducir datos de demo en producción accidentalmente.

---

# 40. SUSCRIPCIONES

No implementar Stripe completo todavía. Dejar abstracción preparada (`Subscription`, `BillingService`, `Plan`) permitiendo en el futuro: `trial`, `active`, `past_due`, `cancelled`, `expired`. No bloquear el MVP por billing.

---

# 41. ANALÍTICA

No implementar Google Analytics ni trackers invasivos en el MVP. Si resulta útil, preparar eventos internos sencillos: `appointment_created`, `reminder_prepared`, `reminder_marked_sent`, `client_created`. No añadir plataforma externa sin necesidad.

---

# 42. SEO

Landing con title, description, Open Graph básico, favicon, metadata. El dashboard autenticado no necesita SEO.

---

# 43. TESTS **[REVISADO]**

**Unit tests**: normalización de teléfonos, generación de URL de WhatsApp, generación de mensajes, cálculo de duración, validaciones, timezone.

**Tests de integración**: crear cliente, crear cita, impedir solapamientos (incluyendo el constraint de BD, no solo la validación de aplicación), permisos multi-tenant (aislamiento cross-tenant).

Para probar RLS de verdad (no mockeada), levanta una instancia local de Supabase con `supabase start` (Supabase CLI + Docker) y ejecuta los tests de integración contra esa instancia local, aplicando las migraciones reales. No mockees las policies de RLS — el objetivo es probar la seguridad real de la base de datos.

**E2E** (si es razonable con el stack elegido): registro/login, crear cliente, crear cita, abrir recordatorio WhatsApp, marcar recordatorio como enviado.

No hacen falta cientos de tests — cubrir los caminos críticos.

---

# 44. SEGURIDAD

Revisar específicamente: RLS, XSS, CSRF cuando aplique, inyección SQL, exposición de secretos, autorización, acceso cross-tenant, inputs maliciosos, URLs externas, teléfonos manipulados, datos enviados desde cliente. No guardar información sensible innecesaria.

---

# 45. DOCUMENTACIÓN

`README.md` explicando: qué es Zazú, stack, requisitos, instalación, variables de entorno, configuración de Supabase, ejecución de migraciones, seed, desarrollo local, tests (incluyendo cómo levantar Supabase local para los tests de integración), deploy en Vercel.

`.env.example` sin secretos reales.

---

# 46. VARIABLES DE ENTORNO

Documentar como mínimo:
```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   # solo server-side, usado por Admin API (eliminar cuenta)
```

Si alguna funcionalidad futura requiere secrets adicionales, documentarlos sin incluir valores reales.

---

# 47. CALIDAD DEL CÓDIGO

TypeScript estricto, ESLint, Prettier si resulta apropiado, nombres descriptivos, componentes pequeños, funciones puras cuando sea posible.

Evitar: `any` salvo casos justificados, código duplicado, TODOs sin resolver, mocks en producción, credenciales hardcodeadas, queries sin autorización.

---

# 48. IMPORTANTE: NO CONSTRUIR UNA DEMO FALSA

No quiero botones que solo hagan `alert("Todo bien")`, ni datos hardcodeados en pantallas finales, ni `const fakeAppointments = [...]` fuera de tests/seed. La aplicación debe usar Supabase realmente.

---

# 49. ORDEN DE IMPLEMENTACIÓN

## FASE 0 — Auditoría
Inspecciona el repositorio, revisa `package.json`, configuración, variables de entorno disponibles, detecta conflictos. Si está vacío, inicializa el proyecto. Crea un breve plan interno de implementación.

## FASE 1 — Fundación
Next.js, TypeScript, Tailwind, shadcn/ui, Supabase, estructura base, layouts, navegación, theme, ESLint.

## FASE 2 — Base de datos
Migrations, tablas, índices, constraints (incluido el `EXCLUDE` de solapamiento y la función `SECURITY DEFINER`), RLS, policies. **Probar aislamiento multi-tenant antes de continuar — checkpoint (ver sección 0).**

## FASE 3 — Auth
Register, login, logout, reset password, ruta `/auth/callback`, protección de rutas, profile, business, membership.

## FASE 4 — Onboarding
Crear negocio, crear primer servicio, configuración inicial.

## FASE 5 — Clientes
CRUD completo, incluida la regla de eliminación de la sección 21.

## FASE 6 — Servicios
CRUD completo.

## FASE 7 — Citas
Crear, editar, cancelar, cambiar estado, detectar solapamientos (aplicación + constraint BD), fechas, timezone. **Checkpoint — confirmar que el constraint anti-solapamiento funciona ante escritura concurrente.**

## FASE 8 — Dashboard
Hoy, mañana, resumen, lista cronológica, calendario, nueva cita rápida.

## FASE 9 — WhatsApp
Normalización, generación de mensaje, URL, botón, reminder flow, estados.

## FASE 10 — Configuración
Negocio, plantilla WhatsApp, cuenta, eliminación de cuenta (Admin API server-side).

## FASE 11 — PWA + SEO
Manifest, iconos, metadata, landing, privacidad, términos.

## FASE 12 — Tests
Unit, integración (contra Supabase local), E2E de los caminos críticos.

## FASE 13 — Auditoría final
TypeScript, lint, tests, build, RLS, cross-tenant access, variables de entorno, errores de consola, responsive, accesibilidad básica, rutas protegidas, ausencia de mocks en producción. **Checkpoint final — resumen completo antes de dar el proyecto por terminado.**

---

# 50. CRITERIOS DE ACEPTACIÓN

El MVP se considera terminado cuando funcione este flujo:

```text
Registro → Login → Onboarding → Crear negocio → Crear servicio → Dashboard
→ Crear cliente → Crear cita → La cita aparece en "Hoy"
→ La cita aparece correctamente en calendario
→ Pulsar "Recordar por WhatsApp" → WhatsApp se abre con número y mensaje correctos
→ Usuario vuelve a Zazú → Marca "Enviado" → La cita muestra "Recordatorio enviado"
```

Y también:
```text
Usuario A → Negocio A
Usuario B → Negocio B
Usuario A NO puede ver datos de B. Usuario B NO puede ver datos de A.
```

---

# 51. UX PRINCIPAL

> "Zazú es una agenda sencilla que te permite recordar tus citas por WhatsApp en un clic."

Si una funcionalidad no contribuye a esa promesa, no la añadas al MVP.

---

# 52. REGLA DE ORO DE PRODUCTO

Entre (A) una funcionalidad más completa pero más complicada, y (B) una funcionalidad ligeramente menos potente pero muchísimo más sencilla: **elige B.**

---

# 53. COSAS QUE NO DEBES HACER

No añadas por iniciativa propia: chatbot, IA, marketplace, pagos entre clientes, reservas públicas, Google Calendar, Outlook, SMS, WhatsApp Business API, Twilio, Zapier, facturación, TPV, inventario, empleados, comisiones, estadísticas avanzadas, app móvil nativa.

Puedes dejar puntos de extensión arquitectónicos, pero no implementarlas.

---

# 54. FUTURO DEL PRODUCTO

**V2**: recordatorios automáticos, WhatsApp Business API, confirmaciones automáticas, enlaces de reserva, Google Calendar, múltiples empleados, estadísticas de no-shows.

**V3**: Stripe, planes, equipos, automatizaciones, verticalización por profesión.

No construir estas funcionalidades ahora.

---

# 55. PRINCIPIO DE DISEÑO IMPORTANTE

Evita: exceso de cards, gradientes innecesarios, gráficos que no aportan, demasiados colores, animaciones gratuitas, navegación complicada, modales anidados. Una aplicación que un autónomo pueda entender sin tutorial.

---

# 56. RESULTADO FINAL ESPERADO

```text
Zazú
├── aplicación Next.js funcional
├── Supabase correctamente integrado
├── PostgreSQL + RLS
├── Auth + multi-tenancy
├── onboarding, clientes, servicios, citas, calendario, dashboard
├── recordatorios WhatsApp
├── configuración
├── PWA, landing, privacidad, términos
├── tests, migrations, seed
├── README, .env.example
```

Debe poder ejecutarse con `npm install && npm run dev` y, una vez configuradas las variables de entorno y Supabase, funcionar realmente.

---

# 57. FORMA DE TRABAJAR

Ingeniero senior responsable del resultado completo. Antes de cada fase: comprende el código existente, identifica dependencias, implementa, ejecuta comprobaciones, corrige errores, continúa (respetando los checkpoints de la sección 0).

No te detengas tras crear solo la arquitectura. No entregues únicamente archivos o snippets sueltos — **construye la aplicación completa**, fase por fase.

Ante una decisión técnica ambigua: elige la opción más sencilla, segura, mantenible, coherente con Next.js + Supabase, y que minimice deuda técnica. No introduzcas una dependencia externa si la funcionalidad puede resolverse limpiamente con las herramientas ya elegidas.

---

# 58. DEFINICIÓN FINAL DE "DONE"

Compila, pasa TypeScript, pasa lint, pasan los tests (incluidos los de integración contra Supabase local), hace build, Supabase está correctamente integrado, RLS activo y probado (incluida la función `SECURITY DEFINER` sin recursión), aislamiento multi-tenant probado, Auth funciona, CRUD funciona, citas funcionan (incluido el constraint anti-solapamiento), calendario funciona, WhatsApp genera URLs válidas, el flujo de recordatorios funciona, UI responsive, sin datos mock en producción, sin secretos hardcodeados, README permite levantar el proyecto desde cero.

Al finalizar, proporciona un resumen de: arquitectura, funcionalidades implementadas, estructura de base de datos, seguridad/RLS, variables de entorno necesarias, cómo ejecutar el proyecto, tests ejecutados y resultado, qué queda explícitamente fuera del MVP, y cualquier decisión técnica importante que hayas tomado.

**Empieza ahora por inspeccionar el repositorio y ejecutar la FASE 0.**
