
"use client"

import { usePOSStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, Users, UtensilsCrossed, PlusCircle, Edit, Ban, CheckCircle, Layers, AlertCircle } from "lucide-react";
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
    <main className="p-8">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-headline text-foreground">Mapa de Mesas</h2>
          <p className="text-muted-foreground">Selecciona una mesa para gestionar pedidos</p>
        </div>
        
        <div className="flex gap-4">
          <Dialog open={isAddMesaOpen} onOpenChange={handleAddMesaDialogOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-secondary text-secondary-foreground hover:glow-gold font-bold gap-2">
                <PlusCircle className="w-5 h-5" />
                Agregar Nueva Mesa
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
        </div>
      </header>

      <Tabs defaultValue="piso1" className="w-full">
        <TabsList className="bg-accent/30 border border-border p-1 h-12 mb-6">
          <TabsTrigger value="piso1" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-2 px-6">
            <Layers className="w-4 h-4" />
            Primer Piso
          </TabsTrigger>
          <TabsTrigger value="piso2" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground gap-2 px-6">
            <Layers className="w-4 h-4" />
            Segundo Piso
          </TabsTrigger>
        </TabsList>

        <TabsContent value="piso1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {mesasPlanta1.map((mesa) => (
              <MesaCard 
                key={mesa.id} 
                mesa={mesa} 
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {mesasPlanta2.map((mesa) => (
              <MesaCard 
                key={mesa.id} 
                mesa={mesa} 
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
                    <Button className="bg-primary flex-1 font-bold" onClick={handleSaveEdit}>GUARDAR CAMBIOS</Button>
                  </div>
              </div>
          </DialogContent>
      </Dialog>
    </main>
  );
}

function MesaCard({ mesa, onOpenMesa, onVerPedido, onStartEdit, onToggleFueraServicio, getStatusColor, ordenes }: any) {
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
                "relative group h-40 rounded-3xl border-2 transition-all duration-500 p-5 flex flex-col items-center justify-between wood-texture overflow-hidden",
                getStatusColor(mesa.estado),
                delayLevel === 'critical' ? "ring-2 ring-red-500 ring-offset-2 ring-offset-background animate-pulse" : 
                delayLevel === 'warning' ? "ring-2 ring-yellow-500/50 ring-offset-1 ring-offset-background" : 
                "hover:scale-[1.02] shadow-lg hover:shadow-xl"
              )}
            >
              <div className="absolute top-0 right-0 p-3 opacity-10">
                {mesa.estado === 'FUERA SERVICIO' ? <Ban className="w-14 h-14" /> : <UtensilsCrossed className="w-14 h-14" />}
              </div>
              
              <div className="w-full flex justify-between items-start z-10">
                <span className="text-[9px] font-mono font-black px-2.5 py-1 rounded-lg bg-background/40 backdrop-blur-sm border border-current/20">
                  {mesa.zona}
                </span>
                {delayLevel !== 'none' && (
                  <div className="flex items-center">
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full animate-ping absolute",
                      delayLevel === 'critical' ? "bg-red-500" : "bg-yellow-500"
                    )} />
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full relative",
                      delayLevel === 'critical' ? "bg-red-500" : "bg-yellow-500"
                    )} />
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-1 z-10">
                <span className="text-6xl font-headline font-black tracking-tighter">{mesa.id}</span>
                <div className="flex items-center gap-1.5 opacity-60">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{mesa.capacidad} PERS</span>
                </div>
              </div>

              <div className="w-full flex justify-center z-10">
                 <Badge variant="outline" className="text-[8px] font-black uppercase tracking-[0.2em] bg-background/20 py-0 px-2 border-current/20">
                   {mesa.estado}
                 </Badge>
              </div>
            </button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground paper-texture">
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
                    <p className={cn("font-bold text-lg", mesa.estado === 'FUERA SERVICIO' ? 'text-slate-500' : 'text-secondary')}>{mesa.estado}</p>
                  </div>
                </div>

                {delayLevel !== 'none' && (
                  <div className={cn(
                    "p-4 rounded-xl border-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                    delayLevel === 'critical' ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-yellow-500/10 border-yellow-500/30 text-yellow-500"
                  )}>
                    <AlertCircle className="w-5 h-5" />
                    <div className="flex-1">
                      <p className="text-sm font-black uppercase tracking-tight">Atención: Tiempo Excedido</p>
                      <p className="text-[10px] font-medium opacity-80">El pedido de esta mesa requiere validación prioritaria.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {mesa.estado === 'LIBRE' ? (
                    <Button className="w-full h-16 text-lg bg-primary hover:glow-orange font-bold rounded-xl" onClick={() => onOpenMesa(mesa.id)}>ABRIR MESA</Button>
                  ) : mesa.estado === 'FUERA SERVICIO' ? (
                    <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl text-center">
                       <Ban className="w-8 h-8 text-destructive mx-auto mb-2" />
                       <p className="text-sm font-bold text-destructive">Mesa Inhabilitada</p>
                    </div>
                  ) : (
                    <Button className="w-full h-14 bg-secondary text-secondary-foreground hover:glow-gold font-bold text-lg" onClick={() => onVerPedido(mesa.id)}>VER PEDIDO</Button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground gap-2" onClick={() => onStartEdit(mesa)}>
                      <Edit className="w-4 h-4" /> Editar
                    </Button>
                    <Button variant="outline" className={cn("gap-2", mesa.estado === 'FUERA SERVICIO' ? "border-green-500 text-green-500" : "border-slate-500 text-slate-500")} onClick={() => onToggleFueraServicio(mesa)} disabled={mesa.estado !== 'LIBRE' && mesa.estado !== 'FUERA SERVICIO'}>
                      {mesa.estado === 'FUERA SERVICIO' ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      {mesa.estado === 'FUERA SERVICIO' ? "Habilitar" : "Inhabilitar"}
                    </Button>
                  </div>
                </div>
            </div>
          </DialogContent>
        </Dialog>
    )
}
