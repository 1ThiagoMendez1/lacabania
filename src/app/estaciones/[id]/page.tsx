"use client"

import { AppSidebar } from "@/components/layout/AppSidebar";
import { usePOSStore } from "@/lib/store";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Flame, Utensils, Beer, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

// Mock data for orders
const mockOrders = [
  {
    id: 'o1',
    mesa: 7,
    time: '12:45',
    items: [
      { id: 'i1', nombre: 'Costilla al Barril', cantidad: 1, nota: 'Muy bien hecha', estado: 'PENDIENTE' },
      { id: 'i2', nombre: 'Picaña Mediana', cantidad: 2, nota: 'Término 3/4', estado: 'PENDIENTE' },
    ],
    urgencia: 'ALTA'
  },
  {
    id: 'o2',
    mesa: 3,
    time: '12:50',
    items: [
      { id: 'i3', nombre: 'Punta Trasera', cantidad: 1, nota: 'Sin sal', estado: 'EN PREPARACION' },
    ],
    urgencia: 'NORMAL'
  }
];

export default function StationPage() {
  const { id } = useParams();
  const stationId = (id as string).toUpperCase();
  const [orders, setOrders] = useState(mockOrders);

  const getStationIcon = () => {
    switch (stationId) {
      case 'ASADO': return <Flame className="w-6 h-6 text-primary" />;
      case 'PARRILLA': return <Utensils className="w-6 h-6 text-orange-400" />;
      case 'COCINA': return <ChefHat className="w-6 h-6 text-secondary" />;
      case 'BAR': return <Beer className="w-6 h-6 text-blue-400" />;
      default: return null;
    }
  };

  const handleAction = (orderId: string, itemId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          items: o.items.map(i => i.id === itemId ? { ...i, estado: i.estado === 'PENDIENTE' ? 'EN PREPARACION' : 'LISTO' } : i)
        };
      }
      return o;
    }));
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
              <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">Panel de Comandas en Vivo</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase">Pendientes</p>
              <p className="text-2xl font-bold text-primary">{orders.length}</p>
            </div>
            <div className="w-px h-10 bg-border mx-2" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase">Promedio</p>
              <p className="text-2xl font-bold text-secondary">18m</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map((order) => (
            <Card key={order.id} className={cn(
              "bg-card border-border paper-texture overflow-hidden transition-all duration-300",
              order.urgencia === 'ALTA' ? "border-l-4 border-l-primary" : "border-l-4 border-l-secondary"
            )}>
              <CardHeader className="bg-accent/20 border-b border-border py-4 px-5">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black font-headline">MESA {order.mesa}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">ORDEN #{order.id.slice(1)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-xs text-secondary font-bold">
                      <Clock className="w-3 h-3" />
                      <span>{order.time}</span>
                    </div>
                    {order.urgencia === 'ALTA' && (
                      <Badge className="bg-primary text-[8px] h-4 mt-1">PRIORIDAD ★★★</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-5 space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="group">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex gap-2">
                          <span className="text-lg font-bold text-secondary">{item.cantidad}x</span>
                          <div className="flex flex-col">
                            <span className="text-lg font-bold leading-tight">{item.nombre}</span>
                            {item.nota && (
                              <span className="text-xs text-primary font-medium italic mt-1">→ {item.nota}</span>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className={cn(
                          "text-[9px] uppercase font-mono",
                          item.estado === 'PENDIENTE' ? "text-yellow-500 border-yellow-500/30" : "text-green-500 border-green-500/30"
                        )}>
                          {item.estado}
                        </Badge>
                      </div>
                      
                      <Button
                        onClick={() => handleAction(order.id, item.id)}
                        disabled={item.estado === 'LISTO'}
                        className={cn(
                          "w-full mt-3 h-10 font-bold text-xs rounded-lg transition-all",
                          item.estado === 'PENDIENTE' 
                            ? "bg-accent hover:bg-primary hover:text-white border border-border" 
                            : item.estado === 'EN PREPARACION'
                            ? "bg-secondary text-secondary-foreground hover:glow-gold"
                            : "bg-green-600/20 text-green-500 border border-green-500/30 cursor-default"
                        )}
                      >
                        {item.estado === 'PENDIENTE' ? 'TOMAR PEDIDO' : item.estado === 'EN PREPARACION' ? 'MARCAR LISTO ✓' : 'COMPLETADO'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}