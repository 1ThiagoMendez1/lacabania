# La Cabaña — Punto de Venta

Aplicación de punto de venta para restaurante basada en **Next.js 15**, **React 19**, **TypeScript**, **Zustand** y **Supabase**. Incluye mesas, comandas, cocina, entregas, caja, inventario, reportes y un servicio de impresión independiente para Windows.

## Entorno de desarrollo

Requisitos: Node.js compatible con Next.js 15, npm y un proyecto de Supabase configurado.

1. `npm ci`
2. Configurar las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en un archivo `.env.local` **no versionado** (no utilizar claves de servicio en variables públicas).
3. `npm run check` — ejecuta la validación estática de TypeScript y las pruebas automatizadas.
4. `npm run dev` — inicia la aplicación en el puerto 9002.
5. `npm run build` — verifica la compilación optimizada de producción.

El proyecto no configura actualmente un linter independiente; la compilación omite ESLint. No debe confundirse una compilación correcta con una auditoría integral de seguridad.

## Servicio de impresión

`print-service/` contiene el agente de impresión para Windows que consume la cola de Supabase. Su configuración de servidor y clave privilegiada debe mantenerse **exclusivamente en el equipo de impresión**, nunca en el cliente web ni en GitHub.

## Protección de datos: lectura obligatoria

- **NO EJECUTAR** `supabase/schema.sql` sobre una base que contenga información: incluye múltiples `DROP TABLE ... CASCADE`, lo que borraría datos.
- `/api/reset` está deshabilitado y devuelve HTTP 410. No existe operación de reseteo remoto.
- El SQL histórico desactiva Row Level Security en tablas de negocio; **no lo utilices como configuración de seguridad en producción**. Migrar a autenticación y políticas RLS probadas antes de cambiar el acceso actual.
- Las claves y contenedores criptográficos `.key` y `.p12` previamente versionados requieren evaluación y rotación. Añadirlos a `.gitignore` no elimina copias históricas ni revoca claves.
- No se deben realizar pruebas contra datos reales, ejecutar migraciones destructivas o probar cobros/impresiones reales sin preparación y respaldo verificable.

## Documentación técnica

Ver [informe de auditoría de v1.1.3](docs/auditoria-v1.1.3.md), con cambios efectuados, pruebas y riesgos aún pendientes.
