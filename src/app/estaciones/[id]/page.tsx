
"use client"

import { usePOSStore } from "@/lib/store";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Flame, 
  Utensils, 
  Beer, 
  ChefHat, 
  AlertCircle, 
  User, 
  Timer, 
  AlertTriangle,
  CheckCircle2,
  Hourglass,
  BellRing
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Estacion } from "@/lib/types";
import { useState, useEffect } from "react";

// Componente para manejar el tiempo transcurrido y mostrar alertas visuales
function TimeElapsed({ createdAt, onCriticalChange }: { createdAt: string, onCriticalChange?: (isCritical: boolean) => void }) {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    const calculate = () => {
      const start = new Date(createdAt).getTime();
      const now = new Date().getTime();
      const mins = Math.floor((now - start) / 1000 / 60);
      setElapsed(mins);
      if (onCriticalChange) {
        onCriticalChange(mins >= 60);
      }
    };
    
    calculate();
    const interval = setInterval(calculate, 30000); // Actualizar cada 30 seg
    return () => clearInterval(interval);
  }, [createdAt, onCriticalChange]);

  const isCritical = elapsed >= 60;
  const isOverdue = elapsed >= 30 && elapsed < 60;
  const isWarning = elapsed >= 15 && elapsed < 30;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className={cn(
        "flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold transition-all border",
        isCritical ? "bg-black text-red-500 border-red-500 animate-bounce shadow-[0_0_15px_rgba(239,68,68,0.8)]" : 
        isOverdue ? "bg-destructive text-destructive-foreground border-transparent animate-pulse" : 
        isWarning ? "bg-yellow-500 text-black border-transparent" : 
        "bg-green-500/20 text-green-500 border-green-500/30"
      )}>
        <Timer className={cn("w-3.5 h-3.5", isCritical && "animate-spin")} />
        <span>{elapsed} MIN</span>
      </div>
      
      {isCritical && (
        <div className="flex items-center gap-1 text-[10px] font-black text-red-500 uppercase animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          <span>¡RETRASO CRÍTICO!</span>
        </div>
      )}
    </div>
  );
}

export default function StationPage() {
  const { id } = useParams();
  const stationId = (id as string).toUpperCase() as Estacion;
  const { ordenes, usuarios } = usePOSStore();
  const [hasCriticalOrders, setHasCriticalOrders] = useState(false);

  const ordersWithItems = ordenes
    .filter(o => o.estado === 'ABIERTA')
    .map(o => ({
      ...o,
      meseroNombre: usuarios.find(u => u.id === o.meseroId)?.nombre || 'Sistema',
      items: o.items.filter(item => 
        item.estacion === stationId && 
        item.estado !== 'LISTO' && 
        item.estado !== 'ENTREGADO'
      )
    }))
    .filter(o => o.items.length > 0);

  // Determinar si hay alguna orden crítica para la alerta global
  useEffect(() => {
    const checkCritical = () => {
      const now = new Date().getTime();
      const critical = ordersWithItems.some(o => {
        const start = new Date(o.createdAt).getTime();
        return (now - start) / 1000 / 60 >= 60;
      });
      setHasCriticalOrders(critical);
    };
    checkCritical();
    const interval = setInterval(checkCritical, 30000);
    return () => clearInterval(interval);
  }, [ordersWithItems]);

  const getStationIcon = () => {
    switch (stationId) {
      case 'ASADO': return <Flame className="w-8 h-8 text-primary" />;
      case 'PARRILLA': return <Utensils className="w-8 h-8 text-orange-400" />;
      case 'COCINA': return <ChefHat className="w-8 h-8 text-secondary" />;
      case 'BAR': return <Beer className="w-8 h-8 text-blue-400" />;
      default: return <AlertCircle className="w-8 h-8 text-muted-foreground" />;
    }
  };

  return (
    <main className="p-8 max-w-[1600px] mx-auto min-h-full">
      {/* Notificación de Alerta Global */}
      {hasCriticalOrders && (
        <div className="mb-6 animate-in slide-in-from-top-4 duration-500">
          <div className="bg-red-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-[0_0_30px_rgba(220,38,38,0.5)] border-2 border-red-400 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-full">
                <BellRing className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h4 className="text-lg font-black uppercase tracking-tighter">Atención Requerida</h4>
                <p className="text-sm font-medium opacity-90">Hay pedidos que superan la hora de espera. Validar prioridad.</p>
              </div>
            </div>
            <div className="hidden md:block bg-white/20 px-4 py-1 rounded-full font-black text-xs">
              ESTADO: CRÍTICO
            </div>
          </div>
        </div>
      )}

      <header className={cn(
        "flex justify-between items-center mb-8 bg-card p-8 rounded-[2.5rem] border border-border/50 shadow-2xl relative overflow-hidden transition-all duration-500",
        hasCriticalOrders ? "border-red-500/50 shadow-red-500/10 ring-2 ring-red-500/20" : ""
      )}>
        <div className="absolute inset-0 wood-texture opacity-20 pointer-events-none" />
        <div className="flex items-center gap-6 relative z-10">
          <div className={cn(
            "p-4 rounded-3xl border transition-all duration-500",
            hasCriticalOrders ? "bg-red-500/20 border-red-500/30 scale-110" : "bg-primary/10 border-primary/20"
          )}>
            {getStationIcon()}
          </div>
          <div>
            <h2 className="text-4xl font-headline tracking-tighter">
              Estación <span className={cn(hasCriticalOrders ? "text-red-500" : "text-secondary")}>{stationId}</span>
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4" /> Monitor de pedidos en tiempo real
            </p>
          </div>
        </div>
        
        <div className="flex gap-10 relative z-10">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Pendientes</p>
            <div className="flex items-center gap-2 justify-end">
              <Hourglass className="w-5 h-5 text-primary" />
              <p className="text-4xl font-black text-primary">{ordersWithItems.reduce((acc, o) => acc + o.items.filter(i => i.estado === 'PENDIENTE').length, 0)}</p>
            </div>
          </div>
          <div className="w-px h-12 bg-border/50" />
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">En Proceso</p>
            <div className="flex items-center gap-2 justify-end">
              <Flame className={cn("w-5 h-5 animate-pulse", hasCriticalOrders ? "text-red-500" : "text-secondary")} />
              <p className={cn("text-4xl font-black", hasCriticalOrders ? "text-red-500" : "text-secondary")}>
                {ordersWithItems.reduce((acc, o) => acc + o.items.filter(i => i.estado === 'EN PREPARACION').length, 0)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {ordersWithItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-20">
          <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mb-6">
             <CheckCircle2 className="w-12 h-12" />
          </div>
          <p className="text-2xl font-headline italic tracking-widest">ESTACIÓN DESPEJADA</p>
          <p className="text-sm mt-2 font-mono uppercase">Todo está bajo control 🤠</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {ordersWithItems.map((order) => {
            const isOrderCritical = (new Date().getTime() - new Date(order.createdAt).getTime()) / 1000 / 60 >= 60;
            return (
              <Card 
                key={order.id} 
                className={cn(
                  "bg-card border-none paper-texture overflow-hidden flex flex-col shadow-2xl rounded-[2rem] transition-all duration-500",
                  isOrderCritical ? "ring-4 ring-red-600 animate-pulse shadow-red-600/20" : "shadow-primary/5"
                )}
              >
                <CardHeader className={cn(
                  "border-b p-6 space-y-4",
                  isOrderCritical ? "bg-red-600/20 border-red-600/30" : "bg-accent/30 border-border/50"
                )}>
                  <div className="flex justify-between items-start">
                    <div className={cn(
                      "px-4 py-1 rounded-xl shadow-lg transform -rotate-2",
                      isOrderCritical ? "bg-red-600 text-white" : "bg-primary/90 text-white"
                    )}>
                      <span className="text-3xl font-black font-headline">MESA {order.mesaId}</span>
                    </div>
                    <TimeElapsed createdAt={order.createdAt} />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center",
                        isOrderCritical ? "bg-red-500/30" : "bg-secondary/20"
                      )}>
                        <User className={cn("w-3.5 h-3.5", isOrderCritical ? "text-red-500" : "text-secondary")} />
                      </div>
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-widest",
                        isOrderCritical ? "text-red-500" : "text-muted-foreground"
                      )}>{order.meseroNombre}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-mono opacity-50">
                      ID: {order.id.split('-')[1] || order.id}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 space-y-3 flex-1 bg-background/50 backdrop-blur-sm">
                  {order.items.map((item) => (
                    <div 
                      key={item.id} 
                      className={cn(
                        "group relative flex flex-col p-4 rounded-2xl border-2 transition-all select-none",
                        item.estado === 'PENDIENTE' 
                          ? "bg-accent/20 border-border/50 border-dashed" 
                          : "bg-secondary/10 border-secondary/40 shadow-[0_0_15px_rgba(234,179,8,0.05)]"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black shrink-0",
                            item.estado === 'PENDIENTE' ? "bg-muted text-muted-foreground" : "bg-secondary text-secondary-foreground shadow-lg"
                          )}>
                            {item.cantidad}
                          </div>
                          <div>
                            <span className={cn(
                              "text-lg font-black leading-none block",
                              item.estado === 'EN PREPARACION' && "text-secondary"
                            )}>
                              {item.nombre}
                            </span>
                            {item.notas && (
                              <p className="text-[10px] text-primary italic mt-1 font-medium bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                                "{item.notas}"
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {item.estado === 'EN PREPARACION' && (
                          <div className="p-2 bg-secondary/20 rounded-full animate-pulse">
                            <Flame className="w-4 h-4 text-secondary" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
                
                <div className={cn(
                  "p-4 border-t flex justify-center",
                  isOrderCritical ? "bg-red-600/10 border-red-600/20" : "bg-accent/20 border-border/50"
                )}>
                  <span className={cn(
                    "text-[9px] font-mono",
                    isOrderCritical ? "text-red-500 font-bold" : "text-muted-foreground/60"
                  )}>
                    {isOrderCritical ? "ESTADO CRÍTICO • VALIDAR URGENTE" : "Monitoreo de Comanda • La Cabaña POS"}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
