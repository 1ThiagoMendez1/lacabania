"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AlertTriangle, ClipboardCheck } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { usePOSStore } from '@/lib/store';
import { getPendingCloseDays } from '@/lib/dailyClose';
import { getBogotaDateString } from '@/lib/dateUtils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function DailyCloseReminder() {
  const { user, ordenes, gastos, cierresDiarios, cierresLoaded, cierresError, refreshCierresDiarios } = usePOSStore(useShallow(state => ({
    user: state.user, ordenes: state.ordenes, gastos: state.gastos,
    cierresDiarios: state.cierresDiarios, cierresLoaded: state.cierresLoaded,
    cierresError: state.cierresError, refreshCierresDiarios: state.refreshCierresDiarios,
  })));
  const pathname = usePathname();
  const [today, setToday] = useState(getBogotaDateString);
  const [acknowledged, setAcknowledged] = useState('');
  const canClose = user?.rol === 'ADMINISTRADOR' || user?.rol === 'CAJERO';
  const pending = useMemo(() => getPendingCloseDays(ordenes, gastos, cierresDiarios, today), [ordenes, gastos, cierresDiarios, today]);
  const overdue = pending.filter(day => day.fecha < today);
  const first = overdue[0] || pending[0];
  const key = `${user?.id}:${today}:${overdue[0]?.fecha || ''}`;

  useEffect(() => {
    if (!canClose) return;
    const refresh = () => {
      setToday(getBogotaDateString());
      if (document.visibilityState !== 'hidden') void refreshCierresDiarios();
    };
    refresh();
    const interval = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    window.addEventListener('daily-close-changed', refresh);
    return () => { clearInterval(interval); window.removeEventListener('focus', refresh); window.removeEventListener('daily-close-changed', refresh); };
  }, [canClose, refreshCierresDiarios]);

  if (!canClose) return null;
  if (cierresError) return <div role="alert" className="mb-4 rounded-xl border border-amber-500/40 p-3 text-sm">
    No se pudieron comprobar los cierres pendientes. <Button variant="link" onClick={() => void refreshCierresDiarios()}>Reintentar</Button>
  </div>;
  if (!cierresLoaded || !first) return null;
  const href = `/cierre?fecha=${first.fecha}`;
  const acknowledge = () => setAcknowledged(key);
  return <>
    <aside aria-label="Recordatorio de cierre diario" className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">{overdue.length ? `${overdue.length} día(s) trabajado(s) sin cierre` : 'Recuerda cerrar la caja al terminar la jornada'}</p>
        <p className="text-xs text-muted-foreground mt-1">{overdue.length
          ? `El más antiguo es ${first.fecha}. Revisa cada fecha para mantener las cuentas al día.`
          : 'El cierre confirma las ventas y gastos de hoy. Hazlo antes de salir.'}</p>
      </div>
      <Button asChild size="sm" className="shrink-0"><Link href={href} onClick={acknowledge}><ClipboardCheck className="mr-2 h-4 w-4" /> Revisar cierres</Link></Button>
    </aside>
    <Dialog open={!!overdue.length && pathname !== '/cierre' && acknowledged !== key}
      onOpenChange={open => { if (!open) acknowledge(); }}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle>Hay días pendientes de cierre</DialogTitle>
          <DialogDescription>Tienes {overdue.length} día(s) trabajado(s) sin cerrar, desde {first.fecha}. Los cierres ayudan a verificar el dinero recibido y detectar diferencias a tiempo.</DialogDescription>
        </DialogHeader>
        <p className="text-sm">Revisa las fechas pendientes con la persona encargada de caja. Puedes seguir atendiendo mientras las regularizas.</p>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={acknowledge}>Continuar atendiendo</Button>
          <Button asChild><Link href={href} onClick={acknowledge}>Revisar cierres</Link></Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
