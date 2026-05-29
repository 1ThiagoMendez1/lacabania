
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
    toast({
      title: "Producto Registrado",
      description: `${producto.nombre} añadido al inventario.`,
    });
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
            <DialogContent className="bg-card border-border text-foreground paper-texture max-w-[95vw] sm:max-w-[500px] rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline">Nuevo Producto</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input 
                      placeholder="Ej: Picaña"
                      value={newProduct.nombre} 
                      onChange={(e) => setNewProduct({...newProduct, nombre: e.target.value})} 
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Input 
                      placeholder="Ej: Carnes"
                      value={newProduct.categoria} 
                      onChange={(e) => setNewProduct({...newProduct, categoria: e.target.value})} 
                      className="bg-background/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Estación de Destino</Label>
                  <Select onValueChange={(val) => setNewProduct({...newProduct, estacion: val as Estacion})} defaultValue="COCINA">
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Estación" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="ASADO">Asado</SelectItem>
                      <SelectItem value="PARRILLA">Parrilla</SelectItem>
                      <SelectItem value="COCINA">Cocina</SelectItem>
                      <SelectItem value="BAR">Bar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stock Inicial</Label>
                    <Input 
                      type="number" 
                      value={newProduct.stock} 
                      onChange={(e) => setNewProduct({...newProduct, stock: parseFloat(e.target.value)})} 
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock Mínimo (Alerta)</Label>
                    <Input 
                      type="number" 
                      value={newProduct.stockMinimo} 
                      onChange={(e) => setNewProduct({...newProduct, stockMinimo: parseFloat(e.target.value)})} 
                      className="bg-background/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Precio de Venta (COP)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-bold">COP $</span>
                    <Input 
                      type="number" 
                      placeholder="0"
                      className="pl-14 bg-background/50 font-black text-secondary"
                      value={newProduct.precio} 
                      onChange={(e) => setNewProduct({...newProduct, precio: parseFloat(e.target.value)})} 
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">El valor se guardará en pesos colombianos.</p>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancelar</Button>
                <Button className="bg-primary font-bold px-8 rounded-xl shadow-lg glow-orange" onClick={handleCreateProduct}>GUARDAR PRODUCTO</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-card border-border border-t-4 border-t-primary shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Package className="w-12 h-12" /></div>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Total Insumos</p>
            <h3 className="text-3xl font-black">{productos.length}</h3>
          </CardContent>
        </Card>
        <Card className="bg-card border-border border-t-4 border-t-yellow-500 shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingDown className="w-12 h-12" /></div>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Stock Bajo</p>
            <h3 className="text-3xl font-black text-yellow-500">{lowStockCount}</h3>
          </CardContent>
        </Card>
        <Card className="bg-card border-border border-t-4 border-t-destructive shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle className="w-12 h-12" /></div>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Stock Crítico</p>
            <h3 className="text-3xl font-black text-destructive">{criticalStockCount}</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border paper-texture overflow-hidden shadow-2xl rounded-[2rem]">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border/50 gap-4 p-6">
          <CardTitle className="text-xl font-headline">Inventario y Precios</CardTitle>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar insumo o categoría..." 
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
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Insumo</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Categoría</TableHead>
                <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest">Precio (COP)</TableHead>
                <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest">Actual</TableHead>
                <TableHead className="text-center font-bold uppercase text-[10px] tracking-widest">Estado</TableHead>
                <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p) => (
                <TableRow key={p.id} className="border-border hover:bg-accent/20 transition-colors">
                  <TableCell className="font-bold py-4">{p.nombre}</TableCell>
                  <TableCell><Badge variant="secondary" className="bg-accent/50">{p.categoria}</Badge></TableCell>
                  <TableCell className="text-right font-black text-secondary">
                    ${p.precio.toLocaleString('es-CO')}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === p.id ? (
                      <Input 
                        type="number" 
                        className="w-20 h-8 ml-auto text-right bg-background" 
                        value={editValue} 
                        onChange={(e) => setEditValue(e.target.value)} 
                        autoFocus 
                      />
                    ) : (
                      <span className={cn("text-lg font-black", p.stock <= p.stockMinimo ? "text-destructive" : "text-foreground")}>
                        {p.stock}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{getStockBadge(p.stock, p.stockMinimo)}</TableCell>
                  <TableCell className="text-right">
                    {editingId === p.id ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" className="bg-primary h-8" onClick={() => handleAdjustStock(p.id)}>OK</Button>
                        <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingId(null)}>
                          <RotateCcw className="w-4 h-4"/>
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 rounded-lg border-border/50 hover:border-primary/50"
                        onClick={() => {setEditingId(p.id); setEditValue(p.stock.toString());}}
                      >
                        Ajustar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredProducts.length === 0 && (
            <div className="py-12 text-center text-muted-foreground italic text-sm">
              No se encontraron insumos que coincidan con la búsqueda.
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
