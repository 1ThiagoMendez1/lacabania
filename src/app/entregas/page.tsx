"use client"

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ItemOrden } from "@/lib/types";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { printModificacionTicket } from "@/lib/printHelper";
import { useToast } from "@/hooks/use-toast";

export default function EntregasPage() {
  const { ordenes, updateItemEstado, user, menuItems, cancelarItemOrden, mesas, addItemsToOrden, usuarios } = usePOSStore();
  const { toast } = useToast();
  
  const [cancelItemDialog, setCancelItemDialog] = useState<(ItemOrden & { orderId: string }) | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState("");
  const [cancelReplacementId, setCancelReplacementId] = useState<string>("none");

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8 pr-4">
              {pendingItems.map((item) => {
                const isReady = item.estado === 'LISTO';
                const elapsed = Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60);

                return (
                  <Card 
                    key={item.id} 
                    className={cn(
                      "border-none paper-texture transition-all duration-300 overflow-hidden group hover:scale-[1.02]",
                      isReady ? "ring-2 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.15)] bg-green-500/5" : "bg-card/40 border border-border/50"
                    )}
                  >
                    <CardContent className="p-0">
                      <div className={cn(
                        "p-4 border-b border-border/20 flex flex-col gap-3",
                        isReady ? "bg-green-500/10" : "bg-accent/10"
                      )}>
                        <div className="flex justify-between items-start w-full">
                           <div className="flex items-center gap-2">
                             {(() => {
                               const m = mesas.find(x => x.id === item.mesaId);
                               const isLlevar = m?.zona === 'Para Llevar' || item.mesaId >= 101;
                               const label = isLlevar ? `PLL-${item.consecutivo || (item.mesaId >= 101 ? item.mesaId - 100 : item.mesaId)}` : `MESA ${m?.numero || item.mesaId}`;
                               
                               return (
                                 <h3 className="font-black text-3xl md:text-4xl tracking-tighter text-primary bg-primary/10 px-3 py-1 rounded-xl border border-primary/20 shadow-sm">
                                   {label}
                                 </h3>
                               );
                             })()}
                           </div>
                           <div className="flex flex-col items-end gap-2">
                             {isReady ? (
                               <Badge className="bg-green-600 text-white animate-pulse text-xs md:text-sm uppercase font-black px-3 py-1 border-none shadow-md">¡LISTO!</Badge>
                             ) : (
                               <Badge className={cn(
                                 "text-[10px] md:text-xs uppercase font-black px-3 py-1 border-none shadow-sm text-white",
                                 item.estacion === 'ASADO' ? "bg-red-600" :
                                 item.estacion === 'PARRILLA' ? "bg-orange-600" :
                                 item.estacion === 'COCINA' ? "bg-amber-600" :
                                 item.estacion === 'BAR' ? "bg-blue-600" : "bg-primary"
                               )}>
                                 EN {item.estacion}
                               </Badge>
                             )}
                             <span className="text-[10px] font-bold text-muted-foreground/80 flex items-center gap-1 bg-background/50 px-2 py-0.5 rounded-lg border border-border/50">
                               👨‍🍳 {usuarios.find(u => u.id === item.meseroId)?.nombre || "Desconocido"}
                             </span>
                           </div>
                        </div>

                        <div className="flex gap-3 items-center bg-background/50 p-2 rounded-xl border border-border/30">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl shadow-md border shrink-0",
                            isReady ? "bg-green-500 text-white border-green-400" : "bg-accent text-muted-foreground border-border"
                          )}>
                            {item.cantidad}
                          </div>
                          <div className="min-w-0 pr-2">
                            <p className="font-black text-lg md:text-xl leading-tight text-foreground">{item.nombre}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-3">

                        {item.notas && (
                          <div className="text-[10px] text-primary italic bg-primary/5 p-2 rounded-lg border border-primary/10">
                            "{item.notas}"
                          </div>
                        )}
                        
                        <div className="flex gap-2 pt-1">
                          <Button 
                            className={cn(
                              "flex-1 h-12 font-black rounded-xl transition-all shadow-lg active:scale-95 text-base",
                              isReady ? "bg-green-600 hover:bg-green-700 text-white glow-gold" : "bg-secondary text-secondary-foreground"
                            )}
                            onClick={() => updateItemEstado(item.orderId, item.id, 'ENTREGADO')}
                          >
                            ENTREGAR 🤠
                          </Button>
                          <Button
                            variant="outline"
                            className="h-12 w-12 shrink-0 rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/10 flex items-center justify-center"
                            onClick={() => {
                              setCancelItemDialog(item);
                              setCancelMotivo("");
                              setCancelReplacementId("none");
                            }}
                          >
                            <Ban className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      <Dialog open={!!cancelItemDialog} onOpenChange={(open) => !open && setCancelItemDialog(null)}>
        <DialogContent className="max-w-[90vw] md:max-w-md bg-card border-border paper-texture rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-headline text-red-500 flex items-center gap-2">
              <Ban className="w-5 h-5" /> Cancelar Producto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">
              Vas a cancelar <strong>{cancelItemDialog?.cantidad}x {cancelItemDialog?.nombre}</strong>.
            </p>
            <div className="space-y-2">
              <Label>Motivo de cancelación</Label>
              <Input 
                value={cancelMotivo}
                onChange={(e) => setCancelMotivo(e.target.value)}
                placeholder="Ej: Cliente cambió de opinión"
                className="bg-background"
              />
            </div>
            
            <div className="space-y-2 bg-primary/5 p-4 rounded-xl border border-primary/20">
              <Label className="text-primary font-bold">¿Cambiar por otro producto?</Label>
              <p className="text-xs text-muted-foreground mb-2">Si el cliente solicitó un cambio, selecciona el nuevo producto aquí para enviarlo a cocina automáticamente.</p>
              <SearchableSelect 
                value={cancelReplacementId} 
                onValueChange={setCancelReplacementId}
                placeholder="Seleccionar producto..."
                searchPlaceholder="Buscar plato..."
                options={[
                  { label: "-- Ninguno (Solo cancelar) --", value: "none" },
                  ...menuItems
                    .filter(item => item.disponible && (item.stock === undefined || item.stock === null || item.stock >= (cancelItemDialog?.cantidad || 1)))
                    .map(item => ({
                      label: `${item.nombre} - $${item.precio.toLocaleString('es-CO')}${item.stock !== undefined ? ` (Stock: ${item.stock})` : ''}`,
                      value: item.id
                    }))
                ]}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelItemDialog(null)} className="rounded-xl">Volver</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 font-bold rounded-xl" 
              onClick={async () => {
                if (!cancelItemDialog) return;
                
                const changeToProductId = cancelReplacementId === "none" ? null : cancelReplacementId;
                
                if (changeToProductId) {
                  const mi = menuItems.find(m => m.id === changeToProductId);
                  if (mi && mi.stock !== undefined && mi.stock < cancelItemDialog.cantidad) {
                    toast({ 
                      variant: "destructive", 
                      title: "Stock Insuficiente", 
                      description: `Solo quedan ${mi.stock} disponibles de ${mi.nombre}. Necesitas ${cancelItemDialog.cantidad} para el cambio.` 
                    });
                    return;
                  }
                }
                
                const userToLogId = user?.id || '';

                const getOperationalTimestamp = () => {
                  const now = new Date();
                  const timePart = now.toTimeString().split(' ')[0];
                  const ms = String(now.getMilliseconds()).padStart(3, '0');
                  const offsetMinutes = now.getTimezoneOffset();
                  const absOffset = Math.abs(offsetMinutes);
                  const sign = offsetMinutes > 0 ? '-' : '+';
                  const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, '0');
                  const offsetMins = String(absOffset % 60).padStart(2, '0');
                  const timezoneOffsetStr = `${sign}${offsetHours}:${offsetMins}`;
                  
                  const activeDate = usePOSStore.getState().fechaOperativa || new Date(now.getTime() - (offsetMinutes * 60000)).toISOString().split('T')[0];
                  return `${activeDate}T${timePart}.${ms}${timezoneOffsetStr}`;
                };

                let replacementItem: ItemOrden | undefined = undefined;
                if (cancelReplacementId !== "none") {
                  const mi = menuItems.find(m => m.id === cancelReplacementId);
                  if (mi) {
                    replacementItem = {
                      id: uuidv4(),
                      menuItemId: mi.id,
                      nombre: mi.nombre,
                      cantidad: cancelItemDialog.cantidad,
                      precioUnitario: mi.precio,
                      estacion: mi.estacion,
                      estado: 'EN PREPARACION',
                      createdAt: getOperationalTimestamp()
                    };
                    
                    addItemsToOrden(cancelItemDialog.orderId, [replacementItem]);
                  }
                }

                await cancelarItemOrden(
                  cancelItemDialog.orderId, 
                  cancelItemDialog.id, 
                  cancelMotivo || "Cancelado desde Entregas",
                  userToLogId
                );

                // Print modification ticket
                try {
                  const mesaAsignada = mesas.find(m => m.id === cancelItemDialog.mesaId);
                  const mesaNumero = mesaAsignada ? mesaAsignada.numero : cancelItemDialog.mesaId;
                  
                  const notasTicket = cancelMotivo 
                    ? `${cancelMotivo}${replacementItem ? ' (CAMBIO)' : ''}`
                    : (replacementItem ? 'Cambio de producto' : 'Cancelación');
                    
                  await printModificacionTicket(
                    mesaNumero, 
                    user?.nombre || 'Mesero', 
                    [cancelItemDialog], 
                    replacementItem ? [replacementItem] : [], 
                    notasTicket
                  );
                  
                  toast({
                    title: replacementItem ? "Producto cambiado" : "Producto cancelado",
                    description: "Se imprimió la modificación en la estación correspondiente.",
                  });
                } catch (err: any) {
                  toast({
                    variant: "destructive",
                    title: "Error de Impresión",
                    description: err.message || "No se pudo imprimir el ticket de modificación.",
                  });
                }
                
                setCancelItemDialog(null);
              }}
            >
              CONFIRMAR CANCELACIÓN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
