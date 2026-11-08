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

export interface OrderItemGroup extends ItemOrden {
  groupKey: string;
  items: ItemOrden[];
}

/** Aggregate the visible line while retaining each addition for timing and audit. */
export function groupOrderItems(items: ItemOrden[]): OrderItemGroup[] {
  const groups = new Map<string, OrderItemGroup>();
  for (const item of items) {
    const key = JSON.stringify([item.menuItemId, item.nombre, item.precioUnitario,
      item.estacion, (item.notas || '').trim(), item.estado === 'CANCELADO']);
    const existing = groups.get(key);
    if (existing) {
      existing.cantidad += item.cantidad;
      existing.items.push(item);
      if (item.createdAt < existing.createdAt) existing.createdAt = item.createdAt;
    } else groups.set(key, { ...item, groupKey: key, items: [item] });
  }
  return [...groups.values()];
}

const statusLabels: Record<ItemOrden['estado'], string> = {
  PENDIENTE: 'pendiente(s)', 'EN PREPARACION': 'en preparación',
  LISTO: 'listo(s)', ENTREGADO: 'entregado(s)', CANCELADO: 'cancelado(s)',
};

export function groupStatusLabel(group: OrderItemGroup): string {
  const counts = new Map<ItemOrden['estado'], number>();
  for (const item of group.items) counts.set(item.estado, (counts.get(item.estado) || 0) + item.cantidad);
  return [...counts].map(([status, count]) => `${count} ${statusLabels[status]}`).join(' · ');
}

/** Pending/new additions are canceled first; served items are last. */
export function allocateCancellation(items: ItemOrden[], quantity: number): { id: string; cantidad: number }[] {
  const priority: Record<ItemOrden['estado'], number> = { PENDIENTE: 0, 'EN PREPARACION': 1, LISTO: 2, ENTREGADO: 3, CANCELADO: 4 };
  const available = items.filter(item => item.estado !== 'CANCELADO');
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > available.reduce((sum, item) => sum + item.cantidad, 0)) {
    throw new Error('Selecciona una cantidad válida del producto.');
  }
  const sorted = [...available].sort((a, b) => priority[a.estado] - priority[b.estado] ||
    b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
  let remaining = quantity;
  const result: { id: string; cantidad: number }[] = [];
  for (const item of sorted) {
    const count = Math.min(remaining, item.cantidad);
    if (count) result.push({ id: item.id, cantidad: count });
    remaining -= count;
    if (!remaining) break;
  }
  return result;
}
