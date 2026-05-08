
"use client"

import { AppSidebar } from "@/components/layout/AppSidebar";
import { usePOSStore } from "@/lib/store";
import { 
  Package, 
  Search, 
  AlertTriangle, 
  Plus, 
  Minus, 
  RotateCcw,
  ArrowUpRight,
  TrendingDown,
  Filter
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

export default function InventarioPage() {
  const { productos, adjustStock } = usePOSStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const { toast } = useToast();

  const filteredProducts = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = productos.filter(p => p.stock <= p.stockMinimo).length;
  const criticalStockCount = productos.filter(p => p.stock <= p.stockMinimo / 2).length;

  const handleAdjustStock = (id: string) => {
    const val = parseInt(editValue);
    if (isNaN(val)) return;
    
    adjustStock(id, val);
    setEditingId(null);
    toast({
      title: "Inventario Actualizado",
      description: `El stock se ha actualizado correctamente.`,
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
            <Card className="bg-accent/30 border-border px-4 py-2 flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-mono">Alertas</span>
                <span className="text-xl font-black text-destructive">{lowStockCount}</span>
              </div>
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </Card>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card border-border border-t-4 border-t-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Productos</p>
                  <h3 className="text-2xl font-bold">{productos.length}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Package className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border border-t-4 border-t-yellow-500">
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

          <Card className="bg-card border-border border-t-4 border-t-destructive">
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

        {/* Inventory Table */}
        <Card className="bg-card border-border paper-texture overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-border/50">
            <CardTitle className="text-xl font-headline flex items-center gap-2">
              <Filter className="w-5 h-5 text-secondary" />
              Listado de Insumos
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
                  <TableHead className="font-bold text-secondary">Producto</TableHead>
                  <TableHead className="font-bold text-secondary">Categoría</TableHead>
                  <TableHead className="font-bold text-secondary text-center">Estación</TableHead>
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
                    <TableCell className="text-center font-mono text-xs">{p.estacion}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{p.stockMinimo} kg/un</TableCell>
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
                            className="h-8 bg-primary hover:glow-orange"
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
                          className="h-8 border-primary/50 text-primary hover:bg-primary/10"
                          onClick={() => {
                            setEditingId(p.id);
                            setEditValue(p.stock.toString());
                          }}
                        >
                          Ajustar
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
