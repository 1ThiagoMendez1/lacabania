BEGIN;

CREATE INDEX IF NOT EXISTS modificaciones_comanda_orden_idx ON public.modificaciones_comanda (orden_id);

-- Keep each original addition, but cancel a visible product group atomically.
CREATE OR REPLACE FUNCTION public.cancelar_items_orden(
  p_orden_id uuid, p_items jsonb, p_usuario_id uuid, p_solicitud_id uuid,
  p_observaciones text DEFAULT NULL, p_reemplazo_id uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_request jsonb;
  v_normalized jsonb;
  v_previous jsonb;
  v_result jsonb;
  v_child_id uuid;
  v_canceled jsonb := '[]'::jsonb;
  v_replacements jsonb := '[]'::jsonb;
  v_count integer;
  v_distinct integer;
  v_products integer;
BEGIN
  IF p_solicitud_id IS NULL OR p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'Selecciona las unidades del producto que deseas cancelar.';
  END IF;
  SELECT count(*), count(DISTINCT (entry->>'id')::uuid),
    jsonb_agg(jsonb_build_object('id', (entry->>'id')::uuid, 'cantidad', (entry->>'cantidad')::integer) ORDER BY (entry->>'id')::uuid)
  INTO v_count, v_distinct, v_normalized FROM jsonb_array_elements(p_items) entry;
  IF v_count = 0 OR v_count <> v_distinct OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_normalized) entry WHERE (entry->>'cantidad')::integer IS NULL OR (entry->>'cantidad')::integer < 1
  ) THEN RAISE EXCEPTION 'Las unidades a cancelar no son válidas.'; END IF;

  PERFORM id FROM public.ordenes WHERE id = p_orden_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'No se encontró el pedido.'; END IF;

  SELECT affected->'groupItems' INTO v_previous
  FROM public.modificaciones_comanda audit
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(audit.items_afectados) = 'array' THEN audit.items_afectados ELSE '[]'::jsonb END) affected
  WHERE audit.orden_id = p_orden_id AND affected->>'groupRequestId' = p_solicitud_id::text LIMIT 1;
  IF FOUND AND v_previous IS DISTINCT FROM v_normalized THEN
    RAISE EXCEPTION 'La solicitud ya se confirmó con otras cantidades. Revisa el pedido antes de cambiarla.';
  END IF;

  SELECT count(*), count(DISTINCT jsonb_build_array(i.menu_item_id, i.nombre, i.precio_unitario, i.estacion, btrim(coalesce(i.notas, ''))))
  INTO v_count, v_products FROM public.items_orden i
  JOIN jsonb_array_elements(v_normalized) entry ON i.id = (entry->>'id')::uuid
  WHERE i.orden_id = p_orden_id;
  IF v_count <> jsonb_array_length(v_normalized) OR v_products <> 1 THEN
    RAISE EXCEPTION 'Las unidades deben pertenecer al mismo producto y pedido.';
  END IF;

  FOR v_request IN SELECT value FROM jsonb_array_elements(v_normalized) LOOP
    v_child_id := md5(p_solicitud_id::text || ':' || (v_request->>'id'))::uuid;
    v_result := public.cancelar_item_orden(p_orden_id, (v_request->>'id')::uuid,
      (v_request->>'cantidad')::integer, p_usuario_id, v_child_id, p_observaciones, p_reemplazo_id);
    UPDATE public.modificaciones_comanda SET items_afectados = jsonb_set(
      jsonb_set(items_afectados, '{0,groupRequestId}', to_jsonb(p_solicitud_id::text)),
      '{0,groupItems}', v_normalized) WHERE id = v_child_id;
    v_canceled := v_canceled || jsonb_build_array(v_result->'canceledItem');
    IF v_result->'replacementItem' <> 'null'::jsonb THEN
      v_replacements := v_replacements || jsonb_build_array(v_result->'replacementItem');
    END IF;
  END LOOP;
  RETURN jsonb_build_object('canceledItems', v_canceled, 'replacementItems', v_replacements, 'items', v_result->'items');
END;
$$;
REVOKE ALL ON FUNCTION public.cancelar_items_orden(uuid, jsonb, uuid, uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancelar_items_orden(uuid, jsonb, uuid, uuid, text, uuid) TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
