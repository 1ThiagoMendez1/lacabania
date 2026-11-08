"use client"

import { CancelOrderItemDialog } from "@/components/CancelOrderItemDialog";
import { usePOSStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  ChefHat, 
  UtensilsCrossed, 
  PackageCheck,
  CheckCircle2,
  BellRing,
  Ban
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ItemOrden } from "@/lib/types";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function EntregasPage() {
  const { ordenes, updateItemEstado, user, mesas, usuarios } = usePOSStore();
  const { toast } = useToast();
  
  const [cancelItemDialog, setCancelItemDialog] = useState<(ItemOrden & { orderId: string; mesaId: number }) | null>(null);

  // Obtener todas las órdenes abiertas que le pertenecen al mesero actual (o todas si es admin)
  const userOrders = ordenes.filter(o => 
    o.estado === 'ABIERTA' && 
    (user?.rol !== 'MESERO' || o.meseroId === user.id)
  );

  // Obtener todos los items pendientes de esas órdenes
  const pendingItems = userOrders.flatMap(o => 
    o.items
      .filter(item => item.estado !== 'ENTREGADO' && item.estado !== 'CANCELADO')
      .map(item => ({ ...item, mesaId: o.mesaId, orderId: o.id, meseroId: o.meseroId, consecutivo: o.consecutivo }))
  ).sort((a, b) => {
    // Ordenar primero los que están LISTOS
    if (a.estado === 'LISTO' && b.estado !== 'LISTO') return -1;
    if (a.estado !== 'LISTO' && b.estado === 'LISTO') return 1;
    // Luego por tiempo de creación (más antiguos primero)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const readyItemsCount = pendingItems.filter(item => item.estado === 'LISTO').length;
  const inKitchenCount = pendingItems.filter(item => item.estado === 'EN PREPARACION' || item.estado === 'PENDIENTE').length;
  
  // Para la estadística "Atendiendo x mesas"
  const mesasActivasCount = new Set(userOrders.filter(o => o.items.some(i => i.estado !== 'ENTREGADO' && i.estado !== 'CANCELADO')).map(o => o.mesaId)).size;

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <header className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <UtensilsCrossed className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-headline text-foreground">Monitor de Entregas</h2>
          <p className="text-muted-foreground">Todos los platos pendientes de tus mesas activas 🤠</p>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {pendingItems.length > 0 && (
          <div className="flex animate-in fade-in slide-in-from-top-4 duration-500 shrink-0">
            <Card className="bg-accent/20 border-border/50 w-full sm:max-w-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2.5 bg-primary/10 rounded-2xl">
                  <ChefHat className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">En Preparación</p>
                  <p className="text-2xl font-black leading-none">{inKitchenCount} platos</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {pendingItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center space-y-4">
            <div className="p-8 bg-accent/10 rounded-full">
              <CheckCircle2 className="w-20 h-20 text-green-500" />
            </div>
            <p className="font-headline text-3xl">Todo Entregado 🤠</p>
            <p className="text-sm max-w-sm mx-auto opacity-70">
              No tienes ningún plato pendiente por entregar en este momento.
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8 pr-4">
              {Object.entries(
                pendingItems.reduce((acc, item) => {
                  if (!acc[item.mesaId]) {
                    acc[item.mesaId] = [];
                  }
                  acc[item.mesaId].push(item);
                  return acc;
                }, {} as Record<number, typeof pendingItems>)
              ).map(([mesaId, items]) => {
                const mesaIdNum = parseInt(mesaId);
                const m = mesas.find(x => x.id === mesaIdNum);
                const isLlevar = m?.zona === 'Para Llevar' || mesaIdNum >= 101;
                const label = isLlevar ? `PLL-${items[0]?.consecutivo || (mesaIdNum >= 101 ? mesaIdNum - 100 : mesaIdNum)}` : `MESA ${m?.numero || mesaIdNum}`;
                
                return (
                  <Card key={mesaId} className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden h-fit flex flex-col shadow-lg">
                    <CardHeader className="bg-accent/20 border-b border-border/20 py-4 px-5">
                      <CardTitle className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-2xl text-primary bg-primary/10 px-4 py-1.5 rounded-xl border border-primary/20 shadow-sm">{label}</span>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <span className="text-sm font-bold text-muted-foreground bg-background/50 px-3 py-1 rounded-lg border border-border/50">
                            {items.length} platos
                          </span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 bg-black/10">
                      <ul className="flex flex-col gap-3">
                        {items.map(item => {
                          const isReady = item.estado === 'LISTO';
                          return (
                            <li key={item.id} className="relative bg-background/50 rounded-[1.5rem] p-3.5 shadow-sm border border-white/5 transition-all flex flex-col gap-3">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex gap-3 items-center">
                                  <div className={cn(
                                    "w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner border shrink-0",
                                    isReady ? "bg-green-500 text-white border-green-400" : "bg-accent/40 text-muted-foreground border-border/50"
                                  )}>
                                    {item.cantidad}
                                  </div>
                                  <div>
                                    <p className="font-bold text-[15px] leading-tight text-foreground">{item.nombre}</p>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px]">
                                      <span className="font-bold bg-background/80 px-2 py-0.5 rounded border border-border/50 text-muted-foreground shadow-sm">
                                        Cmd: {item.consecutivo || 'S/N'}
                                      </span>
                                      <span className={cn(
                                        "font-black px-2 py-0.5 rounded text-white shadow-sm tracking-wider uppercase",
                                        isReady ? "bg-green-600 animate-pulse" : 
                                        item.estacion === 'ASADO' ? "bg-red-600" :
                                        item.estacion === 'PARRILLA' ? "bg-orange-600" :
                                        item.estacion === 'COCINA' ? "bg-amber-600" :
                                        item.estacion === 'BAR' ? "bg-blue-600" : "bg-primary"
                                      )}>
                                        {isReady ? "LISTO" : item.estacion}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  className="p-2.5 text-red-400 hover:text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-full transition-colors shrink-0 active:scale-95"
                                  onClick={() => {
                                    setCancelItemDialog(item);
                                  }}
                                  title="Cancelar producto"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              </div>
                              
                              {item.notas && (
                                <p className="text-[11px] text-primary font-medium italic bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/10">
                                  "{item.notas}"
                                </p>
                              )}
                              
                              <button
                                onClick={() => updateItemEstado(item.orderId, item.id, 'ENTREGADO')}
                                className={cn(
                                  "w-full h-11 sm:h-12 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2",
                                  isReady ? "bg-green-600 hover:bg-green-500 text-white shadow-green-900/50 glow-gold" : "bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20"
                                )}
                              >
                                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> Entregar
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {cancelItemDialog && ordenes.find(order => order.id === cancelItemDialog.orderId) && <CancelOrderItemDialog
        key={cancelItemDialog.id} order={ordenes.find(order => order.id === cancelItemDialog.orderId)!}
        item={cancelItemDialog} mesaNumero={mesas.find(mesa => mesa.id === cancelItemDialog.mesaId)?.numero || cancelItemDialog.mesaId}
        onClose={() => setCancelItemDialog(null)}
      />}
    </main>
  );
}
