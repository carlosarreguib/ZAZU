# Disponibilidad y horario laboral — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir un horario laboral configurable por día de la semana y una vista de disponibilidad (huecos libres + citas ocupadas) en Citas → Calendario, para que el profesional pueda decir por teléfono qué horarios tiene libres.

**Architecture:** Nueva tabla `business_hours` (una fila por día de la semana, RLS igual que `business_settings`); nueva sección de formulario en Configuración que guarda las 7 filas en un solo submit; un módulo puro de cálculo de huecos (`computeDayAvailability`) que combina el horario laboral con las citas ya cargadas; la vista de Calendario en Citas sustituye su lista lateral por una línea de tiempo cronológica de bloques libres/ocupados, y el propio calendario reduce su ancho a 25%.

**Tech Stack:** Next.js App Router, TypeScript, Supabase (Postgres + RLS), Zod, date-fns / date-fns-tz, Tailwind, shadcn/ui (`Switch`, `Input type=time`), Vitest.

**Spec:** `docs/superpowers/specs/2026-09-03-disponibilidad-horario-laboral-design.md`

## Global Constraints

- Nunca formatear o comparar horas usando el timezone del servidor: siempre usar `business.timezone` con `formatInTimeZone`/`fromZonedTime` de `date-fns-tz`, igual que el resto del proyecto (`src/lib/dates/format.ts`, `src/lib/dates/ranges.ts`).
- RLS obligatorio en toda tabla nueva con datos de negocio: políticas select/insert/update/delete condicionadas a `public.is_business_member(business_id)`.
- Validación con Zod tanto en el cliente (mensajes de error) como en la Server Action (fuente de verdad) — nunca confiar solo en el `required` del HTML.
- No mostrar errores de Postgres/Supabase en la UI: siempre un mensaje amigable en español.
- Un solo botón "Guardar horario" que envía las 7 filas juntas — no autoguardado por fila.
- Solo un tramo abierto/cerrado por día (sin franjas múltiples) — fuera de alcance en este cambio.
- La pestaña "Próximas citas" de `/dashboard/citas` y el Resumen de `/dashboard` no cambian: solo la pestaña "Calendario" de Citas se ve afectada.

---

### Task 1: Migración SQL — tabla `business_hours` + RLS + provisión

**Files:**
- Create: `supabase/migrations/007_business_hours.sql`
- Modify: `supabase/migrations/004_provision_business.sql` (no se edita directamente — el proyecto ya aplicó esta migración en Supabase; el `insert` de horario por defecto para negocios nuevos va dentro de `007_business_hours.sql`, recreando la función `provision_business_for_current_user` con `create or replace function`)

**Interfaces:**
- Produces: tabla `public.business_hours(id uuid, business_id uuid, day_of_week int, is_open boolean, starts_at time, ends_at time, created_at timestamptz, updated_at timestamptz)`, con `unique(business_id, day_of_week)`. `day_of_week`: 0 = domingo … 6 = sábado (convención `Date.prototype.getDay()`/`getUTCDay()` de JS, que se usará en Task 4).
- Produces: función `public.provision_business_for_current_user(business_name text, contact_name text)` actualizada para insertar también las 7 filas de `business_hours` del negocio nuevo.

- [ ] **Step 1: Escribir la migración de tabla + RLS + backfill + provisión**

Crear `supabase/migrations/007_business_hours.sql`:

```sql
-- Zazú — horario laboral por día de la semana (spec: disponibilidad).
--
-- Una fila por negocio y día de la semana (0 = domingo ... 6 = sábado,
-- convención Date.getDay()). Solo un tramo abierto/cerrado por día en el
-- MVP: sin franjas múltiples.

create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
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

alter table public.business_hours enable row level security;

create policy "business_hours_select_member"
  on public.business_hours for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "business_hours_insert_member"
  on public.business_hours for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "business_hours_update_member"
  on public.business_hours for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "business_hours_delete_member"
  on public.business_hours for delete
  to authenticated
  using (public.is_business_member(business_id));

-- Backfill retroactivo: negocios ya existentes (creados antes de esta
-- migración) reciben el horario por defecto L-V 09:00-18:00, S/D cerrado.
insert into public.business_hours (business_id, day_of_week, is_open, starts_at, ends_at)
select
  b.id,
  d.day_of_week,
  d.day_of_week between 1 and 5,
  case when d.day_of_week between 1 and 5 then '09:00'::time end,
  case when d.day_of_week between 1 and 5 then '18:00'::time end
from public.businesses b
cross join (select generate_series(0, 6) as day_of_week) d
on conflict (business_id, day_of_week) do nothing;

-- Provisión de negocios nuevos: añade el mismo horario por defecto al
-- flujo atómico de registro (create or replace conserva los grants ya
-- otorgados sobre la función).
create or replace function public.provision_business_for_current_user(
  business_name text,
  contact_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_business_id uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  insert into public.profiles (id, email, full_name)
  select auth.uid(), u.email, contact_name
  from auth.users u
  where u.id = auth.uid()
  on conflict (id) do update set full_name = excluded.full_name;

  insert into public.businesses (name, contact_name)
  values (business_name, contact_name)
  returning id into new_business_id;

  insert into public.business_members (business_id, user_id, role)
  values (new_business_id, auth.uid(), 'owner');

  insert into public.business_settings (business_id)
  values (new_business_id);

  insert into public.business_hours (business_id, day_of_week, is_open, starts_at, ends_at)
  select
    new_business_id,
    d.day_of_week,
    d.day_of_week between 1 and 5,
    case when d.day_of_week between 1 and 5 then '09:00'::time end,
    case when d.day_of_week between 1 and 5 then '18:00'::time end
  from (select generate_series(0, 6) as day_of_week) d;

  return new_business_id;
end;
$$;
```

- [ ] **Step 2: Aplicar la migración contra el proyecto Supabase remoto**

Este proyecto usa un Supabase remoto real (ver `.env.local`, `NEXT_PUBLIC_SUPABASE_URL`). Antes de aplicar contra datos reales, confirmar con el usuario (aplicar una migración de esquema es una acción difícil de revertir sobre datos compartidos). Usar la herramienta MCP de Supabase disponible (`apply_migration`) con `project_id` del proyecto `ZAZU` (buscarlo con `list_projects` si no se conoce el id), `name: "business_hours"` y el contenido completo del Step 1 como `query`.

- [ ] **Step 3: Verificar el resultado**

Ejecutar una consulta de verificación (vía `execute_sql` de la herramienta MCP de Supabase o `list_tables`) para confirmar:
- La tabla `business_hours` existe con las columnas esperadas.
- El negocio real ya existente tiene 7 filas en `business_hours` (una por `day_of_week` 0-6) tras el backfill.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/007_business_hours.sql
git commit -m "Añade tabla business_hours con RLS y provisión por defecto"
```

---

### Task 2: Tipos de Supabase — añadir `business_hours`

**Files:**
- Modify: `src/lib/supabase/database.types.ts`

**Interfaces:**
- Consumes: nada de tareas anteriores (lee el esquema aplicado en Task 1).
- Produces: tipo `Database["public"]["Tables"]["business_hours"]` con `Row`, `Insert`, `Update`, usado por Task 3 y Task 6 al tipar las respuestas de Supabase.

- [ ] **Step 1: Leer el archivo actual para localizar el patrón de una tabla existente**

Abrir `src/lib/supabase/database.types.ts` y localizar el bloque de `business_settings` (mismo patrón 1:1 con `businesses`, buena referencia de forma).

- [ ] **Step 2: Añadir el bloque `business_hours` dentro de `Tables`**

Insertar, en orden alfabético junto a los demás bloques (justo antes o después de `business_members`, según el orden ya usado en el archivo), lo siguiente:

```ts
      business_hours: {
        Row: {
          id: string;
          business_id: string;
          day_of_week: number;
          is_open: boolean;
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          day_of_week: number;
          is_open?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
        };
        Update: {
          is_open?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "business_hours_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
```

Nota: `starts_at`/`ends_at` son columnas Postgres `time` — Supabase-js las serializa como string `"HH:mm:ss"`, de ahí `string | null` en el tipo.

- [ ] **Step 3: Verificar TypeScript**

Run: `node ./node_modules/typescript/bin/tsc --noEmit`
Expected: sin errores (este cambio solo añade un tipo, no debería romper nada existente).

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/database.types.ts
git commit -m "Añade tipos de business_hours"
```

---

### Task 3: Validación Zod — `businessHoursSchema`

**Files:**
- Create: `src/lib/validations/business-hours.ts`
- Test: `src/lib/validations/business-hours.test.ts`

**Interfaces:**
- Produces: `businessHoursSchema` (Zod), tipo `BusinessHoursInput = z.infer<typeof businessHoursSchema>`, y el tipo de un día individual `DayHoursInput`. Consumido por Task 6 (action) y Task 7 (formulario).

- [ ] **Step 1: Escribir los tests que definen el contrato del schema**

Crear `src/lib/validations/business-hours.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { businessHoursSchema } from "./business-hours";

function dayInput(overrides: Partial<{ dayOfWeek: number; isOpen: boolean; startsAt: string; endsAt: string }> = {}) {
  return {
    dayOfWeek: 1,
    isOpen: true,
    startsAt: "09:00",
    endsAt: "18:00",
    ...overrides,
  };
}

describe("businessHoursSchema", () => {
  it("acepta 7 días abiertos con horas válidas", () => {
    const days = Array.from({ length: 7 }, (_, i) => dayInput({ dayOfWeek: i }));
    const result = businessHoursSchema.safeParse({ days });
    expect(result.success).toBe(true);
  });

  it("acepta un día cerrado sin horas", () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      i === 0
        ? { dayOfWeek: 0, isOpen: false, startsAt: "", endsAt: "" }
        : dayInput({ dayOfWeek: i }),
    );
    const result = businessHoursSchema.safeParse({ days });
    expect(result.success).toBe(true);
  });

  it("rechaza un día abierto sin hora de inicio", () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      i === 0 ? dayInput({ dayOfWeek: 0, startsAt: "" }) : dayInput({ dayOfWeek: i }),
    );
    const result = businessHoursSchema.safeParse({ days });
    expect(result.success).toBe(false);
  });

  it("rechaza un día abierto donde la hora de fin no es posterior a la de inicio", () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      i === 0
        ? dayInput({ dayOfWeek: 0, startsAt: "18:00", endsAt: "09:00" })
        : dayInput({ dayOfWeek: i }),
    );
    const result = businessHoursSchema.safeParse({ days });
    expect(result.success).toBe(false);
  });

  it("rechaza horas de fin iguales a las de inicio", () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      i === 0
        ? dayInput({ dayOfWeek: 0, startsAt: "09:00", endsAt: "09:00" })
        : dayInput({ dayOfWeek: i }),
    );
    const result = businessHoursSchema.safeParse({ days });
    expect(result.success).toBe(false);
  });

  it("rechaza si no vienen exactamente 7 días", () => {
    const days = Array.from({ length: 6 }, (_, i) => dayInput({ dayOfWeek: i }));
    const result = businessHoursSchema.safeParse({ days });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Ejecutar los tests para verificar que fallan**

Run: `node ./node_modules/vitest/vitest.mjs run src/lib/validations/business-hours.test.ts`
Expected: FAIL — `Cannot find module './business-hours'`.

- [ ] **Step 3: Implementar el schema**

Crear `src/lib/validations/business-hours.ts`:

```ts
import { z } from "zod";

const dayHoursSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isOpen: z.boolean(),
    startsAt: z.string().trim(),
    endsAt: z.string().trim(),
  })
  .superRefine((day, ctx) => {
    if (!day.isOpen) return;

    if (!day.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startsAt"],
        message: "Indica la hora de inicio",
      });
    }
    if (!day.endsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "Indica la hora de fin",
      });
    }
    if (day.startsAt && day.endsAt && day.endsAt <= day.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "La hora de fin debe ser posterior a la de inicio",
      });
    }
  });

export const businessHoursSchema = z.object({
  days: z.array(dayHoursSchema).length(7, "Faltan días de la semana"),
});

export type DayHoursInput = z.infer<typeof dayHoursSchema>;
export type BusinessHoursInput = z.infer<typeof businessHoursSchema>;
```

Nota: la comparación `day.endsAt <= day.startsAt` es una comparación de strings `"HH:mm"`, válida lexicográficamente porque el formato es de ancho fijo con ceros a la izquierda (igual que ya asume el resto del proyecto para horas en formato `HH:mm`).

- [ ] **Step 4: Ejecutar los tests para verificar que pasan**

Run: `node ./node_modules/vitest/vitest.mjs run src/lib/validations/business-hours.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations/business-hours.ts src/lib/validations/business-hours.test.ts
git commit -m "Añade validación Zod para el horario laboral"
```

---

### Task 4: Cálculo de disponibilidad — `computeDayAvailability`

**Files:**
- Create: `src/lib/scheduling/availability.ts`
- Test: `src/lib/scheduling/availability.test.ts`

**Interfaces:**
- Consumes: tipo `DayAppointmentItem` de `src/components/dashboard/day-appointments.tsx` (ya existe: `{ id: string; startsAt: string; clientName: string; serviceName: string | null; durationMinutes: number | null; status: string; reminderStatus: string | null }`).
- Produces: tipo `AvailabilityBlock` y función `computeDayAvailability(params)`. Consumido por Task 10 (`AppointmentsCalendar`).

- [ ] **Step 1: Escribir los tests que definen el comportamiento**

Crear `src/lib/scheduling/availability.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { computeDayAvailability, type AvailabilityBlock } from "./availability";
import type { DayAppointmentItem } from "@/components/dashboard/day-appointments";

const TIMEZONE = "Europe/Madrid";
const DATE = "2026-09-03"; // jueves

function appt(overrides: Partial<DayAppointmentItem> & { startsAt: string; endsAt?: string }): DayAppointmentItem {
  return {
    id: "appt-1",
    clientName: "Cliente",
    serviceName: "Servicio",
    durationMinutes: 30,
    status: "scheduled",
    reminderStatus: null,
    ...overrides,
  };
}

describe("computeDayAvailability", () => {
  it("devuelve [] si el día está cerrado", () => {
    const result = computeDayAvailability({
      dateStr: DATE,
      timezone: TIMEZONE,
      hours: { isOpen: false, startsAt: null, endsAt: null },
      appointments: [],
    });
    expect(result).toEqual([]);
  });

  it("devuelve [] si no hay fila de horario para ese día", () => {
    const result = computeDayAvailability({
      dateStr: DATE,
      timezone: TIMEZONE,
      hours: null,
      appointments: [],
    });
    expect(result).toEqual([]);
  });

  it("un día abierto sin citas es un único bloque libre de horario completo", () => {
    const result = computeDayAvailability({
      dateStr: DATE,
      timezone: TIMEZONE,
      hours: { isOpen: true, startsAt: "09:00", endsAt: "18:00" },
      appointments: [],
    });
    expect(result).toEqual([
      {
        type: "free",
        startsAt: "2026-09-03T07:00:00.000Z",
        endsAt: "2026-09-03T16:00:00.000Z",
      },
    ] satisfies AvailabilityBlock[]);
  });

  it("una cita en medio del horario genera libre-ocupado-libre", () => {
    const busyAppt = appt({
      id: "appt-mid",
      startsAt: "2026-09-03T09:00:00.000Z", // 11:00 en Europe/Madrid (CEST, UTC+2)
    });
    const result = computeDayAvailability({
      dateStr: DATE,
      timezone: TIMEZONE,
      hours: { isOpen: true, startsAt: "09:00", endsAt: "18:00" },
      appointments: [busyAppt],
      // la cita dura 30 min según appt(): 11:00-11:30 hora local
    });

    expect(result).toEqual([
      { type: "free", startsAt: "2026-09-03T07:00:00.000Z", endsAt: "2026-09-03T09:00:00.000Z" },
      { type: "busy", startsAt: "2026-09-03T09:00:00.000Z", endsAt: "2026-09-03T09:30:00.000Z", appointment: busyAppt },
      { type: "free", startsAt: "2026-09-03T09:30:00.000Z", endsAt: "2026-09-03T16:00:00.000Z" },
    ] satisfies AvailabilityBlock[]);
  });

  it("una cita que empieza antes del horario laboral se recorta al inicio del horario", () => {
    const busyAppt = appt({
      id: "appt-early",
      startsAt: "2026-09-03T06:00:00.000Z", // 08:00 local, antes de las 09:00 de apertura
    });
    const result = computeDayAvailability({
      dateStr: DATE,
      timezone: TIMEZONE,
      hours: { isOpen: true, startsAt: "09:00", endsAt: "18:00" },
      appointments: [busyAppt],
    });

    expect(result[0]).toEqual({
      type: "busy",
      startsAt: "2026-09-03T07:00:00.000Z", // recortado a las 09:00 local = 07:00 UTC
      endsAt: "2026-09-03T07:30:00.000Z", // fin real de la cita (08:30 local), sin recorte porque cae dentro del horario
      appointment: busyAppt,
    });
  });

  it("descarta huecos libres menores al tamaño de slot (30 min por defecto)", () => {
    const first = appt({
      id: "appt-1",
      startsAt: "2026-09-03T07:00:00.000Z", // 09:00 local
    });
    const second = appt({
      id: "appt-2",
      startsAt: "2026-09-03T07:40:00.000Z", // 09:40 local, deja un hueco de 10 min tras la primera cita (09:30-09:40)
    });
    const result = computeDayAvailability({
      dateStr: DATE,
      timezone: TIMEZONE,
      hours: { isOpen: true, startsAt: "09:00", endsAt: "18:00" },
      appointments: [first, second],
    });

    const freeBlocks = result.filter((b) => b.type === "free");
    // No debe existir un hueco libre de 10 minutos entre las dos citas.
    expect(freeBlocks.some((b) => b.startsAt === "2026-09-03T07:30:00.000Z")).toBe(false);
  });

  it("varias citas seguidas sin hueco entre ellas no generan bloque libre intermedio", () => {
    const first = appt({ id: "appt-1", startsAt: "2026-09-03T07:00:00.000Z" }); // 09:00-09:30 local
    const second = appt({ id: "appt-2", startsAt: "2026-09-03T07:30:00.000Z" }); // 09:30-10:00 local, contigua
    const result = computeDayAvailability({
      dateStr: DATE,
      timezone: TIMEZONE,
      hours: { isOpen: true, startsAt: "09:00", endsAt: "18:00" },
      appointments: [first, second],
    });

    const busyBlocks = result.filter((b) => b.type === "busy");
    expect(busyBlocks).toHaveLength(2);
    expect(result.find((b) => b.type === "free" && b.startsAt === "2026-09-03T07:30:00.000Z")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Ejecutar los tests para verificar que fallan**

Run: `node ./node_modules/vitest/vitest.mjs run src/lib/scheduling/availability.test.ts`
Expected: FAIL — `Cannot find module './availability'`.

- [ ] **Step 3: Implementar `computeDayAvailability`**

Crear `src/lib/scheduling/availability.ts`:

```ts
import { fromZonedTime } from "date-fns-tz";
import type { DayAppointmentItem } from "@/components/dashboard/day-appointments";

export type AvailabilityBlock =
  | { type: "free"; startsAt: string; endsAt: string }
  | { type: "busy"; startsAt: string; endsAt: string; appointment: DayAppointmentItem };

type DayHours = {
  isOpen: boolean;
  startsAt: string | null; // "HH:mm" o "HH:mm:ss"
  endsAt: string | null;
};

function toHhMm(time: string): string {
  return time.slice(0, 5);
}

function localTimeToUtcIso(dateStr: string, hhmm: string, timezone: string): string {
  return fromZonedTime(`${dateStr}T${hhmm}:00`, timezone).toISOString();
}

export function computeDayAvailability(params: {
  dateStr: string;
  timezone: string;
  hours: DayHours | null;
  appointments: DayAppointmentItem[];
  slotMinutes?: number;
}): AvailabilityBlock[] {
  const { dateStr, timezone, hours, appointments, slotMinutes = 30 } = params;

  if (!hours || !hours.isOpen || !hours.startsAt || !hours.endsAt) {
    return [];
  }

  const workStart = localTimeToUtcIso(dateStr, toHhMm(hours.startsAt), timezone);
  const workEnd = localTimeToUtcIso(dateStr, toHhMm(hours.endsAt), timezone);

  const sorted = [...appointments].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const blocks: AvailabilityBlock[] = [];
  let cursor = workStart;

  for (const appointment of sorted) {
    const apptStart = appointment.startsAt;
    const apptEnd = new Date(
      new Date(appointment.startsAt).getTime() + (appointment.durationMinutes ?? 0) * 60_000,
    ).toISOString();

    const clippedStart = apptStart < workStart ? workStart : apptStart;
    const clippedEnd = apptEnd > workEnd ? workEnd : apptEnd;

    if (clippedEnd <= cursor || clippedStart >= workEnd) {
      // La cita cae fuera del rango restante (ya cubierta o después del cierre).
      continue;
    }

    const gapMinutes = (new Date(clippedStart).getTime() - new Date(cursor).getTime()) / 60_000;
    if (gapMinutes >= slotMinutes) {
      blocks.push({ type: "free", startsAt: cursor, endsAt: clippedStart });
    }

    blocks.push({ type: "busy", startsAt: clippedStart, endsAt: clippedEnd, appointment });
    cursor = clippedEnd > cursor ? clippedEnd : cursor;
  }

  const tailMinutes = (new Date(workEnd).getTime() - new Date(cursor).getTime()) / 60_000;
  if (tailMinutes >= slotMinutes) {
    blocks.push({ type: "free", startsAt: cursor, endsAt: workEnd });
  }

  return blocks;
}
```

- [ ] **Step 4: Ejecutar los tests para verificar que pasan**

Run: `node ./node_modules/vitest/vitest.mjs run src/lib/scheduling/availability.test.ts`
Expected: PASS (7 tests). Si algún test de horas UTC falla por DST (verano/invierno), ajustar los valores UTC esperados en el test: en septiembre España está en CEST (UTC+2), por eso 09:00 local = 07:00 UTC en los tests de arriba.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scheduling/availability.ts src/lib/scheduling/availability.test.ts
git commit -m "Añade cálculo puro de disponibilidad diaria"
```

---

### Task 5: Regenerar tipos y comprobar build tras la migración

**Files:**
- No se crean ni modifican archivos de código en esta tarea (solo verificación).

**Interfaces:**
- Consumes: tabla `business_hours` aplicada en Task 1, tipos añadidos en Task 2.

- [ ] **Step 1: Ejecutar TypeScript**

Run: `node ./node_modules/typescript/bin/tsc --noEmit`
Expected: sin errores.

- [ ] **Step 2: Ejecutar toda la suite de tests unitarios**

Run: `node ./node_modules/vitest/vitest.mjs run`
Expected: todos los tests existentes siguen en verde, más los nuevos de Task 3 y Task 4.

- [ ] **Step 3: Ejecutar build de Next.js**

Run: `node ./node_modules/next/dist/bin/next build`
Expected: build exitoso, sin nuevas rutas rotas.

(No hay commit en esta tarea: es solo un checkpoint de verificación antes de construir la UI sobre la nueva tabla.)

---

### Task 6: Server Action — `updateBusinessHours`

**Files:**
- Modify: `src/app/dashboard/configuracion/actions.ts`

**Interfaces:**
- Consumes: `businessHoursSchema` de `src/lib/validations/business-hours.ts` (Task 3); `requireBusiness()` de `src/lib/auth/session.ts` (ya existe).
- Produces: tipo `BusinessHoursFormState = { error?: string; fieldErrors?: Record<number, { startsAt?: string; endsAt?: string }>; success?: boolean }` y función `updateBusinessHours(_prevState, formData)`. Consumido por Task 7 (`WorkingHoursForm`).

- [ ] **Step 1: Añadir el tipo de estado y la action al final de `actions.ts`**

Añadir el import al principio del archivo (junto a los ya existentes):

```ts
import { businessHoursSchema } from "@/lib/validations/business-hours";
```

Añadir al final de `src/app/dashboard/configuracion/actions.ts`:

```ts
export type BusinessHoursFormState = {
  error?: string;
  fieldErrors?: Record<number, { startsAt?: string; endsAt?: string }>;
  success?: boolean;
};

export async function updateBusinessHours(
  _prevState: BusinessHoursFormState,
  formData: FormData,
): Promise<BusinessHoursFormState> {
  const raw = formData.get("days");
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(String(raw ?? "[]"));
  } catch {
    return { error: "Formato de horario no válido." };
  }

  const parsed = businessHoursSchema.safeParse({ days: parsedJson });

  if (!parsed.success) {
    const fieldErrors: Record<number, { startsAt?: string; endsAt?: string }> = {};
    for (const issue of parsed.error.issues) {
      const dayIndex = issue.path[1];
      const field = issue.path[2];
      if (typeof dayIndex !== "number") continue;
      fieldErrors[dayIndex] ??= {};
      if (field === "startsAt") fieldErrors[dayIndex].startsAt = issue.message;
      if (field === "endsAt") fieldErrors[dayIndex].endsAt = issue.message;
    }
    return { fieldErrors, error: "Revisa los horarios marcados." };
  }

  const { supabase, businessId } = await requireBusiness();

  const rows = parsed.data.days.map((day) => ({
    business_id: businessId,
    day_of_week: day.dayOfWeek,
    is_open: day.isOpen,
    starts_at: day.isOpen ? day.startsAt : null,
    ends_at: day.isOpen ? day.endsAt : null,
  }));

  const { error } = await supabase
    .from("business_hours")
    .upsert(rows, { onConflict: "business_id,day_of_week" });

  if (error) {
    return { error: "No se pudo guardar el horario. Inténtalo de nuevo." };
  }

  revalidatePath("/dashboard/configuracion");
  revalidatePath("/dashboard/citas");
  return { success: true };
}
```

Nota: se envía `days` como un único campo JSON en el `FormData` (en vez de 7×2 campos sueltos) porque el formulario es una lista dinámica de filas gestionada en cliente (Task 7) — es más simple serializar el array completo que reconstruirlo desde nombres de campo indexados.

- [ ] **Step 2: Verificar TypeScript**

Run: `node ./node_modules/typescript/bin/tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/configuracion/actions.ts
git commit -m "Añade server action para guardar el horario laboral"
```

---

### Task 7: Formulario de configuración — `WorkingHoursForm`

**Files:**
- Create: `src/components/settings/working-hours-form.tsx`
- Modify: `src/app/dashboard/configuracion/page.tsx`

**Interfaces:**
- Consumes: `updateBusinessHours`, `BusinessHoursFormState` de Task 6; componentes `Switch` (`src/components/ui/switch.tsx`), `Input`, `Label`, `Button` ya existentes.
- Produces: componente `WorkingHoursForm({ defaultDays })`, `defaultDays: { dayOfWeek: number; isOpen: boolean; startsAt: string; endsAt: string }[]` (longitud 7, orden lunes→domingo).

- [ ] **Step 1: Crear el componente de formulario**

Crear `src/components/settings/working-hours-form.tsx`:

```tsx
"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  updateBusinessHours,
  type BusinessHoursFormState,
} from "@/app/dashboard/configuracion/actions";

const initialState: BusinessHoursFormState = {};

const DAY_LABELS: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  0: "Domingo",
};

// Orden de visualización fijo lunes→domingo, independiente de week_starts_on.
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export type DayHoursValue = {
  dayOfWeek: number;
  isOpen: boolean;
  startsAt: string;
  endsAt: string;
};

export function WorkingHoursForm({
  defaultDays,
}: {
  defaultDays: DayHoursValue[];
}) {
  const [state, formAction, isPending] = useActionState(
    updateBusinessHours,
    initialState,
  );
  const [days, setDays] = useState<DayHoursValue[]>(defaultDays);

  function updateDay(dayOfWeek: number, patch: Partial<DayHoursValue>) {
    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)),
    );
  }

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <input type="hidden" name="days" value={JSON.stringify(days)} />

      <div className="flex flex-col gap-3">
        {DISPLAY_ORDER.map((dayOfWeek) => {
          const day = days.find((d) => d.dayOfWeek === dayOfWeek);
          if (!day) return null;
          const dayErrors = state.fieldErrors?.[dayOfWeek];

          return (
            <div
              key={dayOfWeek}
              className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="flex items-center gap-2 sm:w-32">
                <Switch
                  checked={day.isOpen}
                  onCheckedChange={(checked) =>
                    updateDay(dayOfWeek, { isOpen: checked })
                  }
                  aria-label={`${DAY_LABELS[dayOfWeek]} ${day.isOpen ? "abierto" : "cerrado"}`}
                />
                <span className="text-sm font-medium">{DAY_LABELS[dayOfWeek]}</span>
              </div>

              {day.isOpen ? (
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-start">
                  <div className="flex flex-1 flex-col gap-1">
                    <Label htmlFor={`starts-${dayOfWeek}`} className="sr-only">
                      Hora de inicio, {DAY_LABELS[dayOfWeek]}
                    </Label>
                    <Input
                      id={`starts-${dayOfWeek}`}
                      type="time"
                      value={day.startsAt}
                      onChange={(e) =>
                        updateDay(dayOfWeek, { startsAt: e.target.value })
                      }
                      aria-invalid={Boolean(dayErrors?.startsAt)}
                    />
                    {dayErrors?.startsAt ? (
                      <p className="text-xs text-destructive">{dayErrors.startsAt}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <Label htmlFor={`ends-${dayOfWeek}`} className="sr-only">
                      Hora de fin, {DAY_LABELS[dayOfWeek]}
                    </Label>
                    <Input
                      id={`ends-${dayOfWeek}`}
                      type="time"
                      value={day.endsAt}
                      onChange={(e) =>
                        updateDay(dayOfWeek, { endsAt: e.target.value })
                      }
                      aria-invalid={Boolean(dayErrors?.endsAt)}
                    />
                    {dayErrors?.endsAt ? (
                      <p className="text-xs text-destructive">{dayErrors.endsAt}</p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="flex-1 text-sm text-muted-foreground">Cerrado</p>
              )}
            </div>
          );
        })}
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-primary">Horario guardado correctamente.</p>
      ) : null}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Guardando..." : "Guardar horario"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Cargar `business_hours` en la página de configuración y montar la sección**

En `src/app/dashboard/configuracion/page.tsx`, añadir el import:

```ts
import { WorkingHoursForm, type DayHoursValue } from "@/components/settings/working-hours-form";
```

Añadir, junto a la carga existente de `settings` (mismo `await`, antes del `return`):

```ts
  const { data: hoursRows } = await supabase
    .from("business_hours")
    .select("day_of_week, is_open, starts_at, ends_at")
    .eq("business_id", businessId);

  const defaultDays: DayHoursValue[] = Array.from({ length: 7 }, (_, dayOfWeek) => {
    const row = hoursRows?.find((r) => r.day_of_week === dayOfWeek);
    return {
      dayOfWeek,
      isOpen: row?.is_open ?? false,
      startsAt: row?.starts_at?.slice(0, 5) ?? "",
      endsAt: row?.ends_at?.slice(0, 5) ?? "",
    };
  });
```

Añadir la sección en el JSX, entre la sección "Negocio" y la sección "Recordatorios" (después del `</section>` de Negocio y su `<Separator />`, antes del `<section>` de Recordatorios):

```tsx
      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Horario laboral</h2>
        <WorkingHoursForm defaultDays={defaultDays} />
      </section>
```

- [ ] **Step 3: Verificar TypeScript**

Run: `node ./node_modules/typescript/bin/tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Verificación manual en navegador**

Levantar el servidor de desarrollo (`node ./node_modules/next/dist/bin/next dev`), iniciar sesión, ir a `/dashboard/configuracion`, comprobar:
- La sección "Horario laboral" aparece con 7 filas en orden lunes→domingo.
- L-V muestran horas 09:00-18:00 (o los valores reales del backfill), S/D muestran "Cerrado".
- Cambiar una hora, pulsar "Guardar horario", recargar la página y comprobar que el cambio persiste.
- Marcar un día como cerrado, guardar, comprobar que sus inputs de hora desaparecen y al reabrir la página sigue cerrado.
- Probar un caso inválido (hora de fin antes que la de inicio en un día abierto) y comprobar que aparece el mensaje de error sin que la página se rompa.

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/working-hours-form.tsx src/app/dashboard/configuracion/page.tsx
git commit -m "Añade formulario de horario laboral en Configuración"
```

---

### Task 8: Extraer `AppointmentListItem` compartido para citas ocupadas

**Files:**
- Create: `src/components/appointments/appointment-list-item.tsx`
- Modify: `src/components/dashboard/day-appointments.tsx`

**Interfaces:**
- Consumes: `DayAppointmentItem` (ya existe en `day-appointments.tsx`), `APPOINTMENT_STATUS_LABELS` (`src/lib/validations/appointment.ts`), `WhatsAppReminderButton` (`src/components/whatsapp/whatsapp-reminder-button.tsx`), `formatTime` (`src/lib/dates/format.ts`).
- Produces: componente `AppointmentListItem({ appointment, timezone })`. Consumido por `DayAppointments` (modificado en esta tarea) y por `DayAvailability` (Task 9).

- [ ] **Step 1: Extraer el `<li>` de cita ocupada a un componente propio**

Crear `src/components/appointments/appointment-list-item.tsx` con el markup que hoy vive dentro del `.map` de `DayAppointments`:

```tsx
import Link from "next/link";
import { formatTime } from "@/lib/dates/format";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/validations/appointment";
import { WhatsAppReminderButton } from "@/components/whatsapp/whatsapp-reminder-button";
import type { DayAppointmentItem } from "@/components/dashboard/day-appointments";

export function AppointmentListItem({
  appointment,
  timezone,
}: {
  appointment: DayAppointmentItem;
  timezone: string;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-baseline gap-3">
        <span className="text-lg font-semibold tabular-nums">
          {formatTime(appointment.startsAt, timezone)}
        </span>
        <div>
          <Link
            href={`/dashboard/citas/${appointment.id}`}
            className="font-medium underline-offset-4 hover:underline"
          >
            {appointment.clientName}
          </Link>
          <p className="text-sm text-muted-foreground">
            {appointment.serviceName ?? "Sin servicio"}
            {appointment.durationMinutes ? ` · ${appointment.durationMinutes} min` : ""}
            {" · "}
            {APPOINTMENT_STATUS_LABELS[appointment.status] ?? appointment.status}
          </p>
        </div>
      </div>

      <WhatsAppReminderButton
        appointmentId={appointment.id}
        alreadySent={appointment.reminderStatus === "sent"}
      />
    </li>
  );
}
```

- [ ] **Step 2: Simplificar `DayAppointments` para usar el nuevo componente**

Reemplazar el contenido de `src/components/dashboard/day-appointments.tsx` completo por:

```tsx
import { AppointmentListItem } from "@/components/appointments/appointment-list-item";

export type DayAppointmentItem = {
  id: string;
  startsAt: string;
  clientName: string;
  serviceName: string | null;
  durationMinutes: number | null;
  status: string;
  reminderStatus: string | null;
};

export function DayAppointments({
  appointments,
  timezone,
  emptyMessage,
}: {
  appointments: DayAppointmentItem[];
  timezone: string;
  emptyMessage: string;
}) {
  if (appointments.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {appointments.map((appt) => (
        <AppointmentListItem key={appt.id} appointment={appt} timezone={timezone} />
      ))}
    </ul>
  );
}
```

Nota: `appointment-list-item.tsx` importa el tipo `DayAppointmentItem` desde `day-appointments.tsx`, y `day-appointments.tsx` importa el componente desde `appointment-list-item.tsx` — no hay ciclo real de runtime porque `DayAppointmentItem` es un tipo (se borra en compilación), pero si TypeScript se queja, mover el tipo `DayAppointmentItem` a un archivo neutral (`src/components/appointments/types.ts`) y que ambos archivos lo importen desde ahí.

- [ ] **Step 3: Verificar TypeScript**

Run: `node ./node_modules/typescript/bin/tsc --noEmit`
Expected: sin errores. Si aparece un error de importación circular, aplicar la nota del Step 2 (mover `DayAppointmentItem` a `src/components/appointments/types.ts`, y actualizar los imports en `day-appointments.tsx`, `appointment-list-item.tsx`, y cualquier otro archivo que importe `DayAppointmentItem` desde `day-appointments` — verificar con `grep -rn "DayAppointmentItem" src`).

- [ ] **Step 4: Ejecutar tests y build**

Run: `node ./node_modules/vitest/vitest.mjs run`
Expected: PASS (ningún test cubre este componente visual directamente, pero no debe haber regresiones en los tests existentes).

Run: `node ./node_modules/next/dist/bin/next build`
Expected: build exitoso.

- [ ] **Step 5: Verificación manual**

En el dashboard (`/dashboard`, pestañas Hoy/Mañana) y en Citas → Próximas citas, comprobar visualmente que las citas se siguen viendo exactamente igual que antes de este refactor (mismo layout, mismo botón de WhatsApp).

- [ ] **Step 6: Commit**

```bash
git add src/components/appointments/appointment-list-item.tsx src/components/dashboard/day-appointments.tsx
git commit -m "Extrae AppointmentListItem para reutilizar en la vista de disponibilidad"
```

---

### Task 9: Componente `DayAvailability`

**Files:**
- Create: `src/components/appointments/day-availability.tsx`

**Interfaces:**
- Consumes: `AvailabilityBlock` de `src/lib/scheduling/availability.ts` (Task 4), `AppointmentListItem` de Task 8, `formatTime` de `src/lib/dates/format.ts`.
- Produces: componente `DayAvailability({ blocks, timezone, closedMessage })`. Consumido por Task 10 (`AppointmentsCalendar`).

- [ ] **Step 1: Crear el componente**

Crear `src/components/appointments/day-availability.tsx`:

```tsx
import { formatTime } from "@/lib/dates/format";
import { AppointmentListItem } from "@/components/appointments/appointment-list-item";
import type { AvailabilityBlock } from "@/lib/scheduling/availability";

export function DayAvailability({
  blocks,
  timezone,
  closedMessage = "Cerrado este día.",
}: {
  blocks: AvailabilityBlock[];
  timezone: string;
  closedMessage?: string;
}) {
  if (blocks.length === 0) {
    return <p className="text-sm text-muted-foreground">{closedMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {blocks.map((block) =>
        block.type === "busy" ? (
          <AppointmentListItem
            key={block.appointment.id}
            appointment={block.appointment}
            timezone={timezone}
          />
        ) : (
          <li
            key={`free-${block.startsAt}`}
            className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/40 px-4 py-3"
          >
            <span className="text-sm font-medium tabular-nums text-muted-foreground">
              {formatTime(block.startsAt, timezone)} – {formatTime(block.endsAt, timezone)}
            </span>
            <span className="text-sm text-muted-foreground">Libre</span>
          </li>
        ),
      )}
    </ul>
  );
}
```

- [ ] **Step 2: Verificar TypeScript**

Run: `node ./node_modules/typescript/bin/tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/components/appointments/day-availability.tsx
git commit -m "Añade componente DayAvailability"
```

---

### Task 10: Integrar disponibilidad en `AppointmentsCalendar` + reducir ancho a 25%

**Files:**
- Modify: `src/components/appointments/appointments-calendar.tsx`
- Modify: `src/app/dashboard/citas/page.tsx`

**Interfaces:**
- Consumes: `computeDayAvailability` (Task 4), `DayAvailability` (Task 9). `AppointmentsCalendar` recibe una nueva prop `hoursByDayOfWeek: Record<number, { isOpen: boolean; startsAt: string | null; endsAt: string | null }>` además de las props ya existentes (`appointmentsByDate`, `timezone`).

- [ ] **Step 1: Cargar `business_hours` en `src/app/dashboard/citas/page.tsx`**

Añadir, dentro del `Promise.all` existente que ya carga `upcoming`, `calendarAppointments`, `clients`, `services`, una consulta más:

```ts
      supabase
        .from("business_hours")
        .select("day_of_week, is_open, starts_at, ends_at")
        .eq("business_id", businessId),
```

Esto cambia la desestructuración del resultado del `Promise.all` de:

```ts
  const [{ data: upcoming }, { data: calendarAppointments }, { data: clients }, { data: services }] =
```

a:

```ts
  const [{ data: upcoming }, { data: calendarAppointments }, { data: clients }, { data: services }, { data: hoursRows }] =
```

Después de esa desestructuración, construir el mapa por día de la semana:

```ts
  const hoursByDayOfWeek: Record<number, { isOpen: boolean; startsAt: string | null; endsAt: string | null }> = {};
  for (const row of hoursRows ?? []) {
    hoursByDayOfWeek[row.day_of_week] = {
      isOpen: row.is_open,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
    };
  }
```

Pasar la prop nueva a `AppointmentsCalendar` en el JSX de la pestaña "Calendario":

```tsx
          <AppointmentsCalendar
            appointmentsByDate={appointmentsByDate}
            timezone={timezone}
            hoursByDayOfWeek={hoursByDayOfWeek}
          />
```

- [ ] **Step 2: Actualizar `AppointmentsCalendar`**

Reemplazar el contenido completo de `src/components/appointments/appointments-calendar.tsx` por:

```tsx
"use client";

import { useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { Calendar } from "@/components/ui/calendar";
import { DayAvailability } from "@/components/appointments/day-availability";
import type { DayAppointmentItem } from "@/components/dashboard/day-appointments";
import { computeDayAvailability } from "@/lib/scheduling/availability";
import { formatDateLong } from "@/lib/dates/format";
import { es } from "date-fns/locale";

type DayHours = { isOpen: boolean; startsAt: string | null; endsAt: string | null };

export function AppointmentsCalendar({
  appointmentsByDate,
  timezone,
  hoursByDayOfWeek,
}: {
  appointmentsByDate: Record<string, DayAppointmentItem[]>;
  timezone: string;
  hoursByDayOfWeek: Record<number, DayHours>;
}) {
  const todayStr = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
  const [selected, setSelected] = useState<Date>(new Date());
  const selectedDateStr = formatInTimeZone(selected, timezone, "yyyy-MM-dd");
  const daysWithAppointments = useMemo(
    () =>
      Object.keys(appointmentsByDate)
        .filter((d) => appointmentsByDate[d].length > 0)
        .map((d) => new Date(`${d}T12:00:00`)),
    [appointmentsByDate],
  );

  const selectedDayOfWeek = new Date(`${selectedDateStr}T12:00:00Z`).getUTCDay();
  const selectedDayHours = hoursByDayOfWeek[selectedDayOfWeek] ?? null;

  const availabilityBlocks = useMemo(
    () =>
      computeDayAvailability({
        dateStr: selectedDateStr,
        timezone,
        hours: selectedDayHours,
        appointments: appointmentsByDate[selectedDateStr] ?? [],
      }),
    [selectedDateStr, timezone, selectedDayHours, appointmentsByDate],
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
      <Calendar
        mode="single"
        locale={es}
        selected={selected}
        onSelect={(date) => date && setSelected(date)}
        modifiers={{ hasAppointments: daysWithAppointments }}
        modifiersClassNames={{ hasAppointments: "font-bold underline" }}
        className="w-full sm:w-auto sm:shrink-0 sm:basis-1/4 [--cell-size:--spacing(11)]"
        classNames={{ root: "w-full", month: "w-full" }}
      />
      <div className="flex flex-1 flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {selectedDateStr === todayStr
            ? "Hoy"
            : formatDateLong(`${selectedDateStr}T12:00:00Z`, "UTC")}
        </h2>
        <DayAvailability
          blocks={availabilityBlocks}
          timezone={timezone}
          closedMessage={
            selectedDayHours?.isOpen === false
              ? "Cerrado este día."
              : "No hay horario configurado para este día."
          }
        />
      </div>
    </div>
  );
}
```

Nota sobre `getUTCDay()`: `selectedDateStr` es `"yyyy-MM-dd"` (día calendario en el timezone del negocio, ya resuelto por `formatInTimeZone`). Al construirlo como `new Date(`${selectedDateStr}T12:00:00Z`)` y pedir `getUTCDay()`, se obtiene el día de la semana de ese día calendario sin riesgo de que un desplazamiento horario lo empuje al día anterior/siguiente (mismo patrón "anclar a mediodía UTC" que ya usa `src/lib/dates/ranges.ts`).

- [ ] **Step 3: Verificar TypeScript**

Run: `node ./node_modules/typescript/bin/tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Ejecutar toda la suite de tests**

Run: `node ./node_modules/vitest/vitest.mjs run`
Expected: PASS.

- [ ] **Step 5: Build**

Run: `node ./node_modules/next/dist/bin/next build`
Expected: build exitoso.

- [ ] **Step 6: Verificación manual en navegador**

Levantar el servidor de desarrollo, ir a `/dashboard/citas`, pestaña "Calendario":
- El calendario ocupa aproximadamente 1/4 del ancho en pantallas de escritorio (antes era 1/3).
- Seleccionar un día laboral con citas: aparece una línea de tiempo con bloques "Libre" (fondo sutil, con rango de horas) intercalados con las citas ocupadas (mismo aspecto que antes en la lista de citas, con su botón de WhatsApp).
- Seleccionar un fin de semana (si está marcado como cerrado en Configuración): aparece "Cerrado este día." en vez de una lista vacía confusa.
- Seleccionar un día laboral sin ninguna cita: aparece un único bloque libre cubriendo todo el horario laboral.
- Confirmar que la pestaña "Próximas citas" de Citas y el Resumen de `/dashboard` (Hoy/Mañana) siguen exactamente igual que antes (no deben verse afectados por este cambio).

- [ ] **Step 7: Commit**

```bash
git add src/components/appointments/appointments-calendar.tsx src/app/dashboard/citas/page.tsx
git commit -m "Añade vista de disponibilidad en Citas > Calendario y reduce el calendario a 25% de ancho"
```

---

## Post-implementación

- Actualizar `README.md` si documenta explícitamente el modelo de datos o las migraciones (comprobar si existe esa sección antes de editar).
- Revisar `PLAN_FUTURO_STRIPE.md` no aplica aquí — no hay relación con esta feature.
- Confirmar que `docs/superpowers/specs/2026-09-03-disponibilidad-horario-laboral-design.md` sigue reflejando lo implementado; si algo se ajustó durante la implementación (p. ej. nombres de campos), anotarlo en el spec para que quede como referencia fiel.
