
"use client"

import { AppSidebar } from "@/components/layout/AppSidebar";
import { usePOSStore } from "@/lib/store";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Flame, Utensils, Beer, ChefHat, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Estacion } from "@/lib/types";

export default function StationPage() {
  const { id } = useParams();
  const stationId = (id as string).toUpperCase() as Estacion;
  const { ordenes, updateItemEstado } = usePOSStore();

  // Filtrar pedidos que tengan items para esta estación y estén abiertos
  const ordersWithItems = ordenes
    .filter(o => o.estado === 'ABIERTA')
    .map(o => ({
      ...o,
      items: o.items.filter(item => item.estacion === stationId && item.estado !== 'ENTREGADO')
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

  const handleAction = (orderId: string, itemId: string, currentEstado: string) => {
    let nextEstado: any = 'EN PREPARACION';
    if (currentEstado === 'EN PREPARACION') nextEstado = 'LISTO';
    if (currentEstado === 'LISTO') nextEstado = 'ENTREGADO';
    
    updateItemEstado(orderId, itemId, nextEstado);
  };

  return (
    <div className="flex bg-background min-h-screen">
      <AppSidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8 bg-card p-6 rounded-2xl border border-border wood-texture">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/50 rounded-xl border border-border">
              {getStationIcon()}
            </div>
            <div>
              <h2 className="text-3xl font-headline text-foreground">Estación {stationId}</h2>
              <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">Panel de Control en Vivo</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase">Pendientes</p>
              <p className="text-2xl font-bold text-primary">
                {ordersWithItems.reduce((acc, o) => acc + o.items.filter(i => i.estado === 'PENDIENTE').length, 0)}
              </p>
            </div>
            <div className="w-px h-10 bg-border mx-2" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase">En Proceso</p>
              <p className="text-2xl font-bold text-secondary">
                {ordersWithItems.reduce((acc, o) => acc + o.items.filter(i => i.estado === 'EN PREPARACION').length, 0)}
              </p>
            </div>
          </div>
        </header>

        {ordersWithItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground opacity-30">
            {getStationIcon()}
            <p className="mt-4 text-xl font-headline italic">No hay comandas pendientes para {stationId.toLowerCase()}...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ordersWithItems.map((order) => (
              <Card key={order.id} className="bg-card border-border paper-texture overflow-hidden border-t-4 border-t-primary">
                <CardHeader className="bg-accent/20 border-b border-border py-4 px-5">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-2xl font-black font-headline">MESA {order.mesaId}</span>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">#{order.id.split('-')[1]}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 text-xs text-secondary font-bold">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-5 space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="group pb-4 border-b border-border/30 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex gap-2">
                            <span className="text-lg font-bold text-secondary">{item.cantidad}x</span>
                            <div className="flex flex-col">
                              <span className="text-lg font-bold leading-tight">{item.nombre}</span>
                              {item.notas && (
                                <span className="text-xs text-primary font-medium italic mt-1">→ {item.notas}</span>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className={cn(
                            "text-[9px] uppercase font-mono",
                            item.estado === 'PENDIENTE' ? "text-yellow-500 border-yellow-500/30" : 
                            item.estado === 'EN PREPARACION' ? "text-blue-500 border-blue-500/30" : 
                            "text-green-500 border-green-500/30"
                          )}>
                            {item.estado}
                          </Badge>
                        </div>
                        
                        <Button
                          onClick={() => handleAction(order.id, item.id, item.estado)}
                          className={cn(
                            "w-full h-10 font-bold text-xs rounded-lg transition-all",
                            item.estado === 'PENDIENTE' 
                              ? "bg-accent hover:bg-primary hover:text-white border border-border" 
                              : item.estado === 'EN PREPARACION'
                              ? "bg-secondary text-secondary-foreground hover:glow-gold"
                              : "bg-green-600/20 text-green-500 border border-green-500/30"
                          )}
                        >
                          {item.estado === 'PENDIENTE' ? 'EMPEZAR PREPARACIÓN' : 
                           item.estado === 'EN PREPARACION' ? 'MARCAR LISTO ✓' : 
                           'ENTREGAR A MESERO'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
