"use client";

import { useRef, useState } from 'react';
import { Ban, Minus, Plus } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { usePOSStore } from '@/lib/store';
import type { ItemOrden, Orden } from '@/lib/types';
import { uuidv4 } from '@/lib/utils';
import { printModificacionTicket } from '@/lib/printHelper';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { OrderItemGroupTiming } from './OrderItemGroupTiming';
import { allocateCancellation, groupOrderItems, type OrderItemGroup } from '@/lib/orderItems';

/** Mounted afresh for each item so quantity, reason and request ID never leak between orders. */
export function CancelOrderItemDialog({ order, item, mesaNumero, onClose }: {
  order: Orden; item: ItemOrden | OrderItemGroup; mesaNumero: number; onClose: () => void;
}) {
  const { user, menuItems, cancelarItemsOrden } = usePOSStore(useShallow(state => ({
    user: state.user, menuItems: state.menuItems, cancelarItemsOrden: state.cancelarItemsOrden,
  })));
  const group = 'items' in item ? item : groupOrderItems([item])[0];
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [replacementId, setReplacementId] = useState('none');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const requestId = useRef(uuidv4());
  const { toast } = useToast();
  const valid = Number.isInteger(quantity) && quantity >= 1 && quantity <= item.cantidad;

  async function confirm() {
    if (submitting.current || !valid || !user) return;
    submitting.current = true;
    setPending(true);
    setError('');
    try {
      const result = await cancelarItemsOrden(order.id, allocateCancellation(group.items, quantity), reason, user.id,
        requestId.current, replacementId === 'none' ? undefined : replacementId);
      onClose();
      const canceledQuantity = result.canceledItems.reduce((sum, canceled) => sum + canceled.cantidad, 0);
      toast({ title: 'Cancelación guardada', description: `${canceledQuantity} unidad(es) de ${item.nombre}. Quedan ${item.cantidad - canceledQuantity} del producto original.` });
      try {
        await printModificacionTicket(mesaNumero, user.nombre, result.canceledItems,
          result.replacementItems, reason || 'Cancelación por unidades');
      } catch (printError) {
        toast({ variant: 'destructive', title: 'Cancelación guardada; impresión pendiente',
          description: printError instanceof Error ? printError.message : 'No se pudo imprimir la modificación.' });
      }
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'No se pudo cancelar el producto.');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return <Dialog open onOpenChange={open => { if (!open && !submitting.current) onClose(); }}>
    <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md rounded-3xl max-h-[90dvh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-red-500"><Ban className="h-5 w-5" /> Cancelar por unidades</DialogTitle>
        <DialogDescription>Elige cuántas unidades retirar de este pedido. Las demás seguirán en la comanda.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="rounded-xl border border-border p-3">
          <p className="font-bold">{item.cantidad} × {item.nombre}</p>
          <OrderItemGroupTiming group={group} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cancel-quantity">Unidades a cancelar</Label>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="icon" aria-label="Cancelar una unidad menos" disabled={pending || quantity <= 1} onClick={() => setQuantity(value => value - 1)}><Minus className="h-4 w-4" /></Button>
            <Input id="cancel-quantity" type="number" inputMode="numeric" min={1} max={item.cantidad} step={1}
              value={Number.isNaN(quantity) ? '' : quantity} disabled={pending} className="text-center w-24"
              onChange={event => setQuantity(event.target.value === '' ? NaN : Number(event.target.value))} />
            <Button type="button" variant="outline" size="icon" aria-label="Cancelar una unidad más" disabled={pending || quantity >= item.cantidad} onClick={() => setQuantity(value => value + 1)}><Plus className="h-4 w-4" /></Button>
          </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">{valid
            ? `Se cancelan ${quantity}. Quedan ${item.cantidad - quantity} en el pedido original.`
            : `Ingresa un número entero entre 1 y ${item.cantidad}.`}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Motivo (opcional)</Label>
          <Input id="cancel-reason" value={reason} maxLength={1000} disabled={pending} onChange={event => setReason(event.target.value)} placeholder="Ej.: el cliente solo quiere una unidad" />
        </div>
        <div className="space-y-2">
          <Label>Cambiar esas unidades por otro producto (opcional)</Label>
          <div className={pending ? 'pointer-events-none opacity-60' : ''}>
            <SearchableSelect value={replacementId} onValueChange={setReplacementId} placeholder="Solo cancelar" searchPlaceholder="Buscar producto..."
              options={[{ label: 'Solo cancelar', value: 'none' }, ...menuItems.filter(menu => menu.disponible && menu.id !== item.menuItemId).map(menu => ({ value: menu.id, label: `${menu.nombre} — $${menu.precio.toLocaleString('es-CO')}` }))]} />
          </div>
        </div>
        {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-500">{error}</p>}
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" disabled={pending} onClick={onClose}>Volver</Button>
        <Button variant="destructive" disabled={pending || !valid} onClick={confirm}>{pending ? 'Guardando…' : `Confirmar cancelación${valid ? ` de ${quantity}` : ''}`}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
