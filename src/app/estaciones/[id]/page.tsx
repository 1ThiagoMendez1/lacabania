
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
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Estacion, EstadoComanda } from "@/lib/types";
import { useState, useEffect } from "react";

// Componente para manejar el tiempo transcurrido y mostrar alertas visuales
function TimeElapsed({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    const calculate = () => {
      const start = new Date(createdAt).getTime();
      const now = new Date().getTime();
      setElapsed(Math.floor((now - start) / 1000 / 60)); // en minutos
    };
    
    calculate();
    const interval = setInterval(calculate, 30000); // Actualizar cada 30 seg
    return () => clearInterval(interval);
  }, [createdAt]);

  const isCritical = elapsed >= 60;
  const isOverdue = elapsed >= 30 && elapsed < 60;
  const isWarning = elapsed >= 15 && elapsed < 30;
  const isGood = elapsed < 15;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className={cn(
        "flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold transition-all border",
        isCritical ? "bg-black text-red-500 border-red-500 animate-bounce shadow-[0_0_10px_rgba(239,68,68,0.5)]" : 
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
          <span>¡VALIDAR CON MESERO!</span>
        </div>
      )}
    </div>
  );
}

export default function StationPage() {
  const { id } = useParams();
  const stationId = (id as string).toUpperCase() as Estacion;
  const { ordenes, usuarios } = usePOSStore();

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
    <main className="p-8 max-w-[1600px] mx-auto">
      <header className="flex justify-between items-center mb-8 bg-card p-8 rounded-[2.5rem] border border-border/50 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 wood-texture opacity-20 pointer-events-none" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-4 bg-primary/10 rounded-3xl border border-primary/20 shadow-inner group-hover:scale-110 transition-transform">
            {getStationIcon()}
          </div>
          <div>
            <h2 className="text-4xl font-headline tracking-tighter">Estación <span className="text-secondary">{stationId}</span></h2>
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
              <Flame className="w-5 h-5 text-secondary animate-pulse" />
              <p className="text-4xl font-black text-secondary">{ordersWithItems.reduce((acc, o) => acc + o.items.filter(i => i.estado === 'EN PREPARACION').length, 0)}</p>
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
          {ordersWithItems.map((order) => (
            <Card key={order.id} className="bg-card border-none paper-texture overflow-hidden flex flex-col shadow-2xl rounded-[2rem] shadow-primary/5">
              <CardHeader className="bg-accent/30 border-b border-border/50 p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="bg-primary/90 text-white px-4 py-1 rounded-xl shadow-lg transform -rotate-2">
                    <span className="text-3xl font-black font-headline">MESA {order.mesaId}</span>
                  </div>
                  <TimeElapsed createdAt={order.createdAt} />
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-secondary" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{order.meseroNombre}</span>
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
                    <div className="flex justify-between items-start mb-2">
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
                      
                      <div className="flex flex-col items-end">
                        {item.estado === 'EN PREPARACION' && (
                          <div className="p-2 bg-secondary/20 rounded-full animate-pulse">
                            <Flame className="w-4 h-4 text-secondary" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex justify-end items-center">
                      <Badge 
                        variant={item.estado === 'PENDIENTE' ? 'outline' : 'secondary'} 
                        className={cn(
                          "text-[9px] uppercase font-bold",
                          item.estado === 'EN PREPARACION' && "bg-secondary text-secondary-foreground border-none"
                        )}
                      >
                        {item.estado === 'PENDIENTE' ? 'POR INICIAR' : 'EN PREPARACIÓN'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
              
              <div className="p-4 bg-accent/20 border-t border-border/50 flex justify-center">
                <span className="text-[9px] font-mono text-muted-foreground/60">Monitoreo de Comanda • La Cabaña POS</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
