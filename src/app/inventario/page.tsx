
"use client"

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
  };

  const handleCreateProduct = () => {
    if (!newProduct.nombre || !newProduct.precio) return;
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
    setNewProduct({ nombre: "", categoria: "", estacion: "COCINA", stock: 0, stockMinimo: 0, precio: 0, descripcion: "" });
  };

  const getStockBadge = (stock: number, min: number) => {
    if (stock <= min / 2) return <Badge className="bg-destructive font-bold">CRÍTICO</Badge>;
    if (stock <= min) return <Badge className="bg-yellow-500 text-black font-bold">BAJO</Badge>;
    return <Badge variant="outline" className="border-green-500 text-green-500 font-bold">ÓPTIMO</Badge>;
  };

  return (
    <main className="p-8">
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
                <PlusCircle className="w-5 h-5" /> Registrar Insumo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground">
              <DialogHeader><DialogTitle className="text-2xl font-headline">Nuevo Producto</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Nombre</Label><Input value={newProduct.nombre} onChange={(e) => setNewProduct({...newProduct, nombre: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Categoría</Label><Input value={newProduct.categoria} onChange={(e) => setNewProduct({...newProduct, categoria: e.target.value})} /></div>
                </div>
                <div className="space-y-2">
                  <Label>Estación</Label>
                  <Select onValueChange={(val) => setNewProduct({...newProduct, estacion: val as Estacion})} defaultValue="COCINA">
                    <SelectTrigger><SelectValue placeholder="Estación" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="ASADO">Asado</SelectItem>
                      <SelectItem value="PARRILLA">Parrilla</SelectItem>
                      <SelectItem value="COCINA">Cocina</SelectItem>
                      <SelectItem value="BAR">Bar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Stock</Label><Input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: parseFloat(e.target.value)})} /></div>
                  <div className="space-y-2"><Label>Mínimo</Label><Input type="number" value={newProduct.stockMinimo} onChange={(e) => setNewProduct({...newProduct, stockMinimo: parseFloat(e.target.value)})} /></div>
                </div>
                <div className="space-y-2"><Label>Precio de Venta</Label><Input type="number" value={newProduct.precio} onChange={(e) => setNewProduct({...newProduct, precio: parseFloat(e.target.value)})} /></div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button className="bg-primary font-bold" onClick={handleCreateProduct}>GUARDAR</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-card border-border border-t-4 border-t-primary shadow-lg">
          <CardContent className="pt-6 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Total Insumos</p><h3 className="text-2xl font-bold">{productos.length}</h3></div>
            <Package className="w-6 h-6 text-primary" />
          </CardContent>
        </Card>
        <Card className="bg-card border-border border-t-4 border-t-yellow-500 shadow-lg">
          <CardContent className="pt-6 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Stock Bajo</p><h3 className="text-2xl font-bold text-yellow-500">{lowStockCount}</h3></div>
            <TrendingDown className="w-6 h-6 text-yellow-500" />
          </CardContent>
        </Card>
        <Card className="bg-card border-border border-t-4 border-t-destructive shadow-lg">
          <CardContent className="pt-6 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Crítico</p><h3 className="text-2xl font-bold text-destructive">{criticalStockCount}</h3></div>
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border paper-texture overflow-hidden shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50">
          <CardTitle className="text-xl font-headline">Inventario y Precios</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar..." className="pl-10 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-accent/50">
              <TableRow className="border-border">
                <TableHead>Insumo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p) => (
                <TableRow key={p.id} className="border-border hover:bg-accent/20">
                  <TableCell className="font-bold">{p.nombre}</TableCell>
                  <TableCell><Badge variant="secondary">{p.categoria}</Badge></TableCell>
                  <TableCell className="text-right font-black text-secondary">${p.precio.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {editingId === p.id ? (
                      <Input type="number" className="w-20 h-8 ml-auto text-right" value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus />
                    ) : (
                      <span className={cn("text-lg font-black", p.stock <= p.stockMinimo ? "text-destructive" : "text-foreground")}>{p.stock}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{getStockBadge(p.stock, p.stockMinimo)}</TableCell>
                  <TableCell className="text-right">
                    {editingId === p.id ? (
                      <div className="flex justify-end gap-2"><Button size="sm" onClick={() => handleAdjustStock(p.id)}>OK</Button><Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><RotateCcw className="w-4 h-4"/></Button></div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => {setEditingId(p.id); setEditValue(p.stock.toString());}}>Ajustar</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
