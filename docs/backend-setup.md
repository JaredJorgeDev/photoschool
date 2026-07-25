# Backend Setup PhotoSchool

Esta fase deja lista la base para conectar Supabase y Vercel Functions sin incluir secretos ni pagos reales.

## Lo Que Ya Quedó En El Repositorio

- Dependencias: `@supabase/supabase-js` y `zod`.
- Variables documentadas en `.env.example`.
- Función `GET /api/health`.
- Función `GET/PATCH /api/admin/settings`.
- Funciones `POST /api/auth/register`, `POST /api/auth/login` y `POST /api/auth/recover`.
- Función `POST /api/admin/login`.
- Función `GET/POST /api/admin/schools`.
- Cliente Supabase server-side en `lib/server/supabase.js`.
- Migración inicial en `supabase/migrations/0001_initial_schema.sql`.
- Script `npm run seed:supabase` para cargar Colegio Antares y Pedro de Gante.

## Configuración Operacional

El CMS envía configuración con valores estructurados que el servidor valida:

- Zona horaria: catálogo cerrado.
- Vigencia de galería: catálogo cerrado.
- Días de descarga: catálogo cerrado.
- Métodos de pago: `mercado_pago` y `transferencia`.
- Entrega impresa: `recoleccion_personal`.

Los precios siguen siendo numéricos editables, pero el backend recalculará importes en producción antes de crear órdenes o aceptar pagos.

## Variables Que Deben Configurarse En Vercel

Configurar en el proyecto correcto de Vercel: `photoschool-demo`.

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PHOTOSCHOOL_PUBLIC_URL`
- `PHOTOSCHOOL_ADMIN_USERNAME`
- `PHOTOSCHOOL_ADMIN_PASSWORD_HASH`
- `PHOTOSCHOOL_TIMEZONE`
- `PHOTOSCHOOL_GALLERY_VALIDITY_MONTHS`
- `PHOTOSCHOOL_DOWNLOAD_VALIDITY_DAYS`
- `MERCADO_PAGO_ACCESS_TOKEN` cuando Alberto autorice Mercado Pago.
- `MERCADO_PAGO_WEBHOOK_SECRET` cuando se configure el webhook.
- `MERCADO_PAGO_PUBLIC_KEY` cuando se conecte el checkout real.

No guardar claves reales en el repositorio. La service role key solo debe usarse en funciones server-side.

## Pasos Manuales Necesarios

1. Ejecutar la migración `supabase/migrations/0001_initial_schema.sql` en Supabase SQL Editor o proporcionar `DATABASE_URL` para ejecutarla desde terminal.
2. Confirmar que Auth por correo y contraseña esté habilitado en Supabase.
3. Ejecutar `npm run seed:supabase` con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` para cargar escuelas provisionales.
4. Crear buckets de Storage privados para:
   - `photo-originals`
   - `photo-protected`
   - `photo-thumbnails`
   - `photo-downloads`
5. Configurar las variables anteriores en Vercel.
6. Redeployar producción cuando las variables estén configuradas.
7. Crear aplicación de Mercado Pago y entregar credenciales sandbox/productivas cuando se autorice el pago real.

## Pendiente Antes De Producción

- Conectar el frontend de cuenta y CMS a las APIs nuevas.
- Endpoints reales de eventos, galerías, fotos, pedidos y notificaciones.
- Políticas RLS para usuarios autenticados.
- Webhooks de Mercado Pago.
- Generación real de enlaces firmados.
- Procesamiento real de marca de agua y miniaturas.
- Cron para publicación, expiración y limpieza de galerías.
