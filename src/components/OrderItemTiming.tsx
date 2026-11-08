import { formatBogotaDateTime } from '@/lib/dateUtils';
import type { ItemOrden } from '@/lib/types';

export function OrderItemTiming({ item, canceledByName }: { item: ItemOrden; canceledByName?: string }) {
  return <div className="mt-1 space-y-1 text-[11px] leading-relaxed text-muted-foreground font-normal">
    <p>Pedido: <time dateTime={item.createdAt}>{formatBogotaDateTime(item.createdAt)}</time></p>
    {item.estado === 'CANCELADO' && <>
      <p className="text-red-500">Cancelado: {item.canceledAt
        ? <time dateTime={item.canceledAt}>{formatBogotaDateTime(item.canceledAt)}</time>
        : 'hora no registrada'}</p>
      {canceledByName && <p>Por: {canceledByName}</p>}
      {item.cancellationReason && <p className="break-words">Motivo: {item.cancellationReason}</p>}
    </>}
  </div>;
}
