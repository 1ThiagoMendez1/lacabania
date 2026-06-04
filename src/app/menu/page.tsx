"use client"

import { usePOSStore } from "@/lib/store";
import { 
  Search, 
  PlusCircle,
  RotateCcw,
  ClipboardList,
  Utensils,
  Pencil
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn, formatCurrencyInput, parseCurrencyInput } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Estacion, MenuItem } from "@/lib/types";

export default function MenuPage() {
  const { menuItems, addMenuItem, updateMenuItem } = usePOSStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const [itemToEdit, setItemToEdit] = useState<Partial<MenuItem>>({});

  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    nombre: "",
    categoria: "",
    estacion: "COCINA",
    precio: 0,
    descripcion: "",
    disponible: true
  });

  const filteredItems = menuItems.filter(m => 
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateMenuItem = () => {
    if (!newItem.nombre || !newItem.categoria || !newItem.estacion || newItem.precio === undefined || newItem.precio === null) {
      toast({ variant: "destructive", title: "Campos Incompletos", description: "Por favor diligencia todos los campos antes de guardar." });
      return;
    }
    const menuItem: MenuItem = {
      id: `m-${Date.now()}`, // Se sobrescribirá con UUID en el store
      nombre: newItem.nombre!,
      categoria: newItem.categoria!,
      estacion: (newItem.estacion as Estacion) || "COCINA",
      precio: newItem.precio || 0,
      descripcion: newItem.descripcion || "",
      disponible: newItem.disponible !== false
    };
    addMenuItem(menuItem);
    setIsDialogOpen(false);
    setNewItem({ nombre: "", categoria: "", estacion: "COCINA", precio: 0, descripcion: "", disponible: true });
    toast({
      title: "Plato Registrado",
      description: `${menuItem.nombre} añadido al Menú Carta.`,
    });
  };

  const handleEditMenuItem = () => {
    if (!itemToEdit.id || !itemToEdit.nombre || !itemToEdit.categoria || !itemToEdit.estacion || itemToEdit.precio === undefined || itemToEdit.precio === null) {
      toast({ variant: "destructive", title: "Campos Incompletos", description: "Por favor diligencia todos los campos antes de guardar." });
      return;
    }
    updateMenuItem(itemToEdit.id, {
      nombre: itemToEdit.nombre,
      categoria: itemToEdit.categoria,
      estacion: itemToEdit.estacion,
      precio: itemToEdit.precio,
      descripcion: itemToEdit.descripcion,
      disponible: itemToEdit.disponible
    });
    setIsEditDialogOpen(false);
    toast({
      title: "Plato Actualizado",
      description: `${itemToEdit.nombre} ha sido modificado.`,
    });
  };

  const openEditDialog = (item: MenuItem) => {
    setItemToEdit(item);
    setIsEditDialogOpen(true);
  };

  const toggleAvailability = (id: string, current: boolean) => {
    updateMenuItem(id, { disponible: !current });
    toast({
      title: "Disponibilidad Actualizada",
      description: `El plato ahora está ${!current ? 'Disponible' : 'Agotado'}.`,
    });
  };

  return (
    <main className="p-8">
      <header className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ClipboardList className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-headline text-foreground">Menú Carta</h2>
          </div>
          <p className="text-muted-foreground">Gestión de Platos y Bebidas a la venta 🤠</p>
        </div>
        
        <div className="flex gap-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:glow-orange font-bold gap-2 text-white">
                <PlusCircle className="w-5 h-5" /> Agregar Plato
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground paper-texture max-w-[95vw] sm:max-w-[500px] rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline">Nuevo Plato / Bebida</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre del Plato</Label>
                    <Input 
                      placeholder="Ej: Picaña 500g"
                      value={newItem.nombre} 
                      onChange={(e) => setNewItem({...newItem, nombre: e.target.value})} 
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Input 
                      placeholder="Ej: Cortes"
                      value={newItem.categoria} 
                      onChange={(e) => setNewItem({...newItem, categoria: e.target.value})} 
                      className="bg-background/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Impresora / Área de Destino</Label>
                  <Select onValueChange={(val) => setNewItem({...newItem, estacion: val as Estacion})} defaultValue="COCINA">
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Seleccionar Impresora" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="ASADO">Asado (Impresora Asados)</SelectItem>
                      <SelectItem value="PARRILLA">Parrilla (Impresora Parrilla)</SelectItem>
                      <SelectItem value="COCINA">Cocina (Impresora Cocina)</SelectItem>
                      <SelectItem value="BAR">Bar (Impresora Bar)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground italic">Determina a qué impresora física se enviará el ticket al marchar un pedido.</p>
                </div>
                <div className="space-y-2">
                  <Label>Precio de Venta (COP)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-bold">$</span>
                    <Input 
                      type="text" 
                      placeholder="0"
                      className="pl-8 bg-background/50 font-black text-secondary"
                      value={formatCurrencyInput(newItem.precio)} 
                      onChange={(e) => setNewItem({...newItem, precio: parseCurrencyInput(e.target.value)})} 
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-accent/20 rounded-xl border border-border/50">
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold">Disponible para Venta</Label>
                    <p className="text-[10px] text-muted-foreground">Permite que los meseros lo vean en el sistema.</p>
                  </div>
                  <Switch 
                    checked={newItem.disponible} 
                    onCheckedChange={(c) => setNewItem({...newItem, disponible: c})}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancelar</Button>
                <Button className="bg-primary font-bold px-8 rounded-xl shadow-lg glow-orange" onClick={handleCreateMenuItem}>GUARDAR EN MENÚ</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="bg-card border-border text-foreground paper-texture max-w-[95vw] sm:max-w-[500px] rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline">Editar Plato / Bebida</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre del Plato</Label>
                    <Input 
                      placeholder="Ej: Picaña 500g"
                      value={itemToEdit.nombre || ""} 
                      onChange={(e) => setItemToEdit({...itemToEdit, nombre: e.target.value})} 
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Input 
                      placeholder="Ej: Cortes"
                      value={itemToEdit.categoria || ""} 
                      onChange={(e) => setItemToEdit({...itemToEdit, categoria: e.target.value})} 
                      className="bg-background/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Impresora / Área de Destino</Label>
                  <Select onValueChange={(val) => setItemToEdit({...itemToEdit, estacion: val as Estacion})} value={itemToEdit.estacion}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Seleccionar Impresora" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="ASADO">Asado (Impresora Asados)</SelectItem>
                      <SelectItem value="PARRILLA">Parrilla (Impresora Parrilla)</SelectItem>
                      <SelectItem value="COCINA">Cocina (Impresora Cocina)</SelectItem>
                      <SelectItem value="BAR">Bar (Impresora Bar)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground italic">Determina a qué impresora física se enviará el ticket al marchar un pedido.</p>
                </div>
                <div className="space-y-2">
                  <Label>Precio de Venta (COP)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-bold">$</span>
                    <Input 
                      type="text" 
                      placeholder="0"
                      className="pl-8 bg-background/50 font-black text-secondary"
                      value={formatCurrencyInput(itemToEdit.precio)} 
                      onChange={(e) => setItemToEdit({...itemToEdit, precio: parseCurrencyInput(e.target.value)})} 
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl">Cancelar</Button>
                <Button className="bg-primary font-bold px-8 rounded-xl shadow-lg glow-orange" onClick={handleEditMenuItem}>GUARDAR CAMBIOS</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Card className="bg-card border-border paper-texture overflow-hidden shadow-2xl rounded-[2rem]">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border/50 gap-4 p-6">
          <CardTitle className="text-xl font-headline">Platos y Bebidas Activas</CardTitle>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar en el menú..." 
              className="pl-10 bg-background/50 rounded-xl" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader className="bg-accent/50">
              <TableRow className="border-border">
                <TableHead className="font-bold uppercase text-[10px] tracking-widest pl-6">Plato / Bebida</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Categoría</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Se prepara en</TableHead>
                <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest">Precio Venta (COP)</TableHead>
                <TableHead className="text-center font-bold uppercase text-[10px] tracking-widest pr-6">Disponibilidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((m) => (
                <TableRow key={m.id} className={cn("border-border transition-colors", !m.disponible && "opacity-50 grayscale")}>
                  <TableCell className="font-bold py-4 pl-6">{m.nombre}</TableCell>
                  <TableCell><Badge variant="secondary" className="bg-accent/50">{m.categoria}</Badge></TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{m.estacion}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-black text-secondary">
                    ${m.precio.toLocaleString('es-CO')}
                  </TableCell>
                  <TableCell className="text-center pr-6">
                    <div className="flex items-center justify-center gap-2">
                      <Switch 
                        checked={m.disponible} 
                        onCheckedChange={() => toggleAvailability(m.id, m.disponible)}
                        className="data-[state=checked]:bg-green-500"
                      />
                      <span className={cn("text-[9px] font-bold w-12 text-left", m.disponible ? "text-green-500" : "text-destructive")}>
                        {m.disponible ? 'ACTIVO' : 'AGOTADO'}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 hover:bg-accent hover:text-accent-foreground" onClick={() => openEditDialog(m)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredItems.length === 0 && (
            <div className="py-20 flex flex-col items-center text-center text-muted-foreground opacity-50 space-y-4">
              <Utensils className="w-12 h-12" />
              <div>
                <p className="font-headline text-lg">El Menú está vacío</p>
                <p className="text-xs">Agrega platos y bebidas para que los meseros puedan tomar pedidos.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
