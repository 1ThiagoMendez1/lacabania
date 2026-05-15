
"use client"

import { AppSidebar } from "@/components/layout/AppSidebar";
import { usePOSStore } from "@/lib/store";
import { 
  Package, 
  Search, 
  AlertTriangle, 
  Plus, 
  RotateCcw,
  TrendingDown,
  Filter,
  PlusCircle,
  Utensils,
  DollarSign
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
import { cn } from "@/lib/utils";
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
import { Estacion, Producto } from "@/lib/types";

export default function InventarioPage() {
  const { productos, adjustStock, addProducto } = usePOSStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newProduct, setNewProduct] = useState<Partial<Producto>>({
    nombre: "",
    categoria: "",
    estacion: "COCINA",
    stock: 0,
    stockMinimo: 0,
    precio: 0,
    descripcion: ""
  });

  const filteredProducts = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = productos.filter(p => p.stock <= p.stockMinimo).length;
  const criticalStockCount = productos.filter(p => p.stock <= p.stockMinimo / 2).length;

  const handleAdjustStock = (id: string) => {
    const val = parseFloat(editValue);
    if (isNaN(val)) return;
    
    adjustStock(id, val);
    setEditingId(null);
    toast({
      title: "Inventario Actualizado",
      description: `El stock se ha actualizado correctamente.`,
    });
  };

  const handleCreateProduct = () => {
    if (!newProduct.nombre || !newProduct.categoria || !newProduct.precio) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre, categoría y precio son obligatorios.",
      });
      return;
    }

    const producto: Producto = {
      id: `p-${Date.now()}`,
      nombre: newProduct.nombre!,
      categoria: newProduct.categoria!,
      estacion: (newProduct.estacion as Estacion) || "COCINA",
      stock: newProduct.stock || 0,
      stockMinimo: newProduct.stockMinimo || 0,
      precio: newProduct.precio || 0,
      descripcion: newProduct.descripcion || "",
    };

    addProducto(producto);
    setIsDialogOpen(false);
    setNewProduct({
      nombre: "",
      categoria: "",
      estacion: "COCINA",
      stock: 0,
      stockMinimo: 0,
      precio: 0,
      descripcion: ""
    });

    toast({
      title: "Producto Registrado",
      description: `${producto.nombre} ha sido añadido al inventario.`,
    });
  };

  const getStockBadge = (stock: number, min: number) => {
    if (stock <= min / 2) return <Badge className="bg-destructive hover:bg-destructive/80 font-bold">CRÍTICO</Badge>;
    if (stock <= min) return <Badge className="bg-yellow-500 hover:bg-yellow-500/80 text-black font-bold">BAJO</Badge>;
    return <Badge variant="outline" className="border-green-500 text-green-500 font-bold">ÓPTIMO</Badge>;
  };

  return (
    <div className="flex bg-background min-h-screen">
      <AppSidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-headline text-foreground">Gestión de Inventario</h2>
            </div>
            <p className="text-muted-foreground">Control de stock e insumos para la operación 🤠</p>
          </div>
          
          <div className="flex gap-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-secondary text-secondary-foreground hover:glow-gold font-bold gap-2">
                  <PlusCircle className="w-5 h-5" />
                  Registrar Nuevo Insumo
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border text-foreground sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-headline flex items-center gap-2">
                    <Plus className="w-6 h-6 text-primary" />
                    Nuevo Producto / Insumo
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre</Label>
                      <Input 
                        id="name" 
                        placeholder="Ej: Punta de Anca" 
                        value={newProduct.nombre}
                        onChange={(e) => setNewProduct({...newProduct, nombre: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoría</Label>
                      <Input 
                        id="category" 
                        placeholder="Ej: Carnes" 
                        value={newProduct.categoria}
                        onChange={(e) => setNewProduct({...newProduct, categoria: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="station">Estación</Label>
                    <Select 
                      onValueChange={(val) => setNewProduct({...newProduct, estacion: val as Estacion})}
                      defaultValue="COCINA"
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Seleccionar Estación" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="ASADO">Asado (Barril)</SelectItem>
                        <SelectItem value="PARRILLA">Parrilla</SelectItem>
                        <SelectItem value="COCINA">Cocina General</SelectItem>
                        <SelectItem value="BAR">Bar / Bebidas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock Inicial (kg/un)</Label>
                      <Input 
                        id="stock" 
                        type="number"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({...newProduct, stock: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="min-stock">Stock Mínimo (Alerta)</Label>
                      <Input 
                        id="min-stock" 
                        type="number"
                        value={newProduct.stockMinimo}
                        onChange={(e) => setNewProduct({...newProduct, stockMinimo: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-secondary font-bold flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Precio de Venta ($)
                    </Label>
                    <Input 
                      id="price" 
                      type="number"
                      placeholder="Ej: 85000"
                      className="border-secondary/50 focus:ring-secondary"
                      value={newProduct.precio}
                      onChange={(e) => setNewProduct({...newProduct, precio: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button className="bg-primary hover:glow-orange font-bold" onClick={handleCreateProduct}>
                    GUARDAR INSUMO
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Card className="bg-accent/30 border-border px-4 py-2 flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-mono">Alertas</span>
                <span className="text-xl font-black text-destructive">{lowStockCount}</span>
              </div>
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </Card>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card border-border border-t-4 border-t-primary shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Insumos</p>
                  <h3 className="text-2xl font-bold">{productos.length}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Package className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border border-t-4 border-t-yellow-500 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stock Bajo</p>
                  <h3 className="text-2xl font-bold text-yellow-500">{lowStockCount}</h3>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-full">
                  <TrendingDown className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border border-t-4 border-t-destructive shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Crítico</p>
                  <h3 className="text-2xl font-bold text-destructive">{criticalStockCount}</h3>
                </div>
                <div className="p-3 bg-destructive/10 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border paper-texture overflow-hidden shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-border/50">
            <CardTitle className="text-xl font-headline flex items-center gap-2">
              <Filter className="w-5 h-5 text-secondary" />
              Inventario y Precios
            </CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o categoría..." 
                className="pl-10 bg-background border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-accent/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-bold text-secondary">Insumo</TableHead>
                  <TableHead className="font-bold text-secondary">Categoría</TableHead>
                  <TableHead className="font-bold text-secondary text-center">Estación</TableHead>
                  <TableHead className="font-bold text-secondary text-right bg-secondary/10">Precio Venta</TableHead>
                  <TableHead className="font-bold text-secondary text-right">Mínimo</TableHead>
                  <TableHead className="font-bold text-secondary text-right">Actual</TableHead>
                  <TableHead className="font-bold text-secondary text-center">Estado</TableHead>
                  <TableHead className="font-bold text-secondary text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((p) => (
                  <TableRow key={p.id} className="border-border hover:bg-accent/20 transition-colors">
                    <TableCell className="font-bold">{p.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-accent text-[10px]">{p.categoria}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono text-[10px]">{p.estacion}</TableCell>
                    <TableCell className="text-right font-black text-secondary bg-secondary/5">
                      ${p.precio.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">{p.stockMinimo} kg/un</TableCell>
                    <TableCell className="text-right">
                      {editingId === p.id ? (
                        <div className="flex justify-end gap-2">
                          <Input 
                            type="number" 
                            className="w-20 h-8 text-right font-bold"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span className={cn(
                          "text-lg font-black",
                          p.stock <= p.stockMinimo ? "text-destructive" : "text-foreground"
                        )}>
                          {p.stock}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStockBadge(p.stock, p.stockMinimo)}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === p.id ? (
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            className="h-8 bg-primary hover:glow-orange text-[10px]"
                            onClick={() => handleAdjustStock(p.id)}
                          >
                            Guardar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8"
                            onClick={() => setEditingId(null)}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 border-primary/50 text-primary hover:bg-primary/10 text-[10px]"
                          onClick={() => {
                            setEditingId(p.id);
                            setEditValue(p.stock.toString());
                          }}
                        >
                          Ajustar Stock
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
