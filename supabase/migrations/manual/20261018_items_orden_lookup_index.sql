-- Performance index for loading POS order line items.
-- Applied to La Cabaña production on 2026-10-18 after a verified public-schema backup.
-- Run separately (outside BEGIN/COMMIT), during a low-traffic period.
-- Safe to rerun; never drops tables or existing data.
CREATE INDEX CONCURRENTLY IF NOT EXISTS items_orden_orden_id_idx
    ON public.items_orden (orden_id);
