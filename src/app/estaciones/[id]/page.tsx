
"use client"

import { usePOSStore } from "@/lib/store";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Flame, Utensils, Beer, ChefHat, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Estacion } from "@/lib/types";

export default function StationPage() {
  const { id } = useParams();
  const stationId = (id as string).toUpperCase() as Estacion;
  const { ordenes, updateItemEstado } = usePOSStore();

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ordersWithItems.map((order) => (
            <Card key={order.id} className="bg-card border-t-4 border-t-primary paper-texture overflow-hidden">
              <CardHeader className="bg-accent/20 border-b py-4">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-black font-headline">MESA {order.mesaId}</span>
                  <div className="flex items-center gap-1 text-xs text-secondary font-bold">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="pb-4 border-b border-border/30 last:border-0 last:pb-0">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold">{item.cantidad}x {item.nombre}</span>
                      <Badge variant="outline" className="text-[9px]">{item.estado}</Badge>
                    </div>
                    <Button onClick={() => handleAction(order.id, item.id, item.estado)} className="w-full h-9 font-bold text-xs" variant={item.estado === 'PENDIENTE' ? 'outline' : 'secondary'}>
                      {item.estado === 'PENDIENTE' ? 'EMPEZAR' : item.estado === 'EN PREPARACION' ? 'LISTO ✓' : 'ENTREGAR'}
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
