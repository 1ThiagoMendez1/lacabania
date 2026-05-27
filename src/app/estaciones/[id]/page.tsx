
"use client"

import { usePOSStore } from "@/lib/store";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Flame, Utensils, Beer, ChefHat, AlertCircle, User, Timer, AlertTriangle } from "lucide-react";
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

  // Lógica de semáforo para tiempos de entrega
  const isCritical = elapsed >= 60; // Más de 1 hora
  const isOverdue = elapsed >= 30 && elapsed < 60; // Retraso significativo
  const isWarning = elapsed >= 15 && elapsed < 30; // Tiempo de atención
  const isGood = elapsed < 15; // Buen tiempo

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
      {isGood && (
        <span className="text-[9px] text-green-500 font-bold uppercase tracking-tighter">✓ Buen Tiempo</span>
      )}
    </div>
  );
}

export default function StationPage() {
  const { id } = useParams();
  const stationId = (id as string).toUpperCase() as Estacion;
  const { ordenes, usuarios, updateItemEstado } = usePOSStore();

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
      case 'ASADO': return <Flame className="w-6 h-6 text-primary" />;
      case 'PARRILLA': return <Utensils className="w-6 h-6 text-orange-400" />;
      case 'COCINA': return <ChefHat className="w-6 h-6 text-secondary" />;
      case 'BAR': return <Beer className="w-6 h-6 text-blue-400" />;
      default: return <AlertCircle className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const handleAction = (orderId: string, itemId: string, currentEstado: EstadoComanda) => {
    let nextEstado: EstadoComanda = 'EN PREPARACION';
    if (currentEstado === 'EN PREPARACION') nextEstado = 'LISTO';
    updateItemEstado(orderId, itemId, nextEstado);
  };

  return (
    <main className="p-8">
      <header className="flex justify-between items-center mb-8 bg-card p-6 rounded-2xl border wood-texture">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent/50 rounded-xl">{getStationIcon()}</div>
          <h2 className="text-3xl font-headline">Estación {stationId}</h2>
        </div>
        <div className="flex gap-8">
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase">Pendientes</p>
            <p className="text-2xl font-bold text-primary">{ordersWithItems.reduce((acc, o) => acc + o.items.filter(i => i.estado === 'PENDIENTE').length, 0)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase">En Proceso</p>
            <p className="text-2xl font-bold text-secondary">{ordersWithItems.reduce((acc, o) => acc + o.items.filter(i => i.estado === 'EN PREPARACION').length, 0)}</p>
          </div>
        </div>
      </header>

      {ordersWithItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-30">
          <p className="text-xl font-headline italic">Sin comandas para {stationId.toLowerCase()}...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ordersWithItems.map((order) => (
            <Card key={order.id} className="bg-card border-t-4 border-t-primary paper-texture overflow-hidden flex flex-col">
              <CardHeader className="bg-accent/20 border-b py-4 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-2xl font-black font-headline">MESA {order.mesaId}</span>
                  <TimeElapsed createdAt={order.createdAt} />
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="w-3.5 h-3.5 text-secondary" />
                    <span className="font-bold uppercase tracking-tighter">{order.meseroNombre}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pedido a las: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-5 space-y-4 flex-1">
                {order.items.map((item) => (
                  <div key={item.id} className="pb-4 border-b border-border/30 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-lg font-bold block">{item.cantidad}x {item.nombre}</span>
                        {item.notas && <p className="text-xs text-primary italic mt-1">"{item.notas}"</p>}
                      </div>
                      <Badge variant={item.estado === 'PENDIENTE' ? 'outline' : 'secondary'} className="text-[10px] uppercase font-mono">
                        {item.estado === 'PENDIENTE' ? 'ESPERA' : 'FUEGO'}
                      </Badge>
                    </div>
                    
                    <Button 
                      onClick={() => handleAction(order.id, item.id, item.estado)} 
                      className={cn(
                        "w-full h-11 font-black text-sm transition-all",
                        item.estado === 'PENDIENTE' ? "bg-primary hover:bg-primary/80" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                    >
                      {item.estado === 'PENDIENTE' ? 'MARCAR EN FUEGO' : '¡LISTO PARA MESERO! ✓'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
