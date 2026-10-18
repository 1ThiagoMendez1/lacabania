-- La Cabaña POS: auditoría de cancelaciones, sin borrar ni modificar datos.
-- Ejecutar sobre una conexión PostgreSQL de solo lectura.
-- Las órdenes CERRADA con artículos CANCELADO NO son necesariamente
-- órdenes anuladas: pueden contener ventas cobradas válidas.
BEGIN READ ONLY;

SELECT estado, COUNT(*) AS ordenes
FROM public.ordenes
GROUP BY estado ORDER BY estado;

SELECT
    COUNT(DISTINCT o.id) AS ordenes_cerradas_con_algun_item_cancelado,
    COUNT(DISTINCT o.id) FILTER (
        WHERE NOT EXISTS (
            SELECT 1 FROM public.items_orden vigente
            WHERE vigente.orden_id = o.id
              AND vigente.estado IS DISTINCT FROM 'CANCELADO'
        )
    ) AS ordenes_cerradas_solo_con_items_cancelados,
    COUNT(DISTINCT o.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM public.items_orden vigente
            WHERE vigente.orden_id = o.id
              AND vigente.estado IS DISTINCT FROM 'CANCELADO'
        )
    ) AS ordenes_cerradas_con_items_vigentes,
    COALESCE(SUM(i.precio_unitario * i.cantidad) FILTER (
        WHERE i.estado = 'CANCELADO'
    ), 0) AS valor_articulos_cancelados_que_no_debe_sumarse
FROM public.ordenes o
JOIN public.items_orden i ON i.orden_id = o.id
WHERE o.estado = 'CERRADA'
  AND EXISTS (
      SELECT 1 FROM public.items_orden c
      WHERE c.orden_id = o.id AND c.estado = 'CANCELADO'
  );

SELECT
    COUNT(*) AS anuladas_total,
    COUNT(*) FILTER (WHERE metodo_pago IS NOT NULL) AS anuladas_con_metodo_pago
FROM public.ordenes
WHERE estado = 'ANULADA';

SELECT COUNT(*) AS ordenes_abiertas_en_mesas_libres
FROM public.ordenes o
JOIN public.mesas m ON m.id = o.mesa_id
WHERE o.estado = 'ABIERTA' AND m.estado = 'LIBRE';

SELECT COUNT(*) AS articulos_huerfanos
FROM public.items_orden i
LEFT JOIN public.ordenes o ON o.id = i.orden_id
WHERE o.id IS NULL;

COMMIT;
