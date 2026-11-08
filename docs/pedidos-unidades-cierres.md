# Pedidos por unidades y recordatorios de cierre

Base: rama `v1.1.3`.

## Comportamiento

- Mesas, pedido, caja e historial muestran la fecha y hora de Colombia con segundos, sin depender de la zona horaria del dispositivo.
- Adiciones iguales del mismo producto se muestran en una sola línea, por ejemplo Churrasco ×3. Las observaciones y precios distintos conservan su propia preparación. Los estados se resumen por unidades y el detalle desplegable conserva cada hora original. El cobro y los recibos usan la misma agrupación.
- La cancelación permite seleccionar de 1 a la cantidad disponible. Cancelar 2 de 3 churrascos conserva 1 en su estado de preparación original y registra las otras 2 unidades como canceladas. El cobro excluye esas unidades.
- Cada cancelación conserva la hora original del pedido y registra hora del servidor, responsable, motivo y cantidades. Las cancelaciones antiguas recuperan su hora únicamente si existe una auditoría que identifica el producto; en los demás casos se indica que la hora no está registrada.
- El reemplazo opcional usa solo las unidades seleccionadas. La cancelación, las existencias, el reemplazo y la auditoría se guardan juntos en una transacción. Una solicitud repetida con el mismo identificador devuelve su resultado anterior. Una pantalla de cocina desactualizada no puede reactivar unidades canceladas.
- El ticket a cocina contiene la cantidad cancelada y ambas horas. Una falla de impresión se presenta como impresión pendiente de una cancelación ya guardada.
- La misma ventana se usa en Mesas, Pedidos y Entregas. Se impiden envíos repetidos mientras se guarda; un error conserva la ventana y permite reintentar.
- El historial incluye pedidos pagados y anulados. Los pedidos anulados no se presentan como ventas ni permiten imprimir un recibo de pago.

## Cierres

Administradores y cajeros ven un aviso persistente y un recordatorio al ingresar cuando existen fechas anteriores pendientes. Pueden continuar atendiendo. El aviso desaparece cuando la base confirma los cierres; no depende de cierres guardados únicamente en el navegador.

La pantalla Cierre Diario permite elegir cada fecha pendiente. Solo cuentan fechas con pedidos o gastos; los días sin actividad no generan pendientes. Un pedido iniciado antes de medianoche y pagado después representa actividad en ambas fechas, pero el ingreso se cuenta solo el día del pago en Colombia.

El cierre de hoy se bloquea si queda cualquier pedido abierto. Para una fecha anterior, bloquean los pedidos abiertos iniciados ese día o antes; pedidos nuevos de hoy permiten regularizar los días anteriores. Cerrar una fecha anterior no adelanta la fecha operativa ni cierra la caja de hoy.

Los cierres se consultan con paginación y se actualizan cada minuto mientras la aplicación está visible, al recuperar el foco y después de cerrar o reabrir desde Cierre Diario. Un fallo de consulta muestra un aviso y bloquea confirmar desde esa pantalla hasta poder comprobar los cierres.

## Actualización de una instalación existente

1. Obtener un respaldo y revisar la estructura de la instalación objetivo.
2. Aplicar, en orden, `supabase/migrations/20261108172231_cancelaciones_por_unidad.sql` y `supabase/migrations/20261108174956_cancelaciones_agrupadas.sql` en la base correspondiente. Son incrementales, transaccionales y no eliminan pedidos ni cierres. No ejecutar `supabase/schema.sql` contra una instalación existente.
3. Desplegar esta rama con las variables actuales de Supabase. No requiere claves nuevas ni cambios en el servicio de impresión de Windows.
4. Verificar un pedido de prueba: 3 unidades, cancelar 2, refrescar, comprobar 1 cobrable y el registro de 2 canceladas. Revisar el aviso y un cierre de fecha anterior.

La migración instala campos de auditoría, el RPC `cancelar_item_orden` y un trigger que registra la hora del servidor al anular un pedido completo. El RPC es `SECURITY INVOKER`, conserva los permisos existentes de las tablas y no desactiva RLS. Mantiene compatibilidad con el acceso por PIN existente; este cambio no reemplaza ese mecanismo de autenticación.

El RPC adicional `cancelar_items_orden` permite cancelar unidades de varias adiciones iguales en una transacción. Conserva sus registros originales, vincula las auditorías a una misma solicitud y evita cancelaciones adicionales al reintentar. Se eligen primero las unidades pendientes o en preparación; las entregadas quedan al final.

El frontend detecta si falta el RPC y explica que debe instalarse la actualización de base de datos. La migración debe aplicarse antes del despliegue para evitar interrumpir las cancelaciones.

## Validación

`npm run check` ejecuta TypeScript y las pruebas, incluidas pruebas reales del SQL con PostgreSQL embebido (PGlite), sin conectar con producción. Cubren cancelaciones parciales y completas, reintentos, existencias, reemplazos, errores de auditoría con rollback, pedidos pagados, cantidades inválidas, recuperación histórica de horas, fechas colombianas, pendientes y bloqueos del cierre.

`npm run build` comprueba la compilación de producción. Las impresoras físicas y el despliegue sobre la base real deben verificarse en la instalación objetivo.
