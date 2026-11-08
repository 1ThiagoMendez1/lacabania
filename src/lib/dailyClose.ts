import type { Gasto, Orden } from './types';
import { getBogotaDateString } from './dateUtils';

export function isValidBusinessDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00-05:00`);
  return !Number.isNaN(date.getTime()) && getBogotaDateString(date) === value;
}

export function orderBusinessDate(order: Orden): string {
  const timestamp = order.estado === 'ABIERTA' ? order.createdAt : order.updatedAt || order.createdAt;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? '' : getBogotaDateString(date);
}

export function hasBlockingOpenOrder(orders: Orden[], date: string, today: string): boolean {
  return orders.some(order => order.estado === 'ABIERTA' &&
    (date === today || orderBusinessDate(order) <= date));
}

/** Only dates with actual activity are pending; days off never create reminders. */
export function getPendingCloseDays(orders: Orden[], expenses: Gasto[], closedDates: string[], today: string) {
  const closed = new Set(closedDates);
  const days = new Map<string, { fecha: string; pedidos: number; abiertos: number; total: number; gastos: number }>();
  const dayFor = (date: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today || closed.has(date)) return;
    if (!days.has(date)) days.set(date, { fecha: date, pedidos: 0, abiertos: 0, total: 0, gastos: 0 });
    return days.get(date)!;
  };
  for (const order of orders) {
    // An order created before midnight and paid afterwards represents activity on
    // both dates. Revenue belongs only to the payment date, so it is never doubled.
    const creation = new Date(order.createdAt);
    const creationDate = Number.isNaN(creation.getTime()) ? '' : getBogotaDateString(creation);
    const createdDay = creationDate !== orderBusinessDate(order) ? dayFor(creationDate) : undefined;
    if (createdDay) createdDay.pedidos++;
    const day = dayFor(orderBusinessDate(order));
    if (!day) continue;
    day.pedidos++;
    if (order.estado === 'ABIERTA') day.abiertos++;
    if (order.estado === 'CERRADA') day.total += order.items
      .filter(item => item.estado !== 'CANCELADO')
      .reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0) + (order.propina || 0);
  }
  for (const expense of expenses) {
    const day = dayFor(expense.fecha);
    if (day) day.gastos += expense.valor;
  }
  return [...days.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
}
