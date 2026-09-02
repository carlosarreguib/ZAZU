# Zazú

Zazú es una agenda sencilla para autónomos y profesionales que trabajan con
citas (fisioterapeutas, psicólogos, entrenadores personales, peluqueros,
tatuadores, masajistas, etc.). Permite gestionar clientes, servicios y citas,
y recordar una cita a un cliente por WhatsApp con un solo clic (mediante un
enlace `wa.me` — el profesional confirma el envío manualmente en WhatsApp).

Ver [SPEC.md](./SPEC.md) para el alcance funcional completo del MVP.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19 + TypeScript estricto.
- [Supabase](https://supabase.com) (Auth + PostgreSQL + Row Level Security).
- Tailwind CSS 4 + [shadcn/ui](https://ui.shadcn.com) (Radix UI, preset Nova).
- `date-fns` + `date-fns-tz` para manejo de timezone (`Europe/Madrid` por defecto).
- Zod + React Hook Form para validación de formularios.
- Vercel como plataforma de despliegue.

## Requisitos

- Node.js 20+ y npm.
- Una cuenta y proyecto de [Supabase](https://supabase.com).
- Para tests de integración locales: [Docker](https://www.docker.com/) y la
  [Supabase CLI](https://supabase.com/docs/guides/cli) (se invoca vía `npx supabase`,
  no requiere instalación global).

## Instalación

```bash
npm install
```

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores desde tu proyecto de
Supabase (**Project Settings → API**):

```bash
cp .env.example .env.local
```

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase. Pública. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (anon/public). Pública, protegida por RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de service role. **Solo servidor** — nunca debe llegar al navegador. Se usa exclusivamente para la eliminación de cuenta (Admin API). |

## Configuración de Supabase y migraciones

Las migraciones SQL viven en `supabase/migrations/` y son la única forma
soportada de crear el esquema — no se crean tablas manualmente desde el
dashboard.

**Contra un proyecto Supabase remoto:**

```bash
npx supabase login
npx supabase link --project-ref <tu-project-ref>
npx supabase db push
```

**Contra una instancia local (recomendada para desarrollo y tests):**

```bash
npx supabase start   # requiere Docker
npx supabase db reset  # aplica migrations + seed sobre la instancia local
```

`supabase db reset` aplica todas las migraciones en `supabase/migrations/` y
después el seed de `supabase/seed.sql`.

## Datos de demostración (seed)

`supabase/seed.sql` (añadido junto con las migraciones en la Fase 2) crea un
negocio de demostración con clientes, servicios y citas (hoy, mañana,
distintos estados de recordatorio) para desarrollo local. No se ejecuta
automáticamente contra un proyecto de producción.

## Desarrollo local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Tests

Los tests (unit, integración contra Supabase local y E2E de caminos críticos)
se añaden en la Fase 12 del desarrollo. Esta sección se actualizará con los
comandos exactos (`npm run test`, etc.) en cuanto existan.

Los tests de integración se ejecutarán contra una instancia local real de
Supabase (no se mockea RLS) para verificar el aislamiento multi-tenant y las
policies tal como se comportan en Postgres.

## Deploy en Vercel

1. Importa el repositorio en [Vercel](https://vercel.com/new).
2. Configura las variables de entorno de la tabla anterior en el proyecto de
   Vercel (Production y Preview).
3. Aplica las migraciones contra tu proyecto Supabase de producción
   (`npx supabase db push`) antes o durante el primer deploy.

## Limitaciones conocidas del MVP

- Los recordatorios de WhatsApp usan enlaces `wa.me`; Zazú no puede verificar
  que el mensaje se haya enviado realmente, solo que el profesional confirmó
  haberlo hecho.
- La normalización de teléfono asume números españoles (prefijo `+34`).
  Números internacionales no están soportados en el MVP.
- `/privacidad` y `/terminos` son plantillas provisionales pendientes de
  revisión por un profesional jurídico antes de producción.

Ver `SPEC.md` sección 53 para la lista completa de funcionalidades
explícitamente fuera de alcance del MVP.
