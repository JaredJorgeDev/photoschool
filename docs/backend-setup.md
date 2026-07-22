# Backend Setup PhotoSchool

Esta fase deja lista la base para conectar Supabase y Vercel Functions sin incluir secretos ni pagos reales.

## Lo Que Ya Quedó En El Repositorio

- Dependencias: `@supabase/supabase-js` y `zod`.
- Variables documentadas en `.env.example`.
- Función `GET /api/health`.
- Función `GET/PATCH /api/admin/settings`.
- Cliente Supabase server-side en `lib/server/supabase.js`.
- Migración inicial en `supabase/migrations/0001_initial_schema.sql`.

## Configuración Operacional

El CMS envía configuración con valores estructurados que el servidor valida:

- Zona horaria: catálogo cerrado.
- Vigencia de galería: catálogo cerrado.
- Días de descarga: catálogo cerrado.
- Métodos de pago: `mercado_pago` y `transferencia`.
- Entrega impresa: `recoleccion_personal`.

Los precios siguen siendo numéricos editables, pero el backend recalculará importes en producción antes de crear órdenes o aceptar pagos.

## Variables Que Deben Configurarse En Vercel

Configurar en el proyecto correcto: `kunsanggar/photoschool-demo`.

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PHOTOSCHOOL_PUBLIC_URL`
- `PHOTOSCHOOL_ADMIN_USERNAME`
- `PHOTOSCHOOL_ADMIN_PASSWORD_HASH`
- `PHOTOSCHOOL_TIMEZONE`
- `PHOTOSCHOOL_GALLERY_VALIDITY_MONTHS`
- `PHOTOSCHOOL_DOWNLOAD_VALIDITY_DAYS`

No guardar claves reales en el repositorio. La service role key solo debe usarse en funciones server-side.

## Pasos Manuales Necesarios

1. Crear un proyecto nuevo en Supabase para PhotoSchool.
2. Copiar `Project URL`, `anon public key` y `service_role key`.
3. Ejecutar la migración `supabase/migrations/0001_initial_schema.sql` en Supabase SQL Editor.
4. Crear buckets de Storage privados para:
   - `photo-originals`
   - `photo-protected`
   - `photo-thumbnails`
   - `photo-downloads`
5. Configurar las variables anteriores en Vercel.
6. Redepoyar producción cuando las variables estén configuradas.

## Pendiente Antes De Producción

- Autenticación real de usuarios y administradores.
- Hash y verificación segura de contraseña admin.
- Políticas RLS para usuarios autenticados.
- Webhooks de Mercado Pago.
- Generación real de enlaces firmados.
- Procesamiento real de marca de agua y miniaturas.
- Cron para publicación, expiración y limpieza de galerías.
