import type { ItemOrden } from './types';

export function mapOrderItem(row: any): ItemOrden {
  return {
    id: row.id, menuItemId: row.menu_item_id || row.producto_id,
    nombre: row.nombre, cantidad: row.cantidad,
    precioUnitario: Number(row.precio_unitario), notas: row.notas,
    estacion: row.estacion, estado: row.estado, createdAt: row.created_at,
    canceledAt: row.canceled_at || undefined,
    canceledBy: row.canceled_by || undefined,
    cancellationReason: row.cancellation_reason || undefined,
  };
}
