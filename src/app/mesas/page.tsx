
"use client"

import { usePOSStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, Users, UtensilsCrossed, PlusCircle, Edit, Ban, CheckCircle, Layers, AlertCircle, MapPin, Activity, Info, Map } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
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
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Mesa, Orden } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MesasPage() {
  const { mesas, updateMesaEstado, updateMesa, addMesa, user, ordenes } = usePOSStore();
  const [selectedMesaId, setSelectedMesaId] = useState<number | null>(null);
  const [isAddMesaOpen, setIsAddMesaOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [newMesa, setNewMesa] = useState({
    id: "",
    zona: "Primer Piso" as const,
    capacidad: 4
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
      const nextId = mesas.length > 0 ? Math.max(...mesas.map(m => m.id)) + 1 : 1;
      setNewMesa(prev => ({ ...prev, id: nextId.toString() }));
    }
    setIsAddMesaOpen(open);
  };

  const handleAddMesa = () => {
    const mesaId = parseInt(newMesa.id);
    if (isNaN(mesaId)) return;

    const mesa: Mesa = {
      id: mesaId,
      numero: mesaId,
      zona: newMesa.zona,
      capacidad: newMesa.capacidad,
      estado: 'LIBRE'
    };

    addMesa(mesa);
    setIsAddMesaOpen(false);
    toast({
      title: "Mesa Agregada",
      description: `Mesa ${mesaId} registrada.`
    });
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

  const mesasPlanta1 = mesas.filter(m => m.zona === 'Primer Piso');
  const mesasPlanta2 = mesas.filter(m => m.zona === 'Segundo Piso');

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
                  <Input value={newMesa.id} readOnly className="bg-accent/20" />
                </div>
                <div className="space-y-2">
                  <Label>Piso</Label>
                  <Select onValueChange={(v) => setNewMesa({ ...newMesa, zona: v as any })} defaultValue="Primer Piso">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona Piso" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="Primer Piso">Primer Piso</SelectItem>
                      <SelectItem value="Segundo Piso">Segundo Piso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Capacidad</Label>
                  <Input type="number" value={newMesa.capacidad} onChange={(e) => setNewMesa({...newMesa, capacidad: parseInt(e.target.value) || 0})} />
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

      <Tabs defaultValue="piso1" className="w-full">
        <TabsList className="bg-accent/30 border border-border p-1 h-12 mb-6 w-full sm:w-auto overflow-x-auto overflow-y-hidden">
          <TabsTrigger value="piso1" className="flex-1 sm:flex-none data-[state=active]:bg-primary data-[state=active]:text-white gap-2 px-6">
            <Layers className="w-4 h-4" />
            1er Piso
          </TabsTrigger>
          <TabsTrigger value="piso2" className="flex-1 sm:flex-none data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground gap-2 px-6">
            <Layers className="w-4 h-4" />
            2do Piso
          </TabsTrigger>
        </TabsList>

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
                getStatusColor={getStatusColor}
                ordenes={ordenes}
              />
            ))}
          </div>
        </TabsContent>
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
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Capacidad</Label>
                    <Input type="number" value={editMesa.capacidad} onChange={(e) => setEditMesa({ ...editMesa, capacidad: parseInt(e.target.value) || 0 })} />
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

function MesaCard({ mesa, user, onOpenMesa, onVerPedido, onStartEdit, onToggleFueraServicio, getStatusColor, ordenes }: any) {
    const activeOrder = ordenes.find((o: Orden) => o.mesaId === mesa.id && o.estado === 'ABIERTA');
    const [delayLevel, setDelayLevel] = useState<'none' | 'warning' | 'critical'>('none');

    useEffect(() => {
      if (!activeOrder) {
        setDelayLevel('none');
        return;
      }

      const checkDelay = () => {
        const start = new Date(activeOrder.createdAt).getTime();
        const now = new Date().getTime();
        const mins = (now - start) / 1000 / 60;

        if (mins >= 60) setDelayLevel('critical');
        else if (mins >= 30) setDelayLevel('warning');
        else setDelayLevel('none');
      };

      checkDelay();
      const interval = setInterval(checkDelay, 30000);
      return () => clearInterval(interval);
    }, [activeOrder]);

    return (
        <Dialog>
          <DialogTrigger asChild>
            <button
              className={cn(
                "relative group h-32 md:h-40 rounded-3xl border-2 transition-all duration-500 p-4 md:p-5 flex flex-col items-center justify-between wood-texture overflow-hidden active:scale-95",
                getStatusColor(mesa.estado),
                delayLevel === 'critical' ? "ring-2 ring-red-500 ring-offset-2 ring-offset-background animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]" : 
                delayLevel === 'warning' ? "ring-2 ring-yellow-500/50 ring-offset-1 ring-offset-background" : 
                "hover:scale-[1.02] shadow-lg"
              )}
            >
              <div className="absolute top-0 right-0 p-3 opacity-10">
                {mesa.estado === 'FUERA SERVICIO' ? <Ban className="w-10 h-10 md:w-14 md:h-14" /> : <UtensilsCrossed className="w-10 h-10 md:w-14 md:h-14" />}
              </div>
              
              <div className="w-full flex justify-between items-start z-10">
                <span className="text-[8px] md:text-[9px] font-mono font-black px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg bg-background/40 backdrop-blur-sm border border-current/20">
                  {mesa.zona === 'Primer Piso' ? '1er' : '2do'}
                </span>
                {delayLevel !== 'none' && (
                  <div className="flex items-center">
                    <div className={cn(
                      "w-2 md:w-2.5 h-2 md:h-2.5 rounded-full animate-ping absolute",
                      delayLevel === 'critical' ? "bg-red-500" : "bg-yellow-500"
                    )} />
                    <div className={cn(
                      "w-2 md:w-2.5 h-2 md:h-2.5 rounded-full relative",
                      delayLevel === 'critical' ? "bg-red-500" : "bg-yellow-500"
                    )} />
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-0 md:gap-1 z-10">
                <span className="text-4xl md:text-6xl font-headline font-black tracking-tighter">{mesa.id}</span>
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
                    <DialogTitle className="text-3xl font-headline tracking-tighter">Mesa {mesa.id}</DialogTitle>
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

              {delayLevel !== 'none' && (
                <div className={cn(
                  "p-4 rounded-3xl border-2 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500",
                  delayLevel === 'critical' ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-yellow-500/10 border-yellow-500/30 text-yellow-500"
                )}>
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    delayLevel === 'critical' ? "bg-red-500/20" : "bg-yellow-500/20"
                  )}>
                    <AlertCircle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tighter">¡Atención: Retraso Detectado!</p>
                    <p className="text-[10px] opacity-80 leading-tight">Es necesario validar prioridad con la cocina de inmediato.</p>
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-2 relative z-10">
                {mesa.estado === 'LIBRE' ? (
                  <Button 
                    className="w-full h-16 text-xl bg-primary hover:glow-orange font-bold rounded-[1.25rem] transition-all hover:scale-[1.02] shadow-xl group" 
                    onClick={() => onOpenMesa(mesa.id)}
                  >
                    <PlusCircle className="w-6 h-6 mr-2 transition-transform group-hover:rotate-90" />
                    ABRIR MESA
                  </Button>
                ) : mesa.estado === 'FUERA SERVICIO' ? (
                  <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-3xl text-center space-y-2">
                     <Ban className="w-8 h-8 text-destructive mx-auto" />
                     <h4 className="text-sm font-black text-destructive uppercase tracking-widest">Inhabilitada</h4>
                     <p className="text-[10px] text-muted-foreground">Esta mesa no puede recibir pedidos actualmente.</p>
                  </div>
                ) : (
                  <Button 
                    className="w-full h-16 bg-secondary text-secondary-foreground hover:glow-gold font-bold text-xl rounded-[1.25rem] transition-all hover:scale-[1.02] shadow-xl group" 
                    onClick={() => onVerPedido(mesa.id)}
                  >
                    <UtensilsCrossed className="w-6 h-6 mr-2 transition-transform group-hover:scale-110" />
                    GESTIONAR PEDIDO
                  </Button>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  {user?.rol === 'ADMINISTRADOR' && (
                    <Button 
                      variant="outline" 
                      className="h-14 border-border/50 bg-background/50 hover:bg-accent/50 text-muted-foreground hover:text-foreground gap-2 rounded-2xl transition-all" 
                      onClick={() => onStartEdit(mesa)}
                    >
                      <Edit className="w-4 h-4" /> 
                      <span className="text-xs font-bold uppercase tracking-widest">Editar</span>
                    </Button>
                  )}
                  
                  {(user?.rol === 'ADMINISTRADOR' || user?.rol === 'MESERO') && (
                    <Button 
                      variant="outline" 
                      className={cn(
                        "h-14 gap-2 rounded-2xl transition-all border-border/50 bg-background/50",
                        user?.rol !== 'ADMINISTRADOR' && "col-span-2",
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
    )
}
