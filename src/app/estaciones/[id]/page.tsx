
"use client"

import { usePOSStore } from "@/lib/store";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  BellRing,
  Play,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Estacion } from "@/lib/types";
import { useState, useEffect } from "react";

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
    const interval = setInterval(calculate, 30000);
    return () => clearInterval(interval);
  }, [createdAt, onCriticalChange]);

  const isCritical = elapsed >= 60;
  const isOverdue = elapsed >= 30 && elapsed < 60;
  const isWarning = elapsed >= 15 && elapsed < 30;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className={cn(
        "flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[10px] md:text-xs font-bold transition-all border",
        isCritical ? "bg-black text-red-500 border-red-500 animate-bounce" : 
        isOverdue ? "bg-destructive text-destructive-foreground border-transparent animate-pulse" : 
        isWarning ? "bg-yellow-500 text-black border-transparent" : 
        "bg-green-500/20 text-green-500 border-green-500/30"
      )}>
        <Timer className={cn("w-3 h-3 md:w-3.5 md:h-3.5", isCritical && "animate-spin")} />
        <span>{elapsed} MIN</span>
      </div>
    </div>
  );
}

export default function StationPage() {
  const { id } = useParams();
  const stationId = (id as string).toUpperCase() as Estacion;
  const { ordenes, usuarios, updateItemEstado } = usePOSStore();
  const [hasCriticalOrders, setHasCriticalOrders] = useState(false);

  const ordersWithItems = ordenes
    .filter(o => o.estado === 'ABIERTA')
    .map(o => ({
      ...o,
      meseroNombre: usuarios.find(u => u.id === o.meseroId)?.nombre || 'Sistema',
      items: o.items.filter(item => 
        item.estacion === stationId && 
        (item.estado === 'PENDIENTE' || item.estado === 'EN PREPARACION')
      )
    }))
    .filter(o => o.items.length > 0);

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
      case 'ASADO': return <Flame className="w-6 h-6 md:w-8 md:h-8 text-primary" />;
      case 'PARRILLA': return <Utensils className="w-6 h-6 md:w-8 md:h-8 text-orange-400" />;
      case 'COCINA': return <ChefHat className="w-6 h-6 md:w-8 md:h-8 text-secondary" />;
      case 'BAR': return <Beer className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />;
      default: return <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />;
    }
  };

  return (
    <main className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-full">
      {hasCriticalOrders && (
        <div className="mb-6 animate-in slide-in-from-top-4 duration-500">
          <div className="bg-red-600 text-white p-3 md:p-4 rounded-2xl flex items-center justify-between shadow-xl border-2 border-red-400 animate-pulse">
            <div className="flex items-center gap-3 md:gap-4">
              <BellRing className="w-6 h-6 animate-bounce" />
              <div>
                <h4 className="text-sm md:text-lg font-black uppercase tracking-tighter">Retraso Crítico</h4>
                <p className="text-[10px] md:text-sm font-medium opacity-90">Pedidos con espera excesiva.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className={cn(
        "flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-card p-4 md:p-8 rounded-[2rem] border border-border/50 shadow-2xl relative overflow-hidden transition-all duration-500 gap-6",
        hasCriticalOrders ? "border-red-500/50" : ""
      )}>
        <div className="absolute inset-0 wood-texture opacity-20 pointer-events-none" />
        <div className="flex items-center gap-4 md:gap-6 relative z-10">
          <div className={cn(
            "p-3 md:p-4 rounded-2xl border transition-all duration-500",
            hasCriticalOrders ? "bg-red-500/20" : "bg-primary/10 border-primary/20"
          )}>
            {getStationIcon()}
          </div>
          <div>
            <h2 className="text-2xl md:text-4xl font-headline tracking-tighter">
              Estación <span className={cn(hasCriticalOrders ? "text-red-500" : "text-secondary")}>{stationId}</span>
            </h2>
            <p className="text-[10px] md:text-sm text-muted-foreground flex items-center gap-2 mt-0.5 md:mt-1">
              <Clock className="w-3 h-3 md:w-4 md:h-4" /> Monitor Agregado
            </p>
          </div>
        </div>
        
        <div className="flex gap-6 md:gap-10 relative z-10 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
          <div className="flex-1 md:flex-none text-left md:text-right">
            <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-0.5 md:mb-1">Items Pendientes</p>
            <p className="text-2xl md:text-4xl font-black text-primary">{ordersWithItems.reduce((acc, o) => acc + o.items.length, 0)}</p>
          </div>
        </div>
      </header>

      {ordersWithItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 md:py-32 opacity-20">
          <CheckCircle2 className="w-16 h-16 md:w-24 md:h-24 mb-4" />
          <p className="text-xl md:text-2xl font-headline italic tracking-widest">ESTACIÓN DESPEJADA 🤠</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
          {ordersWithItems.map((order) => {
            const isOrderCritical = (new Date().getTime() - new Date(order.createdAt).getTime()) / 1000 / 60 >= 60;
            return (
              <Card 
                key={order.id} 
                className={cn(
                  "bg-card border-none paper-texture overflow-hidden flex flex-col shadow-2xl rounded-[1.5rem] md:rounded-[2rem] transition-all duration-500",
                  isOrderCritical ? "ring-2 md:ring-4 ring-red-600 animate-pulse" : ""
                )}
              >
                <CardHeader className={cn(
                  "border-b p-4 md:p-6 space-y-3 md:space-y-4",
                  isOrderCritical ? "bg-red-600/20 border-red-600/30" : "bg-accent/30 border-border/50"
                )}>
                  <div className="flex justify-between items-start">
                    <div className={cn(
                      "px-3 py-1 rounded-xl shadow-lg",
                      isOrderCritical ? "bg-red-600 text-white" : "bg-primary text-white"
                    )}>
                      <span className="text-xl md:text-3xl font-black font-headline">MESA {order.mesaId}</span>
                    </div>
                    <TimeElapsed createdAt={order.createdAt} />
                  </div>
                </CardHeader>
                
                <CardContent className="p-3 md:p-4 space-y-2 md:space-y-3 flex-1">
                  {order.items.map((item) => (
                    <div 
                      key={item.id} 
                      className={cn(
                        "group relative flex flex-col p-3 md:p-4 rounded-xl border-2 transition-all",
                        item.estado === 'PENDIENTE' 
                          ? "bg-accent/20 border-border/50 border-dashed" 
                          : "bg-secondary/10 border-secondary/40"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2 md:gap-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center text-sm md:text-xl font-black shadow-lg">
                            {item.cantidad}
                          </div>
                          <div>
                            <span className="text-sm md:text-lg font-black leading-tight block">{item.nombre}</span>
                            {item.notas && (
                              <p className="text-[8px] md:text-[10px] text-primary italic mt-1 font-medium bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                                "{item.notas}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button 
                        size="sm" 
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-black h-12 rounded-xl mt-2 shadow-lg"
                        onClick={() => updateItemEstado(order.id, item.id, 'ENTREGADO')}
                      >
                        ENTREGADO 🤠
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
