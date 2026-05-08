"use client"

import { AppSidebar } from "@/components/layout/AppSidebar";
import { usePOSStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, Users, UtensilsCrossed } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function MesasPage() {
  const { mesas, updateMesaEstado, user } = usePOSStore();
  const [selectedMesa, setSelectedMesa] = useState<number | null>(null);
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIBRE': return 'bg-green-500/20 border-green-500 text-green-500';
      case 'OCUPADA': return 'bg-red-500/20 border-red-500 text-red-500';
      case 'EN PEDIDO': return 'bg-yellow-500/20 border-yellow-500 text-yellow-500';
      case 'LISTA PAGAR': return 'bg-orange-500/20 border-orange-500 text-orange-500';
      case 'RESERVADA': return 'bg-blue-500/20 border-blue-500 text-blue-500';
      default: return 'bg-muted';
    }
  };

  const handleOpenMesa = (mesaId: number) => {
    updateMesaEstado(mesaId, 'OCUPADA', user?.id);
    router.push(`/pedidos/${mesaId}`);
  };

  const handleVerPedido = (mesaId: number) => {
    router.push(`/pedidos/${mesaId}`);
  };

  return (
    <div className="flex bg-background min-h-screen">
      <AppSidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-headline text-foreground">Mapa de Mesas</h2>
            <p className="text-muted-foreground">Selecciona una mesa para gestionar pedidos</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs">Libre</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs">Ocupada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-xs">Esperando</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {mesas.map((mesa) => (
            <Dialog key={mesa.id}>
              <DialogTrigger asChild>
                <button
                  onClick={() => setSelectedMesa(mesa.id)}
                  className={cn(
                    "relative group h-40 rounded-2xl border-2 transition-all duration-300 p-4 flex flex-col items-center justify-between wood-texture overflow-hidden",
                    getStatusColor(mesa.estado),
                    mesa.estado === 'OCUPADA' || mesa.estado === 'EN PEDIDO' ? "glow-orange" : "hover:scale-105"
                  )}
                >
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <UtensilsCrossed className="w-12 h-12" />
                  </div>
                  
                  <div className="w-full flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-background/50 border border-current">
                      {mesa.zona}
                    </span>
                    {mesa.estado !== 'LIBRE' && (
                      <div className="flex items-center gap-1 text-[10px] font-mono">
                        <Clock className="w-3 h-3" />
                        <span>12m</span>
                      </div>
                    )}
                  </div>

                  <span className="text-5xl font-headline font-black z-10">{mesa.id}</span>
                  
                  <div className="w-full flex justify-center items-center gap-1 mt-2">
                    <Users className="w-3 h-3" />
                    <span className="text-xs font-bold">{mesa.capacidad} pers</span>
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border text-foreground">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-headline">Gestionar Mesa {mesa.id}</DialogTitle>
                </DialogHeader>
                <div className="py-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-accent/30 p-4 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-tighter">Zona</p>
                      <p className="font-bold text-lg">{mesa.zona}</p>
                    </div>
                    <div className="bg-accent/30 p-4 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-tighter">Estado</p>
                      <p className="font-bold text-lg text-secondary">{mesa.estado}</p>
                    </div>
                  </div>

                  {mesa.estado === 'LIBRE' ? (
                    <Button 
                      className="w-full h-16 text-lg bg-primary hover:glow-orange font-bold rounded-xl"
                      onClick={() => handleOpenMesa(mesa.id)}
                    >
                      ABRIR MESA
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Button 
                        className="w-full h-14 bg-secondary text-secondary-foreground hover:glow-gold font-bold text-lg"
                        onClick={() => handleVerPedido(mesa.id)}
                      >
                        VER PEDIDO
                      </Button>
                      <Button variant="outline" className="w-full h-14 border-primary text-primary hover:bg-primary/10">
                        CAMBIAR DE MESA
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </main>
    </div>
  );
}
