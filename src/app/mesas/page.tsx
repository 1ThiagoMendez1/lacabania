"use client"

import { AppSidebar } from "@/components/layout/AppSidebar";
import { usePOSStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, Users, UtensilsCrossed, PlusCircle, Settings, Edit, Ban, CheckCircle, Layers } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { useState } from "react";
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
import { Mesa } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MesasPage() {
  const { mesas, updateMesaEstado, updateMesa, addMesa, user } = usePOSStore();
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
      case 'LIBRE': return 'bg-green-500/20 border-green-500 text-green-500';
      case 'OCUPADA': return 'bg-red-500/20 border-red-500 text-red-500';
      case 'EN PEDIDO': return 'bg-yellow-500/20 border-yellow-500 text-yellow-500';
      case 'LISTA PAGAR': return 'bg-orange-500/20 border-orange-500 text-orange-500';
      case 'RESERVADA': return 'bg-blue-500/20 border-blue-500 text-blue-500';
      case 'FUERA SERVICIO': return 'bg-slate-500/20 border-slate-500 text-slate-500 opacity-60 grayscale';
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

  const handleAddMesa = () => {
    const mesaId = parseInt(newMesa.id);
    if (isNaN(mesaId)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El número de mesa debe ser un número válido."
      });
      return;
    }

    if (mesas.some(m => m.id === mesaId)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El número de mesa ya existe."
      });
      return;
    }

    const mesa: Mesa = {
      id: mesaId,
      numero: mesaId,
      zona: newMesa.zona,
      capacidad: newMesa.capacidad,
      estado: 'LIBRE'
    };

    addMesa(mesa);
    setIsAddMesaOpen(false);
    setNewMesa({ id: "", zona: "Primer Piso", capacidad: 4 });
    toast({
      title: "Mesa Agregada",
      description: `Mesa ${mesaId} registrada en ${newMesa.zona}.`
    });
  };

  const handleStartEdit = (mesa: Mesa) => {
    setEditMesa({ ...mesa });
    setIsEditMode(true);
  };

  const handleSaveEdit = () => {
    if (!selectedMesaId || !editMesa.id) return;
    
    updateMesa(selectedMesaId, {
      zona: editMesa.zona as any,
      capacidad: editMesa.capacidad,
      numero: editMesa.numero,
      estado: editMesa.estado
    });
    
    setIsEditMode(false);
    toast({
      title: "Mesa Actualizada",
      description: `La información de la mesa ha sido corregida.`
    });
  };

  const toggleFueraServicio = (mesa: Mesa) => {
    const nuevoEstado = mesa.estado === 'FUERA SERVICIO' ? 'LIBRE' : 'FUERA SERVICIO';
    updateMesaEstado(mesa.id, nuevoEstado);
    toast({
      title: nuevoEstado === 'FUERA SERVICIO' ? "Mesa Inhabilitada" : "Mesa Habilitada",
      description: `La mesa ${mesa.id} ahora está ${nuevoEstado.toLowerCase()}.`
    });
  };

  const mesasPlanta1 = mesas.filter(m => m.zona === 'Primer Piso');
  const mesasPlanta2 = mesas.filter(m => m.zona === 'Segundo Piso');

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
            <Dialog open={isAddMesaOpen} onOpenChange={setIsAddMesaOpen}>
              <DialogTrigger asChild>
                <Button className="bg-secondary text-secondary-foreground hover:glow-gold font-bold gap-2">
                  <PlusCircle className="w-5 h-5" />
                  Agregar Nueva Mesa
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border text-foreground sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-headline">Nueva Mesa</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="id" className="text-right">Número</Label>
                    <Input
                      id="id"
                      type="number"
                      className="col-span-3"
                      value={newMesa.id}
                      onChange={(e) => setNewMesa({ ...newMesa, id: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="zona" className="text-right">Zona</Label>
                    <Select 
                      onValueChange={(v) => setNewMesa({ ...newMesa, zona: v as any })}
                      defaultValue={newMesa.zona}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecciona Piso" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="Primer Piso">Primer Piso</SelectItem>
                        <SelectItem value="Segundo Piso">Segundo Piso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="capacidad" className="text-right">Capacidad</Label>
                    <Input
                      id="capacidad"
                      type="number"
                      className="col-span-3"
                      value={newMesa.capacidad}
                      onChange={(e) => setNewMesa({ ...newMesa, capacidad: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsAddMesaOpen(false)}>Cancelar</Button>
                  <Button className="bg-primary font-bold" onClick={handleAddMesa}>CREAR MESA</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="flex gap-4 bg-accent/30 px-4 py-2 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs">Libre</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-500" />
                <span className="text-xs">Fuera Serv.</span>
              </div>
            </div>
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
                <MesaCard key={mesa.id} mesa={mesa} onOpenMesa={handleOpenMesa} onVerPedido={handleVerPedido} onStartEdit={handleStartEdit} onToggleFueraServicio={toggleFueraServicio} getStatusColor={getStatusColor} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="piso2">
            {mesasPlanta2.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-3xl opacity-40">
                  <Layers className="w-12 h-12 mb-4" />
                  <p className="font-headline text-xl">No hay mesas en el segundo piso</p>
                  <p className="text-sm">Agrega mesas seleccionando el "Segundo Piso"</p>
               </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {mesasPlanta2.map((mesa) => (
                  <MesaCard key={mesa.id} mesa={mesa} onOpenMesa={handleOpenMesa} onVerPedido={handleVerPedido} onStartEdit={handleStartEdit} onToggleFueraServicio={toggleFueraServicio} getStatusColor={getStatusColor} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Re-use of Edit/Management Dialog logic through the child components */}
        <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
            <DialogContent className="bg-card border-border text-foreground">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-headline">
                    Editando Mesa {editMesa.id}
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Zona</Label>
                      <Select 
                        onValueChange={(v) => setEditMesa({ ...editMesa, zona: v as any })}
                        defaultValue={editMesa.zona}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Piso" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="Primer Piso">Primer Piso</SelectItem>
                          <SelectItem value="Segundo Piso">Segundo Piso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Capacidad</Label>
                      <Input
                        type="number"
                        value={editMesa.capacidad}
                        onChange={(e) => setEditMesa({ ...editMesa, capacidad: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button variant="ghost" className="flex-1" onClick={() => setIsEditMode(false)}>Cancelar</Button>
                      <Button className="bg-primary flex-1 font-bold" onClick={handleSaveEdit}>GUARDAR CAMBIOS</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function MesaCard({ mesa, onOpenMesa, onVerPedido, onStartEdit, onToggleFueraServicio, getStatusColor }: any) {
    return (
        <Dialog>
          <DialogTrigger asChild>
            <button
              className={cn(
                "relative group h-40 rounded-2xl border-2 transition-all duration-300 p-4 flex flex-col items-center justify-between wood-texture overflow-hidden",
                getStatusColor(mesa.estado),
                mesa.estado === 'OCUPADA' || mesa.estado === 'EN PEDIDO' ? "glow-orange" : "hover:scale-105"
              )}
            >
              <div className="absolute top-0 right-0 p-2 opacity-10">
                {mesa.estado === 'FUERA SERVICIO' ? <Ban className="w-12 h-12" /> : <UtensilsCrossed className="w-12 h-12" />}
              </div>
              
              <div className="w-full flex justify-between items-start">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-background/50 border border-current">
                  {mesa.zona}
                </span>
                {mesa.estado !== 'LIBRE' && mesa.estado !== 'FUERA SERVICIO' && (
                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    <Clock className="w-3 h-3" />
                    <span>12m</span>
                  </div>
                )}
                {mesa.estado === 'FUERA SERVICIO' && (
                   <Badge variant="outline" className="text-[8px] border-slate-500 text-slate-500 font-bold">MANTENIMIENTO</Badge>
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
                    <p className={cn("font-bold text-lg", mesa.estado === 'FUERA SERVICIO' ? 'text-slate-500' : 'text-secondary')}>
                      {mesa.estado}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {mesa.estado === 'LIBRE' ? (
                    <Button 
                      className="w-full h-16 text-lg bg-primary hover:glow-orange font-bold rounded-xl"
                      onClick={() => onOpenMesa(mesa.id)}
                    >
                      ABRIR MESA
                    </Button>
                  ) : mesa.estado === 'FUERA SERVICIO' ? (
                    <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl text-center">
                       <Ban className="w-8 h-8 text-destructive mx-auto mb-2" />
                       <p className="text-sm font-bold text-destructive">Esta mesa no puede recibir pedidos</p>
                    </div>
                  ) : (
                    <Button 
                      className="w-full h-14 bg-secondary text-secondary-foreground hover:glow-gold font-bold text-lg"
                      onClick={() => onVerPedido(mesa.id)}
                    >
                      VER PEDIDO
                    </Button>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="border-border text-muted-foreground hover:text-foreground gap-2"
                      onClick={() => onStartEdit(mesa)}
                    >
                      <Edit className="w-4 h-4" />
                      Editar Detalles
                    </Button>
                    <Button 
                      variant="outline" 
                      className={cn(
                        "gap-2",
                        mesa.estado === 'FUERA SERVICIO' 
                          ? "border-green-500 text-green-500 hover:bg-green-500/10" 
                          : "border-slate-500 text-slate-500 hover:bg-slate-500/10"
                      )}
                      onClick={() => onToggleFueraServicio(mesa)}
                      disabled={mesa.estado !== 'LIBRE' && mesa.estado !== 'FUERA SERVICIO'}
                    >
                      {mesa.estado === 'FUERA SERVICIO' ? (
                        <><CheckCircle className="w-4 h-4" /> Habilitar</>
                      ) : (
                        <><Ban className="w-4 h-4" /> Inhabilitar</>
                      )}
                    </Button>
                  </div>
                </div>
            </div>
          </DialogContent>
        </Dialog>
    )
}
