# Disponibilidad y horario laboral — diseño

Fecha: 2026-09-03

## Contexto y objetivo

Un profesional que recibe una llamada de un cliente para reservar cita
necesita ver rápido qué huecos tiene libres ese día, sin tener que
interpretar mentalmente la lista de citas ya agendadas contra su jornada
laboral. Hoy Zazú no sabe qué horario laboral tiene el negocio: solo
existen las citas ya creadas.

Este diseño añade:

1. Un horario laboral configurable por día de la semana (Configuración).
2. Una vista de disponibilidad en Citas → Calendario que, al seleccionar un
   día, muestra una línea de tiempo cronológica combinando huecos libres y
   citas ocupadas dentro del horario laboral de ese día.
3. El calendario de esa pestaña pasa de ~33% a 25% del ancho disponible en
   pantallas `sm:` y superiores, dejando más espacio a la línea de tiempo.

Fuera de alcance: franjas múltiples por día (solo un tramo abierto/cerrado
por día), reserva pública/online, sincronización con calendarios externos,
horario por empleado (el MVP es de un único profesional por negocio).

## 1. Modelo de datos

Nueva tabla `business_hours`, una fila por día de la semana y negocio:

```sql
create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0 = domingo ... 6 = sábado
  is_open boolean not null default true,
  starts_at time,
  ends_at time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_hours_business_day_unique unique (business_id, day_of_week),
  constraint business_hours_hours_check check (
    (is_open = false and starts_at is null and ends_at is null)
    or (is_open = true and starts_at is not null and ends_at is not null and ends_at > starts_at)
  )
);

create index business_hours_business_id_idx on public.business_hours (business_id);

create trigger set_business_hours_updated_at
  before update on public.business_hours
  for each row execute function public.set_updated_at();
```

RLS: mismo patrón que `business_settings` (select/insert/update/delete
condicionados a `is_business_member(business_id)`), en un nuevo bloque en
`002_rls.sql` o en una migración de RLS dedicada si se prefiere no tocar
archivos ya aplicados en producción (ver sección "Migraciones" más abajo).

`starts_at`/`ends_at` son `time without time zone`: representan una hora de
reloj local del negocio (p. ej. "09:00"), no un instante. La conversión a
instantes concretos (para restar contra `appointments.starts_at`, que sí es
`timestamptz`) ocurre en la capa de aplicación usando `business.timezone`,
igual que ya hace `dayRangeUtc` en `src/lib/dates/ranges.ts`.

### Provisión por defecto

`provision_business_for_current_user` (migración `004_provision_business.sql`)
inserta, junto a `business_settings`, las 7 filas de `business_hours` para
el negocio nuevo:

- Lunes a viernes (`day_of_week` 1-5): `is_open = true`, `09:00`–`18:00`.
- Sábado y domingo (`day_of_week` 0 y 6): `is_open = false`.

Esto se añade como sentencia extra dentro de la misma función
`security definer`, manteniendo la provisión atómica existente.

## 2. Configuración — sección "Horario laboral"

Nueva sección en `/dashboard/configuracion`, entre "Negocio" y
"Recordatorios":

- Un formulario (`WorkingHoursForm`, cliente) con una fila por día
  (lunes→domingo, ese orden fijo independientemente de `week_starts_on`):
  switch "Abierto" / "Cerrado" + dos `<input type="time">` (inicio, fin),
  deshabilitados cuando el switch está en "Cerrado".
- Un único botón "Guardar horario" envía las 7 filas en un solo submit
  (server action `updateBusinessHours`), no un guardado por fila — coherente
  con el patrón ya usado por `BusinessSettingsForm`/`ReminderTemplateForm`.
- Validación con Zod (`businessHoursSchema` en
  `src/lib/validations/business-hours.ts`): por cada día, si `isOpen` es
  true, `startsAt`/`endsAt` son obligatorios y `endsAt > startsAt`
  (comparación de strings `HH:mm`, ya normalizadas por el input nativo).
- La action hace un `upsert` de las 7 filas (`onConflict:
  "business_id,day_of_week"`), no un delete+insert, para no perder el `id`
  ni disparar cascadas innecesarias.

## 3. Cálculo de disponibilidad

Nuevo módulo puro `src/lib/scheduling/availability.ts`, sin acceso a
Supabase — recibe datos ya cargados y devuelve una estructura de
presentación:

```ts
export type AvailabilityBlock =
  | { type: "free"; startsAt: string; endsAt: string } // ISO, UTC
  | { type: "busy"; startsAt: string; endsAt: string; appointment: DayAppointmentItem };

export function computeDayAvailability(params: {
  dateStr: string; // "yyyy-MM-dd", día calendario en el timezone del negocio
  timezone: string;
  hours: { isOpen: boolean; startsAt: string | null; endsAt: string | null } | null; // fila de business_hours para ese day_of_week, o null si no existe aún
  appointments: DayAppointmentItem[]; // ya filtradas por ese día y status != cancelled, ordenadas por startsAt
  slotMinutes?: number; // default 30
}): AvailabilityBlock[]
```

Algoritmo:

1. Si `hours` es `null` o `hours.isOpen` es `false` → devuelve `[]` (la UI
   muestra "Cerrado ese día", ver sección 4).
2. Convierte `hours.startsAt`/`endsAt` (hora local "HH:mm") a instantes UTC
   del día `dateStr` en `timezone`, usando `fromZonedTime` (mismo mecanismo
   que `dayRangeUtc`). Esto da el rango laboral `[workStart, workEnd)`.
3. Recorre las citas ordenadas por `startsAt`, recortando cada cita al
   rango laboral (una cita que empieza antes de `workStart` o termina
   después de `workEnd` se recorta a los límites — no se asume que todas
   las citas caen dentro del horario configurado, porque el horario pudo
   cambiarse después de crear la cita).
4. Entre el final de un bloque ocupado (o `workStart` al principio) y el
   inicio del siguiente (o `workEnd` al final), calcula el hueco libre. Si
   su duración en minutos es `>= slotMinutes` (30 por defecto), se añade
   como bloque `free`; los huecos más cortos se descartan (no son útiles
   para agendar y evitan ruido visual entre citas seguidas).
5. Devuelve la lista de bloques `free`/`busy` en orden cronológico.

Este cálculo es una función pura y determinista — se cubre con tests
unitarios (ver sección Testing) sin necesidad de mockear Supabase.

## 4. Vista en Citas → Calendario

`src/components/appointments/appointments-calendar.tsx`:

- `Calendar`: `sm:basis-1/3` → `sm:basis-1/4` (25% del ancho, como se pidió).
- La columna lateral deja de usar `DayAppointments` y usa un nuevo
  `DayAvailability` (`src/components/appointments/day-availability.tsx`),
  que recibe los `AvailabilityBlock[]` ya calculados para el día
  seleccionado y los renderiza como una lista cronológica única:
  - Bloque `busy`: reutiliza el mismo layout que `DayAppointments` ya
    pinta hoy (hora, cliente, servicio, duración, estado, botón de
    recordatorio WhatsApp) — se extrae a un sub-componente compartido para
    no duplicar ese markup entre `DayAppointments` y `DayAvailability`.
  - Bloque `free`: fila con estilo visualmente secundario (fondo sutil,
    sin borde marcado) mostrando `"{HH:mm} – {HH:mm} · Libre"`.
  - Si el día está cerrado (`hours.isOpen === false` o no hay fila): mensaje
    "Cerrado este día" en vez de la lista.
- Esta vista sustituye la lista de citas **solo** dentro de la pestaña
  "Calendario" de `/dashboard/citas`. La pestaña "Próximas citas" no
  cambia y sigue usando `AppointmentCard`/`DayAppointments` como hoy. El
  Resumen del dashboard (`/dashboard`, vista Hoy/Mañana) tampoco cambia.

### Carga de datos

`src/app/dashboard/citas/page.tsx` ya carga `calendarAppointments` para el
rango de 2 meses atrás / 4 meses adelante y arma `appointmentsByDate`. Se
añade una carga adicional, en el mismo `Promise.all`:

```ts
supabase.from("business_hours").select("day_of_week, is_open, starts_at, ends_at").eq("business_id", businessId)
```

y se construye un mapa `hoursByDayOfWeek: Record<number, BusinessHoursRow>`
que se pasa a `AppointmentsCalendar`. El cálculo de `computeDayAvailability`
para el día seleccionado ocurre en el cliente (dentro de
`AppointmentsCalendar`, que ya es un componente cliente con `useState` para
el día seleccionado), usando `hoursByDayOfWeek[dayOfWeekOf(selectedDateStr)]`
y `appointmentsByDate[selectedDateStr]`.

## 5. Migraciones — nota sobre bases ya provisionadas

El negocio real de este proyecto ya existe en Supabase (creado antes de
esta feature). La migración de `business_hours` debe incluir un `insert`
retroactivo del horario por defecto para los negocios ya existentes que no
tengan filas en `business_hours` todavía, para que la funcionalidad no
aparezca "vacía"/rota para el negocio actual:

```sql
insert into public.business_hours (business_id, day_of_week, is_open, starts_at, ends_at)
select b.id, d.day_of_week,
  d.day_of_week between 1 and 5,
  case when d.day_of_week between 1 and 5 then '09:00'::time end,
  case when d.day_of_week between 1 and 5 then '18:00'::time end
from public.businesses b
cross join (select generate_series(0, 6) as day_of_week) d
on conflict (business_id, day_of_week) do nothing;
```

Esto va en la misma migración que crea la tabla (número siguiente
disponible: `007_business_hours.sql`), después de crear la tabla y antes de
activar RLS.

## Testing

- Unit tests para `computeDayAvailability`
  (`src/lib/scheduling/availability.test.ts`): día cerrado → `[]`; día
  abierto sin citas → un único bloque `free` igual al horario completo;
  citas que dejan huecos en medio; cita que empieza antes del horario
  laboral (se recorta); cita que termina después del horario laboral (se
  recorta); huecos menores a `slotMinutes` se descartan; varias citas
  seguidas sin hueco entre ellas.
- Unit test para `businessHoursSchema`: rechaza `endsAt <= startsAt`
  cuando `isOpen` es true; acepta `startsAt`/`endsAt` vacíos cuando
  `isOpen` es false.
- No se añaden tests de integración nuevos (el patrón de RLS ya está
  cubierto por `core-flows.integration.test.ts` para el resto de tablas;
  se sigue el mismo patrón de policies, no hay lógica nueva que RLS deba
  cubrir de forma distinta).

## Fuera de alcance (explícito)

- Franjas múltiples por día (p. ej. mañana y tarde con pausa).
- Horario distinto por servicio o por profesional/empleado.
- Bloqueos puntuales (vacaciones, festivos) — se podría añadir en el
  futuro como una tabla `business_closures` separada, no en este cambio.
- Cualquier UI de reserva pública/online para el cliente final.
