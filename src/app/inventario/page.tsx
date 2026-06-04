
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
  DollarSign,
  Edit,
  Trash2,
  Clock
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
import { Estacion, Producto } from "@/lib/types";

export default function InventarioPage() {
  const { productos, adjustStock, addProducto, updateProducto, deleteProducto } = usePOSStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Partial<Producto>>({});
  const { toast } = useToast();

  const [newProduct, setNewProduct] = useState<Partial<Producto>>({
    sku: "",
    nombre: "",
    categoria: "",
    estacion: "COCINA",
    stock: 0,
    stockMinimo: 0,
    precio: 0,
    costoProveedor: 0,
    unidadMedida: "und",
    ubicacion: "",
    fechaVencimiento: "",
    descripcion: ""
  });

  const filteredProducts = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = productos.filter(p => p.stock <= p.stockMinimo).length;
  const criticalStockCount = productos.filter(p => p.stock <= p.stockMinimo / 2).length;
  const expiringCount = productos.filter(p => {
    if (!p.fechaVencimiento) return false;
    const daysUntilExp = (new Date(p.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExp <= 7;
  }).length;

  const handleAdjustStock = (id: string) => {
    const val = parseFloat(editValue);
    if (isNaN(val)) return;
    adjustStock(id, val);
    setEditingId(null);
  };

  const handleCreateProduct = () => {
    if (!newProduct.sku || !newProduct.nombre || !newProduct.categoria || newProduct.stock === undefined || newProduct.stock === null || newProduct.stockMinimo === undefined || newProduct.stockMinimo === null || newProduct.precio === undefined || newProduct.precio === null || newProduct.costoProveedor === undefined || newProduct.costoProveedor === null || !newProduct.unidadMedida || !newProduct.ubicacion || !newProduct.fechaVencimiento) {
      toast({ variant: "destructive", title: "Campos Incompletos", description: "Por favor diligencia todos los campos antes de guardar." });
      return;
    }
    const producto: Producto = {
      id: `p-${Date.now()}`,
      sku: newProduct.sku || "",
      nombre: newProduct.nombre!,
      categoria: newProduct.categoria!,
      estacion: (newProduct.estacion as Estacion) || "COCINA",
      stock: newProduct.stock || 0,
      stockMinimo: newProduct.stockMinimo || 0,
      precio: newProduct.precio || 0,
      costoProveedor: newProduct.costoProveedor || 0,
      unidadMedida: newProduct.unidadMedida || "und",
      ubicacion: newProduct.ubicacion || "",
      fechaVencimiento: newProduct.fechaVencimiento || undefined,
      descripcion: newProduct.descripcion || "",
    };
    addProducto(producto);
    setIsDialogOpen(false);
    setNewProduct({ sku: "", nombre: "", categoria: "", estacion: "COCINA", stock: 0, stockMinimo: 0, precio: 0, costoProveedor: 0, unidadMedida: "und", ubicacion: "", fechaVencimiento: "", descripcion: "" });
    toast({
      title: "Producto Registrado",
      description: `${producto.nombre} añadido al inventario.`,
    });
  };

  const handleOpenEdit = (producto: Producto) => {
    setProductToEdit({ ...producto });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!productToEdit.id || !productToEdit.sku || !productToEdit.nombre || !productToEdit.categoria || productToEdit.stock === undefined || productToEdit.stock === null || productToEdit.stockMinimo === undefined || productToEdit.stockMinimo === null || productToEdit.precio === undefined || productToEdit.precio === null || productToEdit.costoProveedor === undefined || productToEdit.costoProveedor === null || !productToEdit.unidadMedida || !productToEdit.ubicacion || !productToEdit.fechaVencimiento) {
      toast({ variant: "destructive", title: "Campos Incompletos", description: "Por favor diligencia todos los campos antes de guardar." });
      return;
    }
    updateProducto(productToEdit.id, productToEdit);
    setIsEditDialogOpen(false);
    toast({
      title: "Producto Actualizado",
      description: "La información se ha actualizado correctamente.",
    });
  };

  const handleDeleteProducto = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este insumo?")) {
      deleteProducto(id);
      toast({
        variant: "destructive",
        title: "Producto Eliminado",
        description: "El insumo ha sido removido del sistema."
      });
    }
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
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Código / SKU</Label>
                    <Input 
                      placeholder="Ej: PRD-001"
                      value={newProduct.sku} 
                      onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})} 
                      className="bg-background/50 uppercase font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input 
                      placeholder="Ej: Picaña"
                      value={newProduct.nombre} 
                      onChange={(e) => setNewProduct({...newProduct, nombre: e.target.value})} 
                      className="bg-background/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select onValueChange={(val) => setNewProduct({...newProduct, categoria: val})} value={newProduct.categoria}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Seleccione Categoría" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="Verduras">Verduras</SelectItem>
                        <SelectItem value="Proteinas">Proteínas</SelectItem>
                        <SelectItem value="Lacteos">Lácteos</SelectItem>
                        <SelectItem value="Bebidas">Bebidas</SelectItem>
                        <SelectItem value="Abarrotes">Abarrotes</SelectItem>
                        <SelectItem value="Otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unidad de Medida</Label>
                    <Select onValueChange={(val) => setNewProduct({...newProduct, unidadMedida: val})} defaultValue="und">
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Unidad" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                        <SelectItem value="libra">Libra</SelectItem>
                        <SelectItem value="g">Gramos (g)</SelectItem>
                        <SelectItem value="litro">Litros (L)</SelectItem>
                        <SelectItem value="ml">Mililitros (ml)</SelectItem>
                        <SelectItem value="und">Unidades (und)</SelectItem>
                        <SelectItem value="caja">Caja</SelectItem>
                        <SelectItem value="paquete">Paquete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stock Inicial ({newProduct.unidadMedida || 'und'})</Label>
                    <Input 
                      type="number" 
                      value={newProduct.stock} 
                      onChange={(e) => setNewProduct({...newProduct, stock: parseFloat(e.target.value)})} 
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock Mínimo</Label>
                    <Input 
                      type="number" 
                      value={newProduct.stockMinimo} 
                      onChange={(e) => setNewProduct({...newProduct, stockMinimo: parseFloat(e.target.value)})} 
                      className="bg-background/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Costo Proveedor</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input 
                        type="text" 
                        className="pl-8 bg-background/50"
                        value={formatCurrencyInput(newProduct.costoProveedor)} 
                        onChange={(e) => setNewProduct({...newProduct, costoProveedor: parseCurrencyInput(e.target.value)})} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Vencimiento</Label>
                    <Input 
                      type="date" 
                      value={newProduct.fechaVencimiento} 
                      onChange={(e) => setNewProduct({...newProduct, fechaVencimiento: e.target.value})} 
                      className="bg-background/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ubicación Física</Label>
                  <Input 
                    placeholder="Ej: Bodega 1, Nevera A"
                    value={newProduct.ubicacion} 
                    onChange={(e) => setNewProduct({...newProduct, ubicacion: e.target.value})} 
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio de Venta (COP)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-bold">$</span>
                    <Input 
                      type="text" 
                      placeholder="0"
                      className="pl-8 bg-background/50 font-black text-secondary"
                      value={formatCurrencyInput(newProduct.precio)} 
                      onChange={(e) => setNewProduct({...newProduct, precio: parseCurrencyInput(e.target.value)})} 
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

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="bg-card border-border text-foreground paper-texture max-w-[95vw] sm:max-w-[500px] rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline">Editar Insumo</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Código / SKU</Label>
                    <Input 
                      value={productToEdit.sku || ""} 
                      onChange={(e) => setProductToEdit({...productToEdit, sku: e.target.value})} 
                      className="bg-background/50 uppercase font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input 
                      value={productToEdit.nombre || ""} 
                      onChange={(e) => setProductToEdit({...productToEdit, nombre: e.target.value})} 
                      className="bg-background/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select onValueChange={(val) => setProductToEdit({...productToEdit, categoria: val})} value={productToEdit.categoria}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Seleccione Categoría" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="Verduras">Verduras</SelectItem>
                        <SelectItem value="Proteinas">Proteínas</SelectItem>
                        <SelectItem value="Lacteos">Lácteos</SelectItem>
                        <SelectItem value="Bebidas">Bebidas</SelectItem>
                        <SelectItem value="Abarrotes">Abarrotes</SelectItem>
                        <SelectItem value="Otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unidad de Medida</Label>
                    <Select onValueChange={(val) => setProductToEdit({...productToEdit, unidadMedida: val})} value={productToEdit.unidadMedida || "und"}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Unidad" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                        <SelectItem value="libra">Libra</SelectItem>
                        <SelectItem value="g">Gramos (g)</SelectItem>
                        <SelectItem value="litro">Litros (L)</SelectItem>
                        <SelectItem value="ml">Mililitros (ml)</SelectItem>
                        <SelectItem value="und">Unidades (und)</SelectItem>
                        <SelectItem value="caja">Caja</SelectItem>
                        <SelectItem value="paquete">Paquete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stock Actual ({productToEdit.unidadMedida || 'und'})</Label>
                    <Input 
                      type="number" 
                      value={productToEdit.stock ?? 0} 
                      onChange={(e) => setProductToEdit({...productToEdit, stock: parseFloat(e.target.value)})} 
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock Mínimo</Label>
                    <Input 
                      type="number" 
                      value={productToEdit.stockMinimo ?? 0} 
                      onChange={(e) => setProductToEdit({...productToEdit, stockMinimo: parseFloat(e.target.value)})} 
                      className="bg-background/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Costo Proveedor</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input 
                        type="text" 
                        className="pl-8 bg-background/50"
                        value={formatCurrencyInput(productToEdit.costoProveedor)} 
                        onChange={(e) => setProductToEdit({...productToEdit, costoProveedor: parseCurrencyInput(e.target.value)})} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Vencimiento</Label>
                    <Input 
                      type="date" 
                      value={productToEdit.fechaVencimiento || ""} 
                      onChange={(e) => setProductToEdit({...productToEdit, fechaVencimiento: e.target.value})} 
                      className="bg-background/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ubicación Física</Label>
                  <Input 
                    value={productToEdit.ubicacion || ""} 
                    onChange={(e) => setProductToEdit({...productToEdit, ubicacion: e.target.value})} 
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio de Venta (COP)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-bold">$</span>
                    <Input 
                      type="text" 
                      className="pl-8 bg-background/50 font-black text-secondary"
                      value={formatCurrencyInput(productToEdit.precio)} 
                      onChange={(e) => setProductToEdit({...productToEdit, precio: parseCurrencyInput(e.target.value)})} 
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl">Cancelar</Button>
                <Button className="bg-primary font-bold px-8 rounded-xl shadow-lg" onClick={handleSaveEdit}>GUARDAR CAMBIOS</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
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
        <Card className="bg-card border-border border-t-4 border-t-orange-500 shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Clock className="w-12 h-12" /></div>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Por Vencer (7d)</p>
            <h3 className="text-3xl font-black text-orange-500">{expiringCount}</h3>
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
                  <TableCell className="py-4">
                    <div className="font-bold text-foreground flex items-center gap-2">
                      {p.nombre}
                      {(p.fechaVencimiento && (new Date(p.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) <= 7) && (
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]" title="Por vencer o vencido"></div>
                      )}
                      {p.stock <= p.stockMinimo && (
                        <div className="w-2 h-2 rounded-full bg-destructive animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" title="Stock bajo o crítico"></div>
                      )}
                    </div>
                    {p.sku && <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-widest">{p.sku}</div>}
                  </TableCell>
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
                      <div className="flex items-center justify-end gap-1">
                        <span className={cn("text-lg font-black", p.stock <= p.stockMinimo ? "text-destructive" : "text-foreground")}>
                          {p.stock}
                        </span>
                        <span className="text-[10px] text-muted-foreground lowercase">{p.unidadMedida || 'und'}</span>
                      </div>
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
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8 rounded-lg border-border/50 hover:border-primary/50"
                          onClick={() => {setEditingId(p.id); setEditValue(p.stock.toString());}}
                          title="Ajustar Stock Rápidamente"
                        >
                          <TrendingDown className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8 rounded-lg border-border/50 hover:border-primary/50"
                          onClick={() => handleOpenEdit(p)}
                          title="Editar Insumo"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8 rounded-lg border-border/50 hover:border-destructive/50 hover:text-destructive"
                          onClick={() => handleDeleteProducto(p.id)}
                          title="Eliminar Insumo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
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
