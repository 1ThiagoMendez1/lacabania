-- ============================================================
-- Migración: Cola de impresión para servicio Node.js
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Tabla de cola de impresión
CREATE TABLE IF NOT EXISTS print_queue (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  station_id   TEXT        NOT NULL,
  printer_name TEXT        NOT NULL,
  data         JSONB       NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'pending',  -- pending | processing | done | error
  error_msg    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Política de acceso (la tabla es interna, acceso total)
ALTER TABLE print_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on print_queue" ON print_queue;
CREATE POLICY "Allow all operations on print_queue" ON print_queue
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Habilitar Realtime en la tabla
ALTER PUBLICATION supabase_realtime ADD TABLE print_queue;

-- 4. Agregar columna available_printers a configuracion_impresoras
--    (para que el servicio Node.js publique la lista de impresoras)
ALTER TABLE configuracion_impresoras
  ADD COLUMN IF NOT EXISTS available_printers JSONB DEFAULT '[]'::jsonb;

-- 5. Índice para consultas rápidas de jobs pendientes
CREATE INDEX IF NOT EXISTS idx_print_queue_status ON print_queue (status, created_at);

-- ============================================================
-- Verificación (opcional - ejecutar después de la migración)
-- ============================================================
-- SELECT * FROM print_queue LIMIT 5;
-- SELECT available_printers FROM configuracion_impresoras WHERE id = 'default';
