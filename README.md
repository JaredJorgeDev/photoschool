# PhotoSchool

Plataforma privada y pública de **Photos Time** para exhibir, seleccionar y comprar fotografía escolar. Dominio previsto de referencia: `photoschool.com.mx`.

## Ejecutar

```bash
npm install
npm run dev
```

Abrir `http://localhost:4173`.

## Rutas

- Inicio público: `#/`
- Galerías públicas: `#/galerias`
- Acceso privado: `#/acceso`
- Antesala de escuela: se genera al validar un código de escuela activo.
- Galería privada: se genera al validar el código del evento correspondiente.
- Carrito: `#/carrito`
- Checkout: `#/checkout`
- Login usuario: `#/login`
- Registro usuario: `#/registro`
- Recuperación de cuenta: `#/recuperar`
- Dashboard usuario: `#/cuenta`
- Administración: `/admin`

## Acceso Privado

El flujo privado ahora es jerárquico:

1. Código de escuela.
2. Antesala privada de esa escuela.
3. Código específico del evento.
4. Galería privada.

Una escuela no ve otras escuelas. No hay selector público de escuelas privadas ni listado general indexable.

Los códigos definitivos se capturan por escuela y por evento desde el CMS.

## Administración

- Usuario: `alberto`
- Contraseña: `photostime2026`

El CMS incluye dashboard, escuelas, eventos, galerías privadas, galerías públicas, fotografías, pedidos, clientes, notificaciones, precios y configuración. La sección de configuración permite editar precios, vigencias, pagos, dominio previsto y entrega de impresiones.

El CMS incluye como base provisional únicamente estas escuelas: Colegio Antares y Pedro de Gante. No hay eventos, pedidos, clientes ni fotografías privadas inventadas; esos datos se cargarán cuando Alberto los proporcione.

## Funciones Implementadas

- Acceso privado escuela → evento.
- Separación entre escuelas en los datos locales.
- Galerías públicas tipo portafolio sin código.
- Diferenciación clara entre galería pública y privada.
- Reactivación temporal de galerías vencidas.
- Estados centralizados de galería.
- Publicación inmediata, programada y borrador.
- Cuenta regresiva para galerías programadas.
- Publicación anticipada con confirmación.
- Página de espera para galerías programadas.
- Notificaciones registradas por correo y WhatsApp.
- Log administrativo de notificaciones con reintento registrado.
- Login, registro, recuperación de cuenta y dashboard de usuario.
- APIs iniciales para registro, inicio de sesión y recuperación con Supabase Auth.
- API administrativa inicial para lectura y alta de escuelas en Supabase.
- Asociación de galería desbloqueada a cuenta cuando hay sesión.
- Carrito, checkout y confirmación existentes conservados.

## Precios

Reglas base centralizadas en `src/config.js` y editables desde `/admin?view=settings` o `/admin?view=pricing`:

- 1 a 5 fotografías: $45 MXN por foto.
- 6 a 10 fotografías: $40 MXN por foto.
- Desde 11 fotografías: $35 MXN por foto.
- Impresión 5x7: $5 MXN adicionales por copia.

## Decisiones Confirmadas

- Mercado Pago principal.
- Transferencia bancaria alternativa.
- Descargas durante 7 días después del pago.
- Impresiones por Recolección personal.
- Galerías con vencimiento.
- Pedidos y pagos se conservan aunque la galería venza o se elimine.

## Diferencias Entre Versión Actual Y Producción

- La autenticación real está pendiente.
- Los permisos se aplicarán en backend; localStorage no es seguridad.
- La entrega real de correos electrónicos está pendiente.
- WhatsApp real está pendiente.
- La publicación y expiración automática requieren cron o tarea serverless.
- El storage privado está pendiente.
- Los originales deben servirse desde almacenamiento privado.
- Las descargas usarán enlaces firmados con expiración.
- Los pagos se validarán por webhook.
- Los precios se recalcularán en servidor.

## Para Conectar Backend

Ya existe una migración base en `supabase/migrations/0001_initial_schema.sql`.

El proyecto Supabase de PhotoSchool debe usar:

- URL: `https://favxlanxbozcmhzvpyvb.supabase.co`
- Auth: correo y contraseña habilitados.
- Storage privado: `photo-originals`, `photo-protected`, `photo-thumbnails`, `photo-downloads`.

Para instalar la base hay dos caminos:

- Preferido: ejecutar la migración desde aquí con acceso a la base. Para eso necesito el password de base de datos de Supabase o una cadena `DATABASE_URL` directa.
- Alternativa: que alguien con acceso a Supabase copie y ejecute `supabase/migrations/0001_initial_schema.sql` en SQL Editor y avise cuando termine.

Después de correr la migración, sembrar escuelas provisionales:

```bash
SUPABASE_URL="https://favxlanxbozcmhzvpyvb.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="..." \
npm run seed:supabase
```

Variables en Vercel para el backend:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PHOTOSCHOOL_ADMIN_USERNAME=alberto`
- `PHOTOSCHOOL_ADMIN_PASSWORD_HASH`
- `PHOTOSCHOOL_PUBLIC_URL=https://photoschool-demo.vercel.app`

El hash temporal para la contraseña `photostime2026` ya está documentado en `.env.example`.

Datos operativos pendientes de Alberto:

- Lista de escuelas con nombre, slug deseado, código de escuela y contacto autorizado.
- Lista de eventos por escuela con nombre, fecha, código de evento, publicación y vencimiento.
- Categorías reales por evento.
- Reglas finales de precios si cambian.
- Método exacto para transferencia bancaria cuando se autorice mostrarlo.
- Fotos o estructura de carpetas para preparar carga a Storage.

Con eso puedo conectar el CMS completo a Supabase, reemplazar persistencia local, crear endpoints reales para eventos/pedidos/configuración y dejar listo el flujo para carga de fotografías.

## Mercado Pago

Mercado Pago sigue fuera de la ejecución real en esta fase. Ya están preparados los nombres de variables en `.env.example`:

- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_SECRET`
- `MERCADO_PAGO_PUBLIC_KEY`

Para activarlo después se necesita que Alberto cree la aplicación de Mercado Pago, entregue credenciales sandbox o productivas autorizadas, configure la URL pública de webhook en Vercel y confirme el flujo fiscal/operativo de transferencias. El backend deberá crear preferencias de pago y validar pagos por webhook antes de liberar descargas.

## Pruebas

```bash
npm test
npm run build
```

`npm test` valida límites de precios y copias impresas. `npm run build` genera `public/` para Vercel y ejecuta revisión estática.
