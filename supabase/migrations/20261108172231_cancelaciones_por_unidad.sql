-- Incremental update: preserves orders, quantities, sales and existing permissions.
BEGIN;

ALTER TABLE public.items_orden
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz,
  ADD COLUMN IF NOT EXISTS canceled_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- Recover historical times only when an actual cancellation audit identifies the item.
WITH recorded AS (
  SELECT DISTINCT ON (i.id) i.id, m.fecha, m.usuario_id, m.observaciones
  FROM public.items_orden i
  JOIN public.modificaciones_comanda m ON m.orden_id = i.orden_id
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(m.items_afectados) = 'array' THEN m.items_afectados ELSE '[]'::jsonb END
  ) affected
  WHERE i.estado = 'CANCELADO' AND i.canceled_at IS NULL
    AND m.tipo = 'CANCELACION' AND affected->>'id' = i.id::text
  ORDER BY i.id, m.fecha DESC, m.id DESC
)
UPDATE public.items_orden i
SET canceled_at = r.fecha, canceled_by = r.usuario_id, cancellation_reason = r.observaciones
FROM recorded r WHERE i.id = r.id;

-- A fully annulled order also needs the actual event time, without rewriting old history.
CREATE OR REPLACE FUNCTION public.marcar_hora_anulacion_orden()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW.estado = 'ANULADA' AND OLD.estado IS DISTINCT FROM NEW.estado THEN
    NEW.updated_at := clock_timestamp();
  END IF;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER hora_anulacion_orden BEFORE UPDATE OF estado ON public.ordenes
FOR EACH ROW EXECUTE FUNCTION public.marcar_hora_anulacion_orden();
REVOKE ALL ON FUNCTION public.marcar_hora_anulacion_orden() FROM PUBLIC;

-- A stale kitchen screen must never turn a canceled unit into a chargeable one.
CREATE OR REPLACE FUNCTION public.proteger_item_cancelado()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF OLD.estado = 'CANCELADO' AND NEW.estado <> 'CANCELADO' THEN
    RAISE EXCEPTION 'Un producto cancelado no puede reactivarse. Registra una nueva unidad si es necesario.';
  END IF;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER proteger_item_cancelado BEFORE UPDATE OF estado ON public.items_orden
FOR EACH ROW EXECUTE FUNCTION public.proteger_item_cancelado();
REVOKE ALL ON FUNCTION public.proteger_item_cancelado() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.cancelar_item_orden(
  p_orden_id uuid,
  p_item_id uuid,
  p_cantidad integer,
  p_usuario_id uuid,
  p_solicitud_id uuid,
  p_observaciones text DEFAULT NULL,
  p_reemplazo_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_order public.ordenes%ROWTYPE;
  v_user public.usuarios%ROWTYPE;
  v_item public.items_orden%ROWTYPE;
  v_canceled public.items_orden%ROWTYPE;
  v_replacement public.items_orden%ROWTYPE;
  v_menu public.menu_items%ROWTYPE;
  v_audit public.modificaciones_comanda%ROWTYPE;
  v_stock integer;
  v_timestamp timestamptz;
BEGIN
  IF p_cantidad IS NULL OR p_cantidad < 1 OR p_solicitud_id IS NULL THEN
    RAISE EXCEPTION 'La cantidad debe ser un entero positivo y la solicitud debe tener identificador.';
  END IF;
  SELECT * INTO v_order FROM public.ordenes WHERE id = p_orden_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'No se encontró el pedido.'; END IF;
  SELECT * INTO v_user FROM public.usuarios WHERE id = p_usuario_id AND estado = 'ACTIVO';
  IF NOT FOUND THEN RAISE EXCEPTION 'La cancelación requiere un usuario activo.'; END IF;
  IF v_user.rol = 'MESERO' AND v_order.mesero_id <> p_usuario_id THEN
    RAISE EXCEPTION 'Solo el mesero asignado o caja pueden modificar este pedido.';
  END IF;

  -- A retry of the same request returns its confirmed result, without restoring stock twice.
  SELECT * INTO v_audit FROM public.modificaciones_comanda WHERE id = p_solicitud_id;
  IF FOUND THEN
    IF v_audit.orden_id <> p_orden_id OR v_audit.usuario_id <> p_usuario_id
      OR v_audit.tipo <> 'CANCELACION'
      OR (v_audit.items_afectados->0->>'sourceItemId') IS DISTINCT FROM p_item_id::text
      OR (v_audit.items_afectados->0->>'cantidad')::integer IS DISTINCT FROM p_cantidad
      OR (v_audit.items_afectados->0->>'replacementMenuId') IS DISTINCT FROM p_reemplazo_id::text THEN
      RAISE EXCEPTION 'Este identificador ya pertenece a otra modificación.';
    END IF;
    SELECT * INTO v_canceled FROM public.items_orden WHERE id = (v_audit.items_afectados->0->>'id')::uuid;
    SELECT * INTO v_replacement FROM public.items_orden WHERE id = (v_audit.items_afectados->0->>'replacementItemId')::uuid;
  ELSE
    IF v_order.estado <> 'ABIERTA' THEN RAISE EXCEPTION 'El pedido ya fue pagado o anulado.'; END IF;
    SELECT * INTO v_item FROM public.items_orden WHERE id = p_item_id AND orden_id = p_orden_id FOR UPDATE;
    IF NOT FOUND OR v_item.estado = 'CANCELADO' THEN RAISE EXCEPTION 'El producto ya no está disponible para cancelar.'; END IF;
    IF p_cantidad > v_item.cantidad THEN RAISE EXCEPTION 'La cantidad supera las unidades actuales. Actualiza el pedido.'; END IF;
    IF p_reemplazo_id = v_item.menu_item_id THEN RAISE EXCEPTION 'Selecciona un producto de reemplazo diferente.'; END IF;

    -- Deterministic lock order prevents two opposite product changes from deadlocking.
    PERFORM id FROM public.menu_items WHERE id IN (v_item.menu_item_id, p_reemplazo_id) ORDER BY id FOR UPDATE;
    IF p_reemplazo_id IS NOT NULL THEN
      SELECT * INTO v_menu FROM public.menu_items WHERE id = p_reemplazo_id AND disponible;
      IF NOT FOUND THEN RAISE EXCEPTION 'El reemplazo no está disponible.'; END IF;
      IF v_menu.descripcion ~ '^\[STOCK:[0-9]+\]' THEN
        v_stock := substring(v_menu.descripcion FROM '^\[STOCK:([0-9]+)\]')::integer;
        IF v_stock < p_cantidad THEN RAISE EXCEPTION 'No hay suficientes unidades del producto de reemplazo.'; END IF;
      END IF;
    END IF;

    v_timestamp := clock_timestamp();
    IF p_cantidad = v_item.cantidad THEN
      UPDATE public.items_orden SET estado = 'CANCELADO', canceled_at = v_timestamp,
        canceled_by = p_usuario_id, cancellation_reason = nullif(btrim(p_observaciones), '')
      WHERE id = v_item.id RETURNING * INTO v_canceled;
    ELSE
      UPDATE public.items_orden SET cantidad = cantidad - p_cantidad WHERE id = v_item.id;
      INSERT INTO public.items_orden (orden_id, menu_item_id, nombre, cantidad, precio_unitario,
        notas, estacion, estado, created_at, canceled_at, canceled_by, cancellation_reason)
      VALUES (p_orden_id, v_item.menu_item_id, v_item.nombre, p_cantidad, v_item.precio_unitario,
        v_item.notas, v_item.estacion, 'CANCELADO', v_item.created_at, v_timestamp,
        p_usuario_id, nullif(btrim(p_observaciones), '')) RETURNING * INTO v_canceled;
    END IF;

    -- Keep the legacy finite-stock representation, with a locked, server-side increment.
    UPDATE public.menu_items
      SET descripcion = regexp_replace(descripcion, '^\[STOCK:[0-9]+\]',
        '[STOCK:' || (substring(descripcion FROM '^\[STOCK:([0-9]+)\]')::integer + p_cantidad)::text || ']')
      WHERE id = v_item.menu_item_id AND descripcion ~ '^\[STOCK:[0-9]+\]';

    IF p_reemplazo_id IS NOT NULL THEN
      INSERT INTO public.items_orden (orden_id, menu_item_id, nombre, cantidad, precio_unitario,
        notas, estacion, estado, created_at)
      VALUES (p_orden_id, v_menu.id, v_menu.nombre, p_cantidad, v_menu.precio,
        'Cambio por: ' || v_item.nombre, v_menu.estacion, 'EN PREPARACION', v_timestamp)
      RETURNING * INTO v_replacement;
      UPDATE public.menu_items
        SET descripcion = regexp_replace(descripcion, '^\[STOCK:[0-9]+\]',
          '[STOCK:' || (substring(descripcion FROM '^\[STOCK:([0-9]+)\]')::integer - p_cantidad)::text || ']')
        WHERE id = p_reemplazo_id AND descripcion ~ '^\[STOCK:[0-9]+\]';
    END IF;

    -- Audit failure rolls back the entire modification, including stock and replacement.
    INSERT INTO public.modificaciones_comanda (id, orden_id, usuario_id, tipo, items_afectados, observaciones, fecha)
    VALUES (p_solicitud_id, p_orden_id, p_usuario_id, 'CANCELACION', jsonb_build_array(jsonb_build_object(
      'id', v_canceled.id, 'sourceItemId', v_item.id, 'menuItemId', v_item.menu_item_id,
      'nombre', v_item.nombre, 'cantidad', p_cantidad, 'cantidadAnterior', v_item.cantidad,
      'cantidadRestante', v_item.cantidad - p_cantidad, 'precioUnitario', v_item.precio_unitario,
      'estacion', v_item.estacion, 'estado', 'CANCELADO', 'createdAt', v_item.created_at,
      'canceledAt', v_timestamp, 'canceledBy', p_usuario_id,
      'replacementItemId', v_replacement.id, 'replacementMenuId', p_reemplazo_id
    )), nullif(btrim(p_observaciones), ''), v_timestamp);
  END IF;

  RETURN jsonb_build_object('canceledItem', to_jsonb(v_canceled),
    'replacementItem', CASE WHEN v_replacement.id IS NOT NULL THEN to_jsonb(v_replacement) ELSE NULL END,
    'items', (SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY i.created_at, i.id), '[]'::jsonb)
      FROM public.items_orden i WHERE i.orden_id = p_orden_id));
END;
$$;

-- Preserve the existing PIN-based application's access model; never bypass table policies.
REVOKE ALL ON FUNCTION public.cancelar_item_orden(uuid, uuid, integer, uuid, uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancelar_item_orden(uuid, uuid, integer, uuid, uuid, text, uuid) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
