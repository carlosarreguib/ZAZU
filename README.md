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

```bash
npm run test              # unit tests (Vitest)
npm run test:integration  # tests de integración (requieren Supabase real)
```

**Unit tests** cubren las funciones puras críticas: normalización de
teléfono, generación de mensaje y URL de WhatsApp, cálculo de fin de cita a
partir de la duración, conversión de fecha/hora a UTC respetando el
timezone del negocio, cálculo del rango "hoy"/"mañana", y las validaciones
Zod de los formularios principales (registro, cliente, cita). No requieren
red ni credenciales.

**Tests de integración** (`src/**/*.integration.test.ts`) prueban los
caminos críticos contra una instancia real de Postgres/Supabase — nunca se
mockea RLS, siguiendo la filosofía del proyecto de probar la seguridad tal
como se comporta la base de datos: crear cliente, crear cita, el
constraint `EXCLUDE` anti-solapamiento (verificando el código de error real
`23P01`, no solo la validación de aplicación), y aislamiento multi-tenant
completo (SELECT/INSERT/UPDATE bloqueados entre negocios). Cada ejecución
crea usuarios y negocios de prueba reales vía la Admin API y los borra al
terminar (`afterAll`).

Requieren `.env.local` con `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` apuntando a
una instancia de Supabase real:

- **Local (recomendado si tienes Docker):** `npx supabase start` y apunta
  las variables anteriores a `http://127.0.0.1:54321` y a las claves que
  imprime ese comando.
- **Remoto:** si no tienes Docker disponible, pueden apuntar a un proyecto
  Supabase real de desarrollo/staging — nunca a producción, ya que estos
  tests crean y borran datos.

**E2E** (Playwright) cubre el camino crítico completo de principio a fin:

```bash
npx playwright install chromium   # solo la primera vez
npm run test:e2e
```

Levanta automáticamente un servidor de desarrollo en `localhost:3100` y
recorre: registro → onboarding de 3 pasos → crear cliente (inline, durante
la creación de la cita) → crear cita → la cita aparece en la vista "Hoy" →
abrir el recordatorio de WhatsApp (verifica el número y el mensaje en la
URL `wa.me`) → marcar el recordatorio como enviado. Igual que los tests de
integración, necesita `.env.local` con credenciales de Supabase reales.

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
