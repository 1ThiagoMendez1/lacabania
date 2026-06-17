
"use client"

import { usePOSStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn, getOrderIdentifier } from "@/lib/utils";
import { Clock, Users, UtensilsCrossed, PlusCircle, Edit, Ban, CheckCircle, Layers, AlertCircle, MapPin, Activity, Info, Map, Trash2, ShoppingBag, Star, Lock, UserCircle } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Mesa, Orden } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MesasPage() {
  const { mesas, updateMesaEstado, updateMesa, addMesa, deleteMesa, user, ordenes, isCajaCerrada } = usePOSStore();
  const [selectedMesaId, setSelectedMesaId] = useState<number | null>(null);
  const [isAddMesaOpen, setIsAddMesaOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Asegurar que el body vuelva a recibir eventos de clic al montar la página
    if (typeof document !== 'undefined') {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
    }

    const refresh = usePOSStore.getState().refreshOrdenesYMesas;
    const setupRealtime = usePOSStore.getState().setupRealtime;
    
    // Forzar actualización inicial
    refresh().catch(err => console.error("Error al refrescar mesas al montar vista de mesas:", err));
    setupRealtime();

    // Sondeo de respaldo cada 5 segundos
    const interval = setInterval(() => {
      refresh().catch(err => console.error("Error en sondeo de respaldo de mesas:", err));
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const [newMesa, setNewMesa] = useState<{ id: string; zona: Mesa['zona']; capacidad: number | undefined }>({
    id: "",
    zona: "Primer Piso" as Mesa['zona'],
    capacidad: undefined
  });

  const [editMesa, setEditMesa] = useState<Partial<Mesa>>({});

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIBRE': return 'bg-green-500/10 border-green-500/30 text-green-500';
      case 'OCUPADA': return 'bg-primary/10 border-primary/30 text-primary';
      case 'EN PEDIDO': return 'bg-secondary/10 border-secondary/30 text-secondary';
      case 'LISTA PAGAR': return 'bg-orange-500/10 border-orange-500/30 text-orange-500';
      case 'RESERVADA': return 'bg-blue-500/10 border-blue-500/30 text-blue-500';
      case 'FUERA SERVICIO': return 'bg-slate-500/10 border-slate-500/30 text-slate-500 opacity-60 grayscale';
      default: return 'bg-muted';
    }
  };

  const handleOpenMesa = (mesaId: number) => {
    if (isCajaCerrada) {
      toast({
        variant: "destructive",
        title: "Ventas Bloqueadas",
        description: "No se pueden abrir mesas porque la caja de hoy ya está cerrada. 🤠"
      });
      return;
    }
    const mesa = mesas.find(m => m.id === mesaId);
    if (mesa?.estado === 'FUERA SERVICIO') {
      toast({
        variant: "destructive",
        title: "Mesa No Disponible",
        description: "Esta mesa se encuentra fuera de servicio actualmente."
      });
      return;
    }
    updateMesaEstado(mesaId, 'OCUPADA', user?.id);
    router.push(`/pedidos/${mesaId}`);
  };

  const handleVerPedido = (mesaId: number) => {
    router.push(`/pedidos/${mesaId}`);
  };

  const handleAddMesaDialogOpenChange = (open: boolean) => {
    if (open) {
      setNewMesa({
        id: "",
        zona: "Primer Piso",
        capacidad: undefined
      });
    }
    setIsAddMesaOpen(open);
  };

  const handleAddMesa = async () => {
    const mesaId = parseInt(newMesa.id);
    if (isNaN(mesaId)) return;

    if (mesas.some(m => m.id === mesaId)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `La mesa número ${mesaId} ya existe.`
      });
      return;
    }

    const mesa: Mesa = {
      id: mesaId,
      numero: mesaId,
      zona: newMesa.zona,
      capacidad: newMesa.capacidad || 4,
      estado: 'LIBRE'
    };

    try {
      await addMesa(mesa);
      setIsAddMesaOpen(false);
      toast({
        title: "Mesa Agregada",
        description: `Mesa ${mesaId} registrada.`
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al crear mesa",
        description: error.message
      });
    }
  };

  const handleStartEdit = (mesa: Mesa) => {
    setEditMesa({ ...mesa });
    setIsEditMode(true);
  };

  const handleSaveEdit = () => {
    if (!editMesa.id) return;
    updateMesa(editMesa.id, editMesa);
    setIsEditMode(false);
  };

  const toggleFueraServicio = (mesa: Mesa) => {
    const nuevoEstado = mesa.estado === 'FUERA SERVICIO' ? 'LIBRE' : 'FUERA SERVICIO';
    updateMesaEstado(mesa.id, nuevoEstado);
  };

  const handleNuevoPedidoParaLlevar = async () => {
    if (isCajaCerrada) {
      toast({
        variant: "destructive",
        title: "Ventas Bloqueadas",
        description: "No se pueden realizar pedidos porque la caja ya está cerrada. 🤠"
      });
      return;
    }

    // Primero, verificar si hay alguna mesa 'Para Llevar' que esté 'LIBRE' para reutilizarla.
    const availableMesa = mesas.find(m => m.zona === 'Para Llevar' && m.estado === 'LIBRE');
    if (availableMesa) {
      try {
        await updateMesaEstado(availableMesa.id, 'OCUPADA', user?.id);
        toast({
          title: "Pedido Para Llevar Reutilizado",
          description: `Reabriendo canal para llevar ${getOrderIdentifier({ mesaId: availableMesa.id })}.`
        });
        router.push(`/pedidos/${availableMesa.id}`);
        return;
      } catch (err) {
        console.error("Error al reutilizar mesa de llevar libre:", err);
      }
    }
    
    // Buscar el siguiente ID disponible para pedidos "Para Llevar".
    // Empezamos en 101 para diferenciarlos de las mesas físicas de los salones.
    const takeAwayMesas = mesas.filter(m => m.zona === 'Para Llevar');
    let nextId = 101;
    if (takeAwayMesas.length > 0) {
      nextId = Math.max(...takeAwayMesas.map(m => m.id)) + 1;
    } else {
      const allIds = mesas.map(m => m.id);
      while (allIds.includes(nextId)) {
        nextId++;
      }
    }

    const mesa: Mesa = {
      id: nextId,
      numero: nextId,
      zona: 'Para Llevar',
      capacidad: 1,
      estado: 'OCUPADA',
      meseroId: user?.id
    };

    console.log("Iniciando creación de pedido para llevar:", mesa);
    try {
      await addMesa(mesa);
      console.log("Pedido para llevar creado exitosamente en Supabase. Redirigiendo a pedidos de mesa ID:", nextId);
      toast({
        title: "Pedido Para Llevar Creado",
        description: `Abriendo comanda para llevar ${getOrderIdentifier({ mesaId: nextId })}.`
      });
      router.push(`/pedidos/${nextId}`);
    } catch (err: any) {
      console.error("Error al crear pedido para llevar:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo iniciar el pedido para llevar en la base de datos."
      });
    }
  };

  const handleDeleteMesa = async (mesaId: number) => {
    try {
      await deleteMesa(mesaId);
      toast({
        title: "Mesa Eliminada",
        description: `La Mesa ${mesaId} ha sido eliminada del sistema.`
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "No se pudo eliminar",
        description: error.message || "Error al eliminar la mesa."
      });
    }
  };

  const mesasPlanta1 = mesas.filter(m => m.zona === 'Primer Piso');
  const mesasPlanta2 = mesas.filter(m => m.zona === 'Segundo Piso');
  const mesasParaLlevar = mesas.filter(m => m.zona === 'Para Llevar' && m.estado !== 'LIBRE');

  return (
    <main className="p-4 md:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Map className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-headline text-foreground">Mapa de Mesas</h2>
          </div>
          <p className="text-sm text-muted-foreground">Selecciona una mesa para gestionar pedidos</p>
        </div>
        
        {user?.rol === 'ADMINISTRADOR' && (
          <Dialog open={isAddMesaOpen} onOpenChange={handleAddMesaDialogOpenChange}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:glow-gold font-bold gap-2 rounded-xl">
                <PlusCircle className="w-5 h-5" />
                Nueva Mesa
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline">Nueva Mesa</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input 
                    value={newMesa.id} 
                    onChange={(e) => setNewMesa({ ...newMesa, id: e.target.value })}
                    placeholder="Ej. 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Zona / Área</Label>
                  <Select 
                    onValueChange={(v) => {
                      setNewMesa({ ...newMesa, zona: v });
                    }} 
                    value={newMesa.zona}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona Zona" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="Primer Piso">Primer Piso</SelectItem>
                      <SelectItem value="Segundo Piso">Segundo Piso</SelectItem>
                      <SelectItem value="Para Llevar">Para Llevar (Lleva)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Capacidad</Label>
                  <Input 
                    type="number" 
                    value={newMesa.capacidad ?? ""} 
                    onChange={(e) => setNewMesa({...newMesa, capacidad: e.target.value === "" ? undefined : parseInt(e.target.value)})} 
                    placeholder="Ej: 4"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAddMesaOpen(false)}>Cancelar</Button>
                <Button className="bg-primary font-bold" onClick={handleAddMesa}>CREAR MESA</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </header>

      {isCajaCerrada && (
        <div className="mb-6 bg-red-600/20 border-2 border-red-500 text-red-500 p-4 rounded-2xl flex items-center gap-3 shadow-lg animate-in slide-in-from-top-4 duration-500">
          <Ban className="w-6 h-6 animate-pulse shrink-0" />
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight">Caja Cerrada</h4>
            <p className="text-xs font-medium opacity-90">Las ventas del día han sido bloqueadas debido al Cierre Diario. No se permiten nuevas comandas o cobros.</p>
          </div>
        </div>
      )}

      <Tabs defaultValue={user?.rol === 'CAJERO' ? "paraLlevar" : "piso1"} className="w-full">
        <TabsList className="bg-accent/30 border border-border p-1 h-12 mb-6 w-full sm:w-auto overflow-x-auto overflow-y-hidden">
          {user?.rol !== 'CAJERO' && (
            <>
              <TabsTrigger value="piso1" className="flex-1 sm:flex-none data-[state=active]:bg-primary data-[state=active]:text-white gap-2 px-6">
                <Layers className="w-4 h-4" />
                1er Piso
              </TabsTrigger>
              <TabsTrigger value="piso2" className="flex-1 sm:flex-none data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground gap-2 px-6">
                <Layers className="w-4 h-4" />
                2do Piso
              </TabsTrigger>
            </>
          )}
          {user?.rol !== 'MESERO' && (
            <TabsTrigger value="paraLlevar" className="flex-1 sm:flex-none data-[state=active]:bg-amber-600 data-[state=active]:text-white gap-2 px-6">
              <Layers className="w-4 h-4" />
              Para Llevar
            </TabsTrigger>
          )}
        </TabsList>

        {user?.rol !== 'CAJERO' && (
          <>
            <TabsContent value="piso1">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                {mesasPlanta1.map((mesa) => (
                  <MesaCard 
                    key={mesa.id} 
                    mesa={mesa} 
                    user={user}
                    onOpenMesa={handleOpenMesa} 
                    onVerPedido={handleVerPedido} 
                    onStartEdit={handleStartEdit} 
                    onToggleFueraServicio={toggleFueraServicio} 
                    onDeleteMesa={handleDeleteMesa}
                    getStatusColor={getStatusColor}
                    ordenes={ordenes}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="piso2">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                {mesasPlanta2.map((mesa) => (
                  <MesaCard 
                    key={mesa.id} 
                    mesa={mesa} 
                    user={user}
                    onOpenMesa={handleOpenMesa} 
                    onVerPedido={handleVerPedido} 
                    onStartEdit={handleStartEdit} 
                    onToggleFueraServicio={toggleFueraServicio} 
                    onDeleteMesa={handleDeleteMesa}
                    getStatusColor={getStatusColor}
                    ordenes={ordenes}
                  />
                ))}
              </div>
            </TabsContent>
          </>
        )}

        {user?.rol !== 'MESERO' && (
        <TabsContent value="paraLlevar">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            <button
              onClick={handleNuevoPedidoParaLlevar}
              disabled={isCajaCerrada}
              className={cn(
                "relative group h-32 md:h-40 rounded-3xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500 text-amber-500 transition-all duration-300 p-4 md:p-5 flex flex-col items-center justify-center gap-2 active:scale-95 shadow-md hover:shadow-xl hover:shadow-amber-500/10",
                isCajaCerrada && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="p-2.5 bg-amber-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <ShoppingBag className="w-7 h-7 md:w-9 md:h-9 text-amber-500" />
              </div>
              <div className="text-center">
                <span className="text-[11px] md:text-xs font-black uppercase tracking-wider block">Nuevo Pedido</span>
                <span className="text-[8px] opacity-75 font-bold uppercase tracking-widest">Para Llevar</span>
              </div>
            </button>

            {mesasParaLlevar.map((mesa) => (
              <MesaCard 
                key={mesa.id} 
                mesa={mesa} 
                user={user}
                onOpenMesa={handleOpenMesa} 
                onVerPedido={handleVerPedido} 
                onStartEdit={handleStartEdit} 
                onToggleFueraServicio={toggleFueraServicio} 
                onDeleteMesa={handleDeleteMesa}
                getStatusColor={getStatusColor}
                ordenes={ordenes}
              />
            ))}
          </div>
        </TabsContent>
        )}
      </Tabs>

      <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
          <DialogContent className="bg-card border-border text-foreground">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline">Editando Mesa {editMesa.id}</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Piso</Label>
                    <Select onValueChange={(v) => setEditMesa({ ...editMesa, zona: v as any })} defaultValue={editMesa.zona}>
                      <SelectTrigger><SelectValue placeholder="Piso" /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="Primer Piso">Primer Piso</SelectItem>
                        <SelectItem value="Segundo Piso">Segundo Piso</SelectItem>
                        <SelectItem value="Para Llevar">Para Llevar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Número Visible</Label>
                    <Input 
                      type="number" 
                      value={editMesa.numero ?? ""} 
                      onChange={(e) => setEditMesa({ ...editMesa, numero: e.target.value === "" ? undefined : parseInt(e.target.value) })} 
                      placeholder="Ej: 5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Capacidad</Label>
                    <Input 
                      type="number" 
                      value={editMesa.capacidad ?? ""} 
                      onChange={(e) => setEditMesa({ ...editMesa, capacidad: e.target.value === "" ? undefined : parseInt(e.target.value) })} 
                      placeholder="Ej: 4"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="ghost" className="flex-1" onClick={() => setIsEditMode(false)}>Cancelar</Button>
                    <Button className="bg-primary flex-1 font-bold" onClick={handleSaveEdit}>GUARDAR</Button>
                  </div>
              </div>
          </DialogContent>
      </Dialog>
    </main>
  );
}

function MesaCard({ mesa, user, onOpenMesa, onVerPedido, onStartEdit, onToggleFueraServicio, onDeleteMesa, getStatusColor, ordenes }: any) {
    const { isCajaCerrada, updateOrden, usuarios } = usePOSStore();
    const router = useRouter();
    const activeOrder = ordenes.find((o: Orden) => o.mesaId === mesa.id && o.estado === 'ABIERTA');
    const isMesaOwnedByOther = user?.rol === 'MESERO' && mesa.meseroId && mesa.meseroId !== user.id;
    const ownerMeseroNombre = (mesa.meseroId && usuarios.find((u: any) => u.id === mesa.meseroId)?.nombre) || "otro mesero";
    const [isOpen, setIsOpen] = useState(false);

    const isLlevar = mesa.zona === 'Para Llevar';
    const orderNum = mesa.id >= 101 ? mesa.id - 100 : mesa.id;

    return (
      <>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            {isLlevar ? (
              <button
                className={cn(
                  "relative group h-32 md:h-40 rounded-3xl border transition-all duration-500 p-4 md:p-5 flex flex-col items-center justify-between overflow-hidden active:scale-95 w-full",
                  mesa.estado === 'LIBRE' 
                    ? "bg-slate-900/40 border-slate-700/50 text-slate-400 hover:border-amber-500/50 hover:bg-slate-900/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.05)]" 
                    : mesa.estado === 'EN PEDIDO'
                    ? "bg-gradient-to-br from-amber-600/10 via-amber-700/5 to-transparent border-amber-500/40 text-amber-300 shadow-[0_4px_20px_rgba(245,158,11,0.15)] hover:border-amber-500/60"
                    : "bg-gradient-to-br from-emerald-600/10 via-emerald-700/5 to-transparent border-emerald-500/40 text-emerald-300 shadow-[0_4px_20px_rgba(16,185,129,0.15)] hover:border-emerald-500/60",
                  "hover:scale-[1.02] shadow-lg"
                )}
              >
                <div className="absolute -bottom-4 -right-4 p-3 opacity-[0.06] group-hover:scale-110 group-hover:opacity-10 transition-all duration-500 pointer-events-none">
                  <ShoppingBag className="w-20 h-20 md:w-28 md:h-28 text-current" />
                </div>
                
                <div className="w-full flex justify-between items-start z-10">
                  <span className="text-[7px] md:text-[8px] font-mono font-black px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/20 text-amber-500 uppercase tracking-widest">
                    LLEVAR
                  </span>
                </div>

                <div className="flex flex-col items-center gap-0.5 md:gap-1 z-10">
                  <span className="text-[9px] md:text-[10px] font-mono font-black uppercase tracking-[0.2em] text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
                    Pedido
                  </span>
                  <span className="text-3xl md:text-4xl font-headline font-black tracking-tighter bg-gradient-to-r from-amber-200 via-amber-100 to-yellow-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                    {activeOrder && activeOrder.consecutivo ? `PLL-${activeOrder.consecutivo}` : `#${orderNum}`}
                  </span>
                </div>

                <div className="w-full flex justify-center z-10">
                   <Badge variant="outline" className={cn(
                     "text-[7px] md:text-[8px] font-black uppercase tracking-[0.15em] bg-background/20 py-0.5 px-2.5 border-current/20",
                     mesa.estado === 'LIBRE' ? "text-slate-400 border-slate-700/50" : mesa.estado === 'EN PEDIDO' ? "text-amber-400 border-amber-500/30" : "text-emerald-400 border-emerald-500/30"
                   )}>
                     {mesa.estado === 'LIBRE' ? 'Disponible' : mesa.estado}
                   </Badge>
                </div>
              </button>
            ) : (
              <button
                className={cn(
                  "relative group h-32 md:h-40 rounded-3xl border-2 transition-all duration-500 p-4 md:p-5 flex flex-col items-center justify-between wood-texture overflow-hidden active:scale-95",
                  getStatusColor(mesa.estado),
                  "hover:scale-[1.02] shadow-lg"
                )}
              >
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  {isMesaOwnedByOther ? (
                    <Lock className="w-10 h-10 md:w-14 md:h-14 text-destructive" />
                  ) : mesa.estado === 'FUERA SERVICIO' ? (
                    <Ban className="w-10 h-10 md:w-14 md:h-14" />
                  ) : (
                    <UtensilsCrossed className="w-10 h-10 md:w-14 md:h-14" />
                  )}
                </div>
                
                <div className="w-full flex justify-between items-start z-10">
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] md:text-[9px] font-mono font-black px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg bg-background/40 backdrop-blur-sm border border-current/20">
                      {mesa.zona === 'Primer Piso' ? '1er' : '2do'}
                    </span>
                    {isMesaOwnedByOther && (
                      <span className="text-[8px] md:text-[9px] font-mono font-black px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-500 flex items-center gap-1 shadow-sm">
                        <Lock className="w-2.5 h-2.5" /> <span>BLOQ</span>
                      </span>
                    )}
                    {(user?.rol === 'MESERO' && mesa.meseroId === user.id) && (
                      <span className="text-[8px] md:text-[9px] font-mono font-black px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-500 flex items-center gap-1 shadow-sm">
                        <UserCircle className="w-2.5 h-2.5" /> <span>TU MESA</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {activeOrder && activeOrder.consecutivo && (
                      <span className="text-[8px] md:text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-primary/20 border border-primary/30 text-primary">
                        MESA-{activeOrder.consecutivo}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-0 md:gap-1 z-10">
                  <span className="text-4xl md:text-6xl font-headline font-black tracking-tighter">{mesa.numero || mesa.id}</span>
                  <div className="flex items-center gap-1 opacity-60">
                    <Users className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">{mesa.capacidad} P</span>
                  </div>
                </div>

                <div className="w-full flex justify-center z-10">
                   <Badge variant="outline" className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] bg-background/20 py-0 px-2 border-current/20">
                     {mesa.estado}
                   </Badge>
                </div>
              </button>
            )}
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground paper-texture max-w-[95vw] sm:max-w-[450px] rounded-[2.5rem] overflow-hidden p-0">
            <div className="relative p-6 sm:p-8 space-y-6">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <UtensilsCrossed className="w-32 h-32" />
              </div>

              <DialogHeader className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-primary/20">
                    🤠
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-headline tracking-tighter">
                      {getOrderIdentifier({ mesaId: mesa.id, consecutivo: activeOrder?.consecutivo, id: activeOrder?.id })}
                    </DialogTitle>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Detalle de Gestión</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="bg-accent/40 p-4 rounded-3xl border border-border/50 shadow-sm backdrop-blur-sm group hover:bg-accent/60 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Ubicación</span>
                  </div>
                  <p className="font-headline text-lg sm:text-xl">{mesa.zona}</p>
                </div>
                
                <div className={cn(
                  "bg-accent/40 p-4 rounded-3xl border border-border/50 shadow-sm backdrop-blur-sm group hover:bg-accent/60 transition-colors",
                  mesa.estado === 'LIBRE' ? "border-green-500/20" : "border-secondary/20"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className={cn("w-3.5 h-3.5", mesa.estado === 'LIBRE' ? "text-green-500" : "text-secondary")} />
                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Estado</span>
                  </div>
                  <p className={cn(
                    "font-headline text-lg sm:text-xl",
                    mesa.estado === 'FUERA SERVICIO' ? 'text-slate-500' : 'text-secondary'
                  )}>
                    {mesa.estado}
                  </p>
                </div>
              </div>
              <div className="space-y-4 pt-2 relative z-10">
                {isMesaOwnedByOther ? (
                  <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-3xl text-center space-y-2">
                     <Lock className="w-8 h-8 text-destructive mx-auto animate-pulse" />
                     <h4 className="text-sm font-black text-destructive uppercase tracking-widest">Mesa Bloqueada</h4>
                     <p className="text-xs text-muted-foreground leading-tight">
                       Esta mesa está siendo atendida por el mesero <br />
                       <strong className="text-foreground">{ownerMeseroNombre}</strong>.
                     </p>
                  </div>
                ) : mesa.estado === 'LIBRE' ? (
                  <Button 
                    className="w-full h-16 text-xl bg-primary hover:glow-orange font-bold rounded-[1.25rem] transition-all hover:scale-[1.02] shadow-xl group" 
                    onClick={() => {
                      setIsOpen(false);
                      setTimeout(() => {
                        onOpenMesa(mesa.id);
                      }, 100);
                    }}
                    disabled={isCajaCerrada}
                  >
                    <PlusCircle className="w-6 h-6 mr-2 transition-transform group-hover:rotate-90" />
                    {isCajaCerrada ? "CAJA CERRADA" : "ABRIR MESA"}
                  </Button>
                ) : mesa.estado === 'FUERA SERVICIO' ? (
                  <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-3xl text-center space-y-2">
                     <Ban className="w-8 h-8 text-destructive mx-auto" />
                     <h4 className="text-sm font-black text-destructive uppercase tracking-widest">Inhabilitada</h4>
                     <p className="text-[10px] text-muted-foreground">Esta mesa no puede recibir pedidos actualmente.</p>
                  </div>
                ) : (
                  <div className="space-y-3 w-full">
                    <Button 
                      className="w-full h-16 bg-secondary text-secondary-foreground hover:glow-gold font-bold text-xl rounded-[1.25rem] transition-all hover:scale-[1.02] shadow-xl group" 
                      onClick={() => {
                        setIsOpen(false);
                        setTimeout(() => {
                          onVerPedido(mesa.id);
                        }, 100);
                      }}
                      disabled={isCajaCerrada}
                    >
                      <UtensilsCrossed className="w-6 h-6 mr-2 transition-transform group-hover:scale-110" />
                      {isCajaCerrada ? "CAJA CERRADA" : "GESTIONAR PEDIDO"}
                    </Button>
                  </div>
                )}
                
                <div className={cn("grid gap-3", user?.rol === 'ADMINISTRADOR' ? "grid-cols-3" : "grid-cols-1")}>
                  {user?.rol === 'ADMINISTRADOR' && (
                    <>
                      <Button 
                        variant="outline" 
                        className="h-14 border-border/50 bg-background/50 hover:bg-accent/50 text-muted-foreground hover:text-foreground gap-2 rounded-2xl transition-all" 
                        onClick={() => onStartEdit(mesa)}
                      >
                        <Edit className="w-4 h-4" /> 
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-14 border-border/50 bg-background/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive gap-2 rounded-2xl transition-all" 
                        onClick={() => {
                          if (confirm("¿Estás seguro de eliminar esta mesa?")) {
                            setIsOpen(false);
                            onDeleteMesa(mesa.id);
                          }
                        }}
                        disabled={mesa.estado !== 'LIBRE' && mesa.estado !== 'FUERA SERVICIO'}
                      >
                        <Trash2 className="w-4 h-4" /> 
                      </Button>
                    </>
                  )}
                  
                  {(user?.rol === 'ADMINISTRADOR' || user?.rol === 'MESERO') && (
                    <Button 
                      variant="outline" 
                      className={cn(
                        "h-14 gap-2 rounded-2xl transition-all border-border/50 bg-background/50",
                        mesa.estado === 'FUERA SERVICIO' ? "hover:border-green-500 hover:text-green-500" : "hover:border-destructive/50 hover:text-destructive"
                      )} 
                      onClick={() => onToggleFueraServicio(mesa)} 
                      disabled={mesa.estado !== 'LIBRE' && mesa.estado !== 'FUERA SERVICIO'}
                    >
                      {mesa.estado === 'FUERA SERVICIO' ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      <span className="text-xs font-bold uppercase tracking-widest">
                        {mesa.estado === 'FUERA SERVICIO' ? "Habilitar" : "Bloquear"}
                      </span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="pt-4 text-center">
                <p className="text-[8px] font-mono uppercase tracking-[0.3em] text-muted-foreground opacity-30">
                  La Cabaña POS • Control de Salón
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </>
    )
}
