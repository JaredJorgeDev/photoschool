# PhotoSchool Fase 2: almacenamiento y seguridad

Esta maqueta no implementa almacenamiento productivo, pagos reales ni seguridad de servidor. Para la siguiente fase:

- Los originales permaneceran privados en almacenamiento con politicas de acceso por servidor.
- Cada fotografia debera tener original privado, miniatura, vista protegida con marca de agua, metadatos e identificador.
- Las descargas se habilitaran solo despues de confirmar pago y usaran enlaces firmados con expiracion de 7 dias.
- Los precios se recalcularan en backend; el cliente solo enviara intenciones de compra.
- Mercado Pago se validara mediante webhook antes de liberar descargas.
- Transferencia bancaria no mostrara datos productivos en el frontend hasta definir el flujo operativo.
- Las galerias tendran vigencia maxima de 2 meses; al vencer, dejaran de aceptar accesos y compras.
- Al vencer, las fotografias se eliminaran o archivaran segun politica operativa; pedidos, pagos y auditoria se conservaran.
- El acceso privado debe validarse en backend con permisos escuela -> evento; el frontend no debe consultar ni revelar otras escuelas.
- Las galerias programadas, expiradas y reactivadas deben procesarse mediante cron o funcion serverless, no por el navegador del administrador.
- La reactivacion debe registrar usuario administrador, fecha, nuevo vencimiento y conservar pedidos previos.
- Las notificaciones reales por correo y WhatsApp requieren consentimiento, plantillas aprobadas, logs, reintentos y exclusion de codigos privados.
- El dashboard de usuario debe consultar solo galerias y pedidos asociados al usuario autenticado.
- El panel administrativo usara autenticacion real, roles, logs de auditoria y permisos de servidor.
- Los eventos deben contemplar hasta 2,000 fotografias, carga masiva, control de consumo por evento, backups y registro de archivos eliminados.

Las medidas visuales de Fase 1, como marca de agua, bloqueo de arrastre y bloqueo de menu contextual, son solo disuasorias para la maqueta.
