# PROMPT MAESTRO — ZAZÚ

Actúa como **Senior Full-Stack Engineer, Product Engineer y Software Architect**. Vas a construir desde cero una aplicación SaaS web llamada **Zazú**.

Tu objetivo no es crear un mockup ni una demo visual, sino **una aplicación funcional, mantenible, segura y preparada para desplegar en producción**, aunque el alcance inicial sea un MVP.

Quiero que tomes decisiones técnicas razonables por tu cuenta, pero **no inventes funcionalidades fuera del alcance definido en este documento**.

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

- TPV.
- Inventario.
- Contabilidad.
- Facturación.
- Nóminas.
- Marketplace.
- CRM complejo.
- IA.
- Automatizaciones complejas.
- Gestión médica.
- Historial clínico.
- Gestión de empleados avanzada.

El producto debe transmitir:

> **"Abro Zazú y en 10 segundos sé quién tengo hoy y a quién tengo que recordar."**

La simplicidad es una funcionalidad principal.

---

# 2. USUARIO OBJETIVO

El MVP está pensado para:

> Profesionales que trabajan solos y gestionan citas recurrentes con clientes.

Ejemplos:

- fisioterapeutas;
- psicólogos;
- entrenadores personales;
- peluqueros/barberos;
- tatuadores;
- masajistas;
- otros profesionales similares.

No diseñes funcionalidades específicas para cada profesión.

La arquitectura debe permitir posteriormente especializar la experiencia, pero el MVP debe ser genérico.

---

# 3. PROPUESTA DE VALOR

La aplicación debe comunicar:

### Mensaje principal

> **No pierdas citas por un simple olvido.**

### Submensaje

> Organiza tu agenda y recuerda a tus clientes por WhatsApp en segundos.

### Diferenciadores

1. **Simplicidad**
2. **Cero configuración compleja**
3. **Recordatorios WhatsApp en un clic**
4. **Precio accesible**
5. **Diseñada para el micro-autónomo**

IMPORTANTE:

No describas el producto como "automatización de WhatsApp".

En el MVP, el sistema utiliza un enlace `wa.me` que abre WhatsApp con el mensaje preparado.

El profesional debe pulsar "Enviar" en WhatsApp.

Por tanto, el lenguaje correcto es:

> **"Recordatorio por WhatsApp en un clic."**

NO:

> "Enviamos automáticamente WhatsApps."

---

# 4. STACK TECNOLÓGICO

Utiliza:

- Next.js actual estable.
- App Router.
- TypeScript.
- Supabase.
- PostgreSQL.
- Supabase Auth.
- Supabase Row Level Security.
- Tailwind CSS.
- shadcn/ui.
- date-fns.
- Zod.
- React Hook Form.
- Lucide Icons.
- Vercel como plataforma de despliegue.

La aplicación debe ser responsive.

Debe funcionar correctamente en:

- móvil;
- tablet;
- escritorio.

Preparar la arquitectura para PWA, pero **no hacer depender el funcionamiento de la instalación como PWA**.

---

# 5. PRINCIPIOS DE ARQUITECTURA

## 5.1 Multi-tenant desde el primer día

Zazú será un SaaS multi-tenant.

Un usuario pertenece a uno o varios negocios potencialmente.

Todos los datos empresariales deben estar asociados a un `business_id`.

Nunca dependas únicamente de IDs enviados desde el cliente para determinar qué datos puede consultar un usuario.

La seguridad debe estar garantizada mediante Supabase RLS.

---

# 6. MODELO DE DATOS

No utilizar únicamente las tres tablas originales `negocios`, `clientes` y `citas`.

Utiliza una arquitectura preparada para crecer.

Tablas principales:

## `profiles`

Representa al usuario de la aplicación.

Campos aproximados:

- `id UUID PRIMARY KEY`
- `email`
- `full_name`
- `created_at`
- `updated_at`

El `id` debe relacionarse con `auth.users.id`.

---

## `businesses`

Representa un negocio.

Campos:

- `id UUID PRIMARY KEY`
- `name TEXT NOT NULL`
- `contact_name TEXT`
- `phone TEXT`
- `timezone TEXT NOT NULL DEFAULT 'Europe/Madrid'`
- `created_at`
- `updated_at`

---

## `business_members`

Relaciona usuarios y negocios.

Campos:

- `id UUID PRIMARY KEY`
- `business_id UUID`
- `user_id UUID`
- `role TEXT`
- `created_at`

Roles iniciales:

- `owner`
- `member`

Aunque inicialmente la UI solamente necesite `owner`, diseña correctamente la arquitectura.

Debe existir una restricción que evite duplicar el mismo usuario dentro del mismo negocio.

---

## `clients`

Campos:

- `id UUID PRIMARY KEY`
- `business_id UUID NOT NULL`
- `full_name TEXT NOT NULL`
- `phone TEXT NOT NULL`
- `notes TEXT NULL`
- `created_at`
- `updated_at`

No guardar datos personales innecesarios.

No almacenar:

- DNI;
- dirección;
- fecha de nacimiento;
- información médica;
- información financiera.

---

## `services`

Campos:

- `id UUID PRIMARY KEY`
- `business_id UUID NOT NULL`
- `name TEXT NOT NULL`
- `duration_minutes INTEGER NOT NULL`
- `active BOOLEAN NOT NULL DEFAULT TRUE`
- `created_at`
- `updated_at`

Ejemplos:

- Fisioterapia — 50 min
- Corte — 45 min
- Entrenamiento — 60 min

---

## `appointments`

Campos:

- `id UUID PRIMARY KEY`
- `business_id UUID NOT NULL`
- `client_id UUID NOT NULL`
- `service_id UUID NULL`
- `starts_at TIMESTAMPTZ NOT NULL`
- `ends_at TIMESTAMPTZ NOT NULL`
- `status TEXT NOT NULL`
- `notes TEXT NULL`
- `created_at`
- `updated_at`

Estados de cita:

- `scheduled`
- `confirmed`
- `cancelled`
- `completed`
- `no_show`

Para el MVP, la UI puede utilizar principalmente:

- pendiente;
- confirmada;
- cancelada.

Pero la base de datos debe quedar preparada para el resto.

---

## `appointment_reminders`

Crear una tabla independiente para los recordatorios.

Campos:

- `id UUID PRIMARY KEY`
- `business_id UUID NOT NULL`
- `appointment_id UUID NOT NULL`
- `channel TEXT NOT NULL`
- `status TEXT NOT NULL`
- `sent_at TIMESTAMPTZ NULL`
- `created_at`
- `updated_at`

Canales:

- `whatsapp`

Estados:

- `pending`
- `prepared`
- `sent`

IMPORTANTE:

En el MVP `sent` significa que el usuario ha confirmado en Zazú que ha enviado el mensaje.

Zazú no puede verificar que WhatsApp realmente haya enviado el mensaje cuando se utiliza `wa.me`.

---

## `business_settings`

Campos:

- `business_id UUID PRIMARY KEY`
- `default_reminder_template TEXT`
- `week_starts_on INTEGER DEFAULT 1`
- `created_at`
- `updated_at`

La plantilla por defecto podría ser:

> Hola {{client_name}}, te recordamos tu cita de {{service}} mañana a las {{time}} en {{business_name}}. ¡Te esperamos!

El sistema debe soportar estas variables:

- `{{client_name}}`
- `{{service}}`
- `{{date}}`
- `{{time}}`
- `{{business_name}}`

---

# 7. BASE DE DATOS Y MIGRACIONES

No quiero que Claude me pida crear manualmente las tablas desde el dashboard de Supabase.

Crea migraciones SQL dentro del proyecto.

Por ejemplo:

```text
supabase/
  migrations/
    001_initial_schema.sql
    002_rls.sql
    003_seed.sql
```

Las migraciones deben ser reproducibles.

Crear:

- foreign keys;
- índices;
- constraints;
- unique constraints;
- check constraints;
- timestamps;
- cascadas apropiadas.

---

# 8. SEGURIDAD — RLS

Esto es obligatorio.

No desactivar RLS.

Todas las tablas que contengan datos empresariales deben tener RLS activado.

Un usuario solamente puede acceder a datos de negocios de los que sea miembro.

Crear políticas para:

- SELECT
- INSERT
- UPDATE
- DELETE

según corresponda.

La regla fundamental:

> Un negocio jamás puede consultar, modificar o eliminar datos pertenecientes a otro negocio.

Prueba explícitamente este comportamiento.

No confíes exclusivamente en la protección de Next.js.

La base de datos debe ser segura incluso si alguien intenta manipular directamente las peticiones.

---

# 9. AUTENTICACIÓN

Utilizar Supabase Auth.

Implementar:

- registro;
- login;
- logout;
- recuperación de contraseña;
- protección de rutas;
- sesión persistente.

Preferencia:

### Email + password

Mantener la implementación sencilla.

El sistema debe impedir acceder al dashboard sin sesión válida.

Después del registro:

1. Crear usuario en Supabase Auth.
2. Crear `profile`.
3. Crear `business`.
4. Crear `business_member` con role `owner`.
5. Crear `business_settings`.
6. Redirigir al onboarding/dashboard.

Todo debe estar correctamente asociado.

---

# 10. ONBOARDING

Después del registro, mostrar un onboarding muy corto.

Máximo 3 pasos.

### Paso 1

Nombre del negocio.

### Paso 2

Nombre del profesional.

### Paso 3

Crear primer servicio.

Ejemplo:

```text
Nombre del servicio:
Fisioterapia

Duración:
50 minutos
```

Al terminar:

> Tu agenda está lista.

CTA:

> Ir a mi agenda

No hacer un onboarding largo.

---

# 11. ESTRUCTURA DE RUTAS

Utiliza App Router.

Estructura aproximada:

```text
src/
  app/
    page.tsx

    login/
      page.tsx

    register/
      page.tsx

    forgot-password/
      page.tsx

    dashboard/
      layout.tsx
      page.tsx

      clientes/
        page.tsx
        [id]/
          page.tsx

      citas/
        page.tsx
        [id]/
          page.tsx

      servicios/
        page.tsx

      configuracion/
        page.tsx

    privacidad/
      page.tsx

    terminos/
      page.tsx
```

Puedes modificar esta estructura si existe una razón arquitectónica clara.

---

# 12. DASHBOARD — PANTALLA PRINCIPAL

Esta es la pantalla más importante de Zazú.

No crear un dashboard lleno de estadísticas.

La prioridad es la agenda.

## Header

Mostrar:

- logo Zazú;
- nombre del negocio;
- avatar/menú de usuario;
- navegación.

---

## Resumen

Mostrar:

```text
Hoy
3 citas

Mañana
5 citas

Recordatorios pendientes
2
```

Los números deben ser reales.

---

# 13. VISTA "HOY"

Mostrar las citas del día agrupadas cronológicamente.

Ejemplo:

```text
HOY · Miércoles 2 septiembre

09:00
María López
Fisioterapia · 50 min

[Recordar por WhatsApp]

10:30
Carlos Pérez
Fisioterapia · 50 min

[✓ Recordatorio enviado]

12:00
Laura Gómez
Fisioterapia · 50 min

[Recordar por WhatsApp]
```

Cada cita debe mostrar:

- hora;
- cliente;
- servicio;
- duración;
- estado;
- estado del recordatorio;
- acción WhatsApp.

---

# 14. VISTA "MAÑANA"

Debe existir una vista especialmente útil para preparar recordatorios.

Mostrar:

> Citas de mañana

Y un CTA:

> **Recordar citas de mañana**

Esto inicia un flujo secuencial.

---

# 15. FLUJO "RECORDAR CITAS DE MAÑANA"

Esta es una de las funcionalidades estrella.

Ejemplo:

```text
Recordatorios de mañana

1 de 5

María López

Mañana · 10:00

Fisioterapia

[ Abrir WhatsApp ]
```

Al pulsar:

1. Generar mensaje.
2. Generar URL `wa.me`.
3. Abrir WhatsApp en nueva pestaña.
4. Marcar el recordatorio como `prepared`.
5. Mostrar una acción:

```text
¿Has enviado el mensaje?

[ Sí, enviado ]
[ Volver ]
```

Si el usuario pulsa "Sí, enviado":

- actualizar `appointment_reminders.status = sent`;
- guardar `sent_at`.

Después mostrar:

> Siguiente cita

Este flujo debe permitir procesar rápidamente todas las citas.

---

# 16. WHATSAPP

Crear una utilidad centralizada.

Por ejemplo:

```text
src/lib/whatsapp.ts
```

Debe encargarse de:

- normalizar teléfono;
- eliminar espacios;
- eliminar caracteres no válidos;
- gestionar `+34`;
- generar mensaje;
- codificar correctamente el mensaje;
- generar URL.

La URL correcta debe tener la forma:

```text
https://wa.me/34600112233?text=...
```

No introducir errores de interpolación.

No utilizar la API de WhatsApp en el MVP.

No utilizar Twilio.

No utilizar Zapier.

No utilizar automatización externa.

---

# 17. MENSAJE DE WHATSAPP

Plantilla inicial:

> Hola {{client_name}}, te recordamos tu cita de {{service}} mañana a las {{time}} en {{business_name}}. ¡Te esperamos!

El mensaje debe generarse dinámicamente.

La plantilla debe poder modificarse desde configuración.

Mostrar una vista previa antes de abrir WhatsApp si resulta útil para UX.

---

# 18. CREAR UNA CITA

Debe ser extremadamente rápido.

CTA principal:

> + Nueva cita

Abrir modal/drawer según el dispositivo.

Campos:

### Cliente

Combobox/buscador.

Permitir:

> + Crear nuevo cliente

### Servicio

Selector.

### Fecha

Date picker.

### Hora

Selector de hora.

### Duración

Derivada del servicio.

### Notas

Opcional.

CTA:

> Agendar cita

---

# 19. CREAR CLIENTE DURANTE LA CITA

No obligar al usuario a salir del formulario.

Si el cliente no existe:

```text
+ Nuevo cliente
```

Mostrar:

- nombre;
- teléfono;
- notas opcionales.

Guardar cliente y continuar automáticamente con la creación de la cita.

Evitar duplicados obvios.

Si ya existe un cliente con el mismo teléfono dentro del negocio, ofrecer utilizar ese cliente en lugar de crear otro.

---

# 20. VALIDACIÓN DE CITAS

Antes de crear una cita:

- validar fecha;
- validar hora;
- validar servicio;
- validar cliente;
- calcular `ends_at`;
- comprobar solapamientos.

No permitir dos citas solapadas para el mismo negocio/profesional.

Mostrar error amigable:

> Ya tienes una cita a esa hora.

No mostrar errores SQL al usuario.

---

# 21. CLIENTES

Ruta:

```text
/dashboard/clientes
```

Mostrar:

- buscador;
- nombre;
- teléfono;
- número de citas;
- última cita;
- próxima cita.

CTA:

> Nuevo cliente

Al entrar en un cliente:

- datos básicos;
- próximas citas;
- historial de citas;
- editar;
- eliminar.

Antes de eliminar:

> ¿Seguro que quieres eliminar este cliente?

Si tiene citas futuras, definir claramente el comportamiento.

Preferencia: no permitir eliminar silenciosamente datos relacionados sin confirmación explícita.

---

# 22. SERVICIOS

Ruta:

```text
/dashboard/servicios
```

CRUD sencillo:

- crear;
- editar;
- activar/desactivar.

Campos:

- nombre;
- duración.

No añadir precios en el MVP salvo que exista una razón clara.

---

# 23. CALENDARIO

Debe existir una vista de calendario.

Pero:

> **El calendario no debe dominar la aplicación.**

El dashboard principal debe priorizar la lista de citas.

La vista calendario puede permitir:

- mes;
- semana si resulta razonable;
- día seleccionado;
- crear cita;
- editar cita.

Utilizar `date-fns`.

Usar correctamente timezone `Europe/Madrid`.

No realizar manipulaciones ingenuas de fechas con strings locales.

Todas las fechas almacenadas deben ser `TIMESTAMPTZ`.

---

# 24. ZONA HORARIA

Por defecto:

```text
Europe/Madrid
```

No asumir que el servidor está en horario español.

Toda presentación de fechas debe convertir correctamente la hora al timezone del negocio.

Preparar la arquitectura para que en el futuro cada negocio pueda tener otra zona horaria.

---

# 25. CONFIGURACIÓN

Ruta:

```text
/dashboard/configuracion
```

Secciones:

### Negocio

- nombre;
- nombre de contacto;
- teléfono.

### Recordatorios

Editor de plantilla.

Mostrar variables disponibles.

### Cuenta

- email;
- cerrar sesión;
- eliminar cuenta.

### Suscripción

Preparar sección aunque inicialmente pueda mostrar:

> Próximamente.

No implementar Stripe todavía salvo que resulte imprescindible para dejar la arquitectura preparada.

---

# 26. LANDING PAGE

Crear una landing profesional pero sencilla.

No utilizar una estética genérica de "AI startup".

Debe sentirse como un SaaS español para pequeños profesionales.

Hero:

> **No pierdas citas por un simple olvido.**

Subtexto:

> Zazú organiza tu agenda y te permite recordar a tus clientes por WhatsApp en segundos.

CTA:

> Probar Zazú gratis

Secciones:

### Cómo funciona

1. Añade la cita.
2. Recuerda al cliente.
3. Reduce las citas perdidas.

### Por qué Zazú

- Fácil.
- Rápido.
- Sin configuraciones complicadas.
- Pensado para autónomos.

### Precio

Inicialmente:

> Próximamente desde 9,90 €/mes.

No afirmar precios definitivos si Stripe todavía no está implementado.

---

# 27. DISEÑO VISUAL

Crear una identidad propia.

El nombre Zazú puede asociarse visualmente a un pequeño asistente/pájaro, pero:

**NO copiar personajes, ilustraciones, logos o elementos protegidos de Disney ni de El Rey León.**

Crear una identidad original.

Estética:

- limpia;
- moderna;
- amable;
- profesional;
- minimalista.

Paleta sugerida:

- azul como color principal;
- verde exclusivamente para acciones relacionadas con WhatsApp;
- fondos claros;
- gris neutro para elementos secundarios.

No abusar del verde.

WhatsApp debe reconocerse como canal, no como identidad de marca.

---

# 28. RESPONSIVE DESIGN

Mobile-first.

En móvil:

- navegación compacta;
- botón "Nueva cita" siempre accesible;
- citas en cards;
- botones suficientemente grandes;
- formularios cómodos.

En desktop:

- sidebar;
- contenido central;
- calendario/lista.

La app debe ser realmente utilizable con una mano en móvil.

---

# 29. ESTADOS DE UI

Implementar siempre:

- loading;
- empty;
- error;
- success;
- disabled;
- optimistic feedback cuando tenga sentido.

Nunca dejar una pantalla en blanco mientras carga.

Ejemplo:

Sin clientes:

> Todavía no tienes clientes.

CTA:

> Añadir primer cliente

Sin citas:

> Hoy no tienes ninguna cita.

CTA:

> Agendar una cita

---

# 30. MANEJO DE ERRORES

Nunca mostrar:

```text
PostgrestError...
```

al usuario.

Crear mensajes amigables.

Registrar errores técnicos en consola/logs cuando corresponda.

Los formularios deben mantener los datos introducidos cuando se produce un error recuperable.

---

# 31. VALIDACIÓN

Utilizar Zod para validar inputs.

Validar tanto:

- frontend;
- backend/server actions/API.

No confiar en validación exclusivamente del navegador.

---

# 32. SUPABASE CLIENT

Crear correctamente:

- cliente browser;
- cliente server;
- gestión de cookies/sesión;
- middleware si es necesario.

No exponer:

- service role key;
- secretos;
- credenciales privadas.

Nunca utilizar la service role key en código ejecutado en el navegador.

---

# 33. SERVER ACTIONS / MUTACIONES

Preferir Server Actions para operaciones de escritura cuando tenga sentido.

Las operaciones importantes:

- crear cliente;
- editar cliente;
- eliminar cliente;
- crear servicio;
- editar servicio;
- crear cita;
- editar cita;
- cancelar cita;
- actualizar recordatorio;
- actualizar configuración.

Siempre validar autenticación y autorización.

Aunque exista RLS, la capa de aplicación también debe comprobar el contexto del usuario.

---

# 34. NO DUPLICAR LÓGICA

Crear utilidades y servicios reutilizables.

Por ejemplo:

```text
src/
  lib/
    supabase/
    auth/
    whatsapp/
    dates/
    validations/
```

No repetir:

- lógica de teléfonos;
- formato de fechas;
- permisos;
- generación de mensajes;
- consultas idénticas.

---

# 35. COMPONENTES

Crear componentes reutilizables.

Por ejemplo:

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

Componentes posibles:

- `AppointmentCard`
- `AppointmentForm`
- `NewAppointmentDialog`
- `ClientForm`
- `ClientSelector`
- `ServiceSelector`
- `WhatsAppReminderButton`
- `ReminderFlow`
- `DayAppointments`
- `DashboardSummary`
- `EmptyState`
- `LoadingState`
- `ConfirmDialog`

No crear componentes gigantescos de cientos de líneas si pueden dividirse razonablemente.

---

# 36. ACCESIBILIDAD

Implementar:

- labels reales;
- navegación por teclado;
- focus states;
- aria-label cuando sea necesario;
- contraste suficiente;
- botones con nombres claros;
- modales accesibles.

No utilizar emojis como único indicador semántico.

---

# 37. PWA

Preparar Zazú como PWA.

Implementar:

- manifest;
- iconos;
- nombre;
- descripción;
- theme;
- display standalone.

No es necesario implementar offline-first completo.

La aplicación necesita conexión para trabajar con Supabase.

---

# 38. RGPD / PRIVACIDAD

La aplicación manejará datos personales.

Diseñar respetando principios de:

- minimización;
- aislamiento;
- eliminación;
- transparencia.

Crear páginas:

```text
/privacidad
/terminos
```

El texto legal debe ser claramente identificable como plantilla que deberá revisar/adaptar un profesional jurídico antes de producción.

No inventar afirmaciones de cumplimiento legal.

En configuración:

> Eliminar mi cuenta y mis datos.

Implementar correctamente la eliminación de los datos asociados cuando sea técnicamente viable.

---

# 39. DATOS DE DEMOSTRACIÓN

Crear seed/demo data para desarrollo.

Debe existir una forma sencilla de tener:

- negocio demo;
- varios clientes;
- varios servicios;
- citas de hoy;
- citas de mañana;
- distintos estados de recordatorio.

No introducir datos de demo en producción accidentalmente.

---

# 40. SUSCRIPCIONES

No implementar todavía Stripe completo.

Pero dejar una abstracción preparada:

```text
Subscription
BillingService
Plan
```

El modelo debe permitir posteriormente:

- trial;
- active;
- past_due;
- cancelled;
- expired.

No bloquear el MVP por billing.

---

# 41. ANALÍTICA

No implementar Google Analytics ni trackers invasivos en el MVP.

Si resulta útil, preparar eventos internos sencillos como:

- appointment_created;
- reminder_prepared;
- reminder_marked_sent;
- client_created.

Pero no añadir una plataforma externa de analytics sin necesidad.

---

# 42. SEO

La landing debe tener:

- title;
- description;
- Open Graph básico;
- favicon;
- metadata.

El dashboard autenticado no necesita SEO.

---

# 43. TESTS

Implementar tests razonables.

Como mínimo:

### Unit tests

Para:

- normalización de teléfonos;
- generación de URL de WhatsApp;
- generación de mensajes;
- cálculo de duración;
- validaciones;
- timezone.

### Tests de integración

Para operaciones importantes:

- crear cliente;
- crear cita;
- impedir solapamientos;
- permisos multi-tenant.

### E2E

Si es razonable con el stack elegido:

- registro/login;
- crear cliente;
- crear cita;
- abrir recordatorio WhatsApp;
- marcar recordatorio como enviado.

No necesito cientos de tests.

Necesito cubrir los caminos críticos.

---

# 44. SEGURIDAD

Revisar específicamente:

- RLS;
- XSS;
- CSRF cuando aplique;
- inyección SQL;
- exposición de secretos;
- autorización;
- acceso cross-tenant;
- inputs maliciosos;
- URLs externas;
- teléfonos manipulados;
- datos enviados desde cliente.

No guardar información sensible innecesaria.

---

# 45. DOCUMENTACIÓN

Crear:

```text
README.md
```

Debe explicar:

1. Qué es Zazú.
2. Stack.
3. Requisitos.
4. Instalación.
5. Variables de entorno.
6. Configuración de Supabase.
7. Ejecución de migraciones.
8. Seed.
9. Desarrollo local.
10. Tests.
11. Deploy en Vercel.

Crear también:

```text
.env.example
```

Nunca incluir secretos reales.

---

# 46. VARIABLES DE ENTORNO

Como mínimo documentar:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Si alguna funcionalidad futura requiere secrets adicionales, documentarlos sin incluir valores reales.

---

# 47. CALIDAD DEL CÓDIGO

Utilizar:

- TypeScript estricto;
- ESLint;
- Prettier si resulta apropiado;
- nombres descriptivos;
- componentes pequeños;
- funciones puras cuando sea posible.

Evitar:

- `any` salvo casos justificados;
- código duplicado;
- TODOs sin resolver;
- mocks en producción;
- credenciales hardcodeadas;
- queries sin autorización.

---

# 48. IMPORTANTE: NO CONSTRUIR UNA DEMO FALSA

No quiero botones que solamente hagan:

```text
alert("Todo bien")
```

No quiero datos hardcodeados en las pantallas finales.

No quiero:

```text
const fakeAppointments = [...]
```

salvo dentro de tests/seed.

La aplicación debe utilizar Supabase realmente.

---

# 49. ORDEN DE IMPLEMENTACIÓN

Trabaja en fases.

## FASE 0 — Auditoría

Antes de escribir código:

1. Inspecciona el repositorio.
2. Determina si ya existe código.
3. Revisa `package.json`.
4. Revisa configuración.
5. Revisa variables de entorno disponibles.
6. Detecta posibles conflictos.

Si el repositorio está vacío, inicializa el proyecto correctamente.

Después, crea un breve plan interno de implementación.

No me pidas aprobación para cada pequeña decisión.

---

## FASE 1 — Fundación

Implementar:

- Next.js;
- TypeScript;
- Tailwind;
- shadcn/ui;
- Supabase;
- estructura base;
- layouts;
- navegación;
- theme;
- ESLint;
- configuración.

---

## FASE 2 — Base de datos

Crear:

- migrations;
- tablas;
- índices;
- constraints;
- RLS;
- policies.

Probar aislamiento multi-tenant.

---

## FASE 3 — Auth

Implementar:

- register;
- login;
- logout;
- reset password;
- protección de rutas;
- profile;
- business;
- membership.

---

## FASE 4 — Onboarding

Implementar:

- crear negocio;
- crear primer servicio;
- configuración inicial.

---

## FASE 5 — Clientes

Implementar CRUD completo.

---

## FASE 6 — Servicios

Implementar CRUD completo.

---

## FASE 7 — Citas

Implementar:

- crear;
- editar;
- cancelar;
- cambiar estado;
- detectar solapamientos;
- fechas;
- timezone.

---

## FASE 8 — Dashboard

Implementar:

- hoy;
- mañana;
- resumen;
- lista cronológica;
- calendario;
- nueva cita rápida.

---

## FASE 9 — WhatsApp

Implementar:

- normalización;
- generación de mensaje;
- URL;
- botón;
- reminder flow;
- estados.

---

## FASE 10 — Configuración

Implementar:

- negocio;
- plantilla WhatsApp;
- cuenta;
- eliminación de cuenta.

---

## FASE 11 — PWA + SEO

Implementar:

- manifest;
- iconos;
- metadata;
- landing;
- privacidad;
- términos.

---

## FASE 12 — Tests

Implementar tests críticos.

---

## FASE 13 — Auditoría final

Antes de terminar:

1. Ejecutar TypeScript.
2. Ejecutar lint.
3. Ejecutar tests.
4. Comprobar build.
5. Revisar RLS.
6. Revisar cross-tenant access.
7. Revisar variables de entorno.
8. Revisar errores de consola.
9. Revisar responsive.
10. Revisar accesibilidad básica.
11. Revisar rutas protegidas.
12. Revisar que no haya mocks en producción.

Solucionar los errores encontrados.

---

# 50. CRITERIOS DE ACEPTACIÓN

Considera el MVP terminado únicamente cuando pueda realizarse este flujo:

```text
Usuario
  ↓
Registro
  ↓
Login
  ↓
Onboarding
  ↓
Crear negocio
  ↓
Crear servicio
  ↓
Dashboard
  ↓
Crear cliente
  ↓
Crear cita
  ↓
La cita aparece en "Hoy"
  ↓
La cita aparece correctamente en calendario
  ↓
Pulsar "Recordar por WhatsApp"
  ↓
WhatsApp se abre con número y mensaje correctos
  ↓
Usuario vuelve a Zazú
  ↓
Marca "Enviado"
  ↓
La cita muestra "Recordatorio enviado"
```

También debe funcionar:

```text
Usuario A → Negocio A
Usuario B → Negocio B

Usuario A NO puede ver datos de B.
Usuario B NO puede ver datos de A.
```

---

# 51. UX PRINCIPAL

El producto debe poder explicarse en una frase:

> "Zazú es una agenda sencilla que te permite recordar tus citas por WhatsApp en un clic."

Si una funcionalidad no contribuye a esa promesa, no la añadas al MVP.

---

# 52. REGLA DE ORO DE PRODUCTO

Cuando tengas que elegir entre:

### A

Una funcionalidad más completa pero más complicada.

### B

Una funcionalidad ligeramente menos potente pero muchísimo más sencilla.

Elige:

> **B**

Zazú gana por simplicidad.

---

# 53. COSAS QUE NO DEBES HACER

No añadas por iniciativa propia:

- chatbot;
- IA;
- marketplace;
- pagos entre clientes;
- reservas públicas;
- Google Calendar;
- Outlook;
- SMS;
- WhatsApp Business API;
- Twilio;
- Zapier;
- facturación;
- TPV;
- inventario;
- empleados;
- comisiones;
- estadísticas avanzadas;
- app móvil nativa.

Puedes dejar puntos de extensión arquitectónicos para ellas, pero no implementarlas.

---

# 54. FUTURO DEL PRODUCTO

La arquitectura debería permitir posteriormente añadir:

### V2

- recordatorios automáticos;
- WhatsApp Business API;
- confirmaciones automáticas;
- enlaces de reserva;
- Google Calendar;
- múltiples empleados;
- estadísticas de no-shows.

### V3

- Stripe;
- planes;
- equipos;
- automatizaciones;
- verticalización por profesión.

Pero NO construir estas funcionalidades ahora.

---

# 55. PRINCIPIO DE DISEÑO IMPORTANTE

No quiero una aplicación que parezca creada por un generador de dashboards.

Evita:

- exceso de cards;
- gradientes innecesarios;
- gráficos que no aportan;
- demasiados colores;
- animaciones gratuitas;
- navegación complicada;
- modales anidados.

Quiero una aplicación que un autónomo pueda entender sin tutorial.

---

# 56. RESULTADO FINAL ESPERADO

Al finalizar quiero tener un repositorio con:

```text
Zazú
├── aplicación Next.js funcional
├── Supabase correctamente integrado
├── PostgreSQL
├── RLS
├── Auth
├── multi-tenancy
├── onboarding
├── clientes
├── servicios
├── citas
├── calendario
├── dashboard
├── recordatorios WhatsApp
├── configuración
├── PWA
├── landing
├── privacidad
├── términos
├── tests
├── migrations
├── seed
├── README
└── .env.example
```

La aplicación debe poder:

```text
npm install
npm run dev
```

y, una vez configuradas las variables de entorno y Supabase, funcionar realmente.

---

# 57. FORMA DE TRABAJAR

Quiero que trabajes como un ingeniero senior responsable del resultado completo.

Antes de implementar cada fase:

1. Comprende el código existente.
2. Identifica dependencias.
3. Implementa la solución.
4. Ejecuta las comprobaciones necesarias.
5. Corrige errores.
6. Continúa con la siguiente fase.

No te detengas después de crear únicamente la arquitectura.

No me entregues simplemente archivos o snippets.

**Construye la aplicación completa.**

Si encuentras una decisión técnica ambigua:

- elige la opción más sencilla;
- segura;
- mantenible;
- coherente con Next.js + Supabase;
- y que minimice deuda técnica.

No introduzcas una dependencia externa si la funcionalidad puede resolverse limpiamente con las herramientas ya elegidas.

---

# 58. DEFINICIÓN FINAL DE "DONE"

No consideres terminado el proyecto hasta que:

- compile;
- pase TypeScript;
- pase lint;
- pasen los tests;
- haga build;
- Supabase esté correctamente integrado;
- RLS esté activo;
- el aislamiento multi-tenant esté probado;
- Auth funcione;
- el CRUD funcione;
- las citas funcionen;
- el calendario funcione;
- WhatsApp genere URLs válidas;
- el flujo de recordatorios funcione;
- la UI sea responsive;
- no haya datos mock en producción;
- no haya secretos hardcodeados;
- README permita levantar el proyecto desde cero.

Al finalizar, proporciona un resumen de:

1. Arquitectura.
2. Funcionalidades implementadas.
3. Estructura de base de datos.
4. Seguridad/RLS.
5. Variables de entorno necesarias.
6. Cómo ejecutar el proyecto.
7. Tests ejecutados y resultado.
8. Qué queda explícitamente fuera del MVP.
9. Cualquier decisión técnica importante que hayas tomado.

**Empieza ahora por inspeccionar el repositorio y ejecutar la FASE 0.**