# Auditoría técnica — La Cabaña POS, rama v1.1.3

**Fecha:** 17 de octubre de 2026.

## Alcance y método

Revisión estática de rutas, almacén Zustand, esquema SQL y servicio de impresión; instalación reproducible de dependencias, TypeScript, pruebas aisladas con Node y compilación Next.js en una **copia separada**. No se conectó ni escribió a una base de datos de producción, no se ejecutaron migraciones ni se emitieron tickets reales.

## Mejoras realizadas sin cambios de datos

1. Deshabilitar `GET /api/reset` (HTTP 410, sin operaciones sobre Supabase); anteriormente intentaba borrar pedidos, cierres y gastos.
2. Corregir incompatibilidades de TypeScript: número de mesa, zona, metadatos de entrega, UUID y referencia a pestaña inexistente.
3. Usar `ANULADA` en la cancelación de una orden, conforme al enum SQL; `CANCELADA` no existe para `ordenes.estado`.
4. Agrupar eventos Realtime de mesas, órdenes y artículos durante 200 ms para evitar consultas completas redundantes en ráfagas. Es una optimización de llamadas, **no** un caché Redis.
5. Rehabilitar la comprobación de tipos durante `next build` y hacer que el comando de build funcione también en Windows.
6. Añadir `npm run check` y pruebas automatizadas; ignorar nuevas claves `.key` y `.p12` sin alterar las que ya estaban versionadas.
7. Actualizar parches de seguridad sin cambiar de versión mayor: Next.js **15.5.9 → 15.5.28** y React/React DOM **19.2.1 → 19.2.9**. Versiones recomendadas en el aviso de seguridad del 14 de octubre de 2026.

## Verificación

- `npm ci --ignore-scripts --no-audit --no-fund`: correcto; 980 paquetes instalados en copia aislada.
- Antes de los cambios: `npm run typecheck` reportó **13** errores.
- Después: `npm run typecheck` completado sin errores.
- `npm run test`: **3 pruebas correctas**, 0 fallidas. Cubren la ruta de reset, fechas Bogotá y enum de anulación.
- `npm run build`: compilación Next.js 15.5.28 completada. 20 páginas generadas. JavaScript de primera carga del dashboard reportado: **325 kB** (medición del compilador, no rendimiento real del navegador).
- `npm audit --omit=dev --json`: estado original 6 críticas, 31 altas; después de la actualización de parches del primer lote 5 críticas y 31 altas. **Segundo lote:** actualización no destructiva de dependencias compatibles con `npm audit fix` (sin `--force`) y restablecimiento explícito de `@opentelemetry/exporter-jaeger@1.30.1` como dependencia de compatibilidad de Genkit: **0 críticas, 19 altas, 59 moderadas**. Es un conteo de avisos del árbol, no una prueba de ausencia de vulnerabilidades explotables. El exportador está obsoleto y requiere migración de telemetría posterior.
- **Segunda intervención:** 9 pruebas automatizadas correctas; compilación Next.js correcta sin advertencias de módulos faltantes; sintaxis del servicio de impresión comprobada. Servicio de impresión: `npm audit --omit=dev` sin avisos.
- **Segunda intervención:** se retiraron los `DROP TABLE` y `DROP TYPE` de `supabase/schema.sql` para reducir riesgos de borrado accidental; sigue siendo un script SOLO para una base vacía y deshabilita RLS.
- **CI:** se añadió un flujo GitHub Actions para validar TypeScript, pruebas, compilación y sintaxis del servicio tras cambios en `v1.1.3` (aún sujeto a ejecución real en GitHub).
- Sin pruebas E2E con datos reales ni benchmarks HTTP. La estabilidad de negocio en producción **no** está certificada.

## Riesgos críticos pendientes — requieren trabajo de arquitectura coordinado

### Autorización y datos (P0)

- `supabase/schema.sql` establece `DISABLE ROW LEVEL SECURITY` en tablas que contienen empleados, órdenes y pagos. `print-service/supabase-migration.sql` define una política `FOR ALL USING (true)` para la cola de impresión.
- `src/lib/store.ts` realiza consulta a `usuarios` con un PIN de cuatro dígitos desde el navegador y mantiene registros de empleados en el estado del cliente. `AuthWrapper.tsx` utiliza sesión del navegador; no constituye autenticación de base de datos.
- **Acción recomendada:** incorporar autenticación servidora verificable, roles, sesiones, operaciones privilegiadas en servidor y políticas RLS específicas; primero inventariar consumidores y crear pruebas de regresión en un entorno clonado. Activar RLS directamente sobre las tablas existentes sin esta transición rompería el POS.

### Credenciales y certificados (P0)

- Hay materiales `qz-tray.key`, `qz-tray.p12` y `root-ca.p12` comprometidos a GitHub. Nunca exponer los valores en reportes; determinar si siguen activos, rotar y evaluar limpieza histórica **solo con plan y respaldo**.
- `src/app/api/qz-sign/route.ts` no hace comprobación de sesión al firmar los datos recibidos. Revisar el flujo de confianza QZ antes de endurecerlo para no romper la impresión.

### Impresión y consistencia (P1)

- **Corregido en la segunda intervención:** `print-service/index.js` usa `execFile` con argumentos separados, impresoras permitidas detectadas en Windows, directorio temporal único y límite de 1 MiB por trabajo.
- **Corregido en la segunda intervención:** `print-service/queue-worker.js` reclama cada ticket mediante un UPDATE condicional de `pending` a `processing`. Solo los `pending` se recuperan automáticamente; `processing` exige comprobación manual ante incertidumbre de impresión. Se añadieron pruebas de concurrencia, desconexión y fallos con impresora simulada.
- **Pendiente:** esquema de autenticación RLS para print_queue; evitar la política pública de la migración histórica. No hay pruebas con impresoras físicas.

### Rendimiento y escalabilidad (P1)

- `src/lib/store.ts` descarga todas las órdenes y sus artículos en inicialización y refrescos. Supabase/PostgREST aplica límites por defecto y esta estrategia puede perder histórico o escalar mal.
- El archivo `src/app/dashboard/page.tsx` es muy grande (más de 130 kB de fuente); primera carga del dashboard de 324 kB, según el build. Separar secciones, cargar históricos por páginas y usar consultas agregadas.
- Medir número de solicitudes, tiempos p50/p95, filas devueltas y uso de memoria. Después optimizar consultas, índices y paginación; **no introducir Redis aún**. La aplicación usa un navegador que consulta directamente a Supabase y escucha Realtime: un Redis adicional no aceleraría automáticamente ese camino y podría servir datos obsoletos de caja, inventario o pedidos.
- Para usar Redis con seguridad se necesitaría backend propio, llaves de caché, invalidación ante escritura y controles de aislamiento por usuario/rol. Reservar para lecturas derivadas de alto volumen y nunca como fuente de verdad transaccional.

## Protección frente a pérdida de datos

No se borró ningún archivo de proyecto original, tabla, fila, clave ni artefacto de usuario. Las correcciones se prepararon en `Documents/lacabania-auditoria-v1.1.3`. **No ejecutar scripts de ejemplo contra producción.** Antes de migraciones posteriores, preparar respaldo verificable, ventana de mantenimiento, plan de recuperación y pruebas sobre un duplicado anonimizado.
