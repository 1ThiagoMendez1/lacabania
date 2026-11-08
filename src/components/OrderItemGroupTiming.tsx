import type { OrderItemGroup } from '@/lib/orderItems';
import type { Usuario } from '@/lib/types';
import { formatBogotaDateTime } from '@/lib/dateUtils';
import { OrderItemTiming } from './OrderItemTiming';

export function OrderItemGroupTiming({ group, users = [] }: { group: OrderItemGroup; users?: Usuario[] }) {
  if (group.items.length === 1) return <OrderItemTiming item={group.items[0]} canceledByName={users.find(user => user.id === group.canceledBy)?.nombre} />;
  const latest = group.items.reduce((value, item) => item.createdAt > value ? item.createdAt : value, group.createdAt);
  return <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground font-normal space-y-1">
    <p>Pedido: <time dateTime={group.createdAt}>{formatBogotaDateTime(group.createdAt)}</time></p>
    {latest !== group.createdAt && <p>Última adición: <time dateTime={latest}>{formatBogotaDateTime(latest)}</time></p>}
    <details onClick={event => event.stopPropagation()}>
      <summary className="cursor-pointer text-primary py-1">{group.estado === 'CANCELADO' ? 'Ver detalle de cancelaciones' : 'Ver horas y preparación'}</summary>
      <div className="space-y-2 border-l border-border pl-2 mt-1">
        {group.items.map(item => <div key={item.id}>
          <p className="font-medium">{item.cantidad} unidad(es) · {item.estado.toLowerCase()}</p>
          <OrderItemTiming item={item} canceledByName={users.find(user => user.id === item.canceledBy)?.nombre} />
        </div>)}
      </div>
    </details>
  </div>;
}
