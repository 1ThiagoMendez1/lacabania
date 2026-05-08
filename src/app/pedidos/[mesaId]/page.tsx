"use client"

import { AppSidebar } from "@/components/layout/AppSidebar";
import { usePOSStore } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  ChevronLeft,
  Search,
  ShoppingCart,
  Utensils
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ItemOrden, Producto } from "@/lib/types";

export default function OrderPage() {
  const { mesaId } = useParams();
  const router = useRouter();
  const { productos, mesas, addOrden, updateMesaEstado, user, ordenes } = usePOSStore();
  
  const mesa = mesas.find(m => m.id === Number(mesaId));
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODOS");
  
  // Local state for the "draft" order
  const [cart, setCart] = useState<{producto: Producto, cantidad: number}[]>([]);

  const categories = ["TODOS", ...new Set(productos.map(p => p.categoria))];

  const filteredProducts = productos.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "TODOS" || p.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Producto) => {
    setCart(prev => {
      const existing = prev.find(item => item.producto.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.producto.id === product.id 
            ? { ...item, cantidad: item.cantidad + 1 } 
            : item
        );
      }
      return [...prev, { producto: product, cantidad: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.producto.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.producto.id === productId) {
        const newQty = Math.max(1, item.cantidad + delta);
        return { ...item, cantidad: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);

  const handleSendOrder = () => {
    if (cart.length === 0) return;

    const newItems: ItemOrden[] = cart.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      productoId: item.producto.id,
      nombre: item.producto.nombre,
      cantidad: item.cantidad,
      precioUnitario: item.producto.precio,
      estacion: item.producto.estacion,
      estado: 'PENDIENTE',
      createdAt: new Date().toISOString()
    }));

    const newOrden = {
      id: `ORD-${Date.now()}`,
      mesaId: Number(mesaId),
      meseroId: user?.id || 'unknown',
      items: newItems,
      estado: 'ABIERTA' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addOrden(newOrden);
    updateMesaEstado(Number(mesaId), 'EN PEDIDO', user?.id);
    router.push('/mesas');
  };

  if (!mesa) return <div>Mesa no encontrada</div>;

  return (
    <div className="flex bg-background min-h-screen">
      <AppSidebar />
      <main className="flex-1 ml-64 p-8 flex flex-col h-screen">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-3xl font-headline">Mesa {mesa.id}</h2>
              <p className="text-muted-foreground text-sm uppercase font-mono">{mesa.zona} • Capacidad: {mesa.capacidad}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-secondary border-secondary px-4 py-1">
            {mesa.estado}
          </Badge>
        </header>

        <div className="flex-1 flex gap-8 overflow-hidden">
          {/* Left: Product Menu */}
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar productos..." 
                  className="pl-10 bg-card border-border"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <ScrollArea className="w-full max-w-[400px]">
                <div className="flex gap-2">
                  {categories.map(cat => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(cat)}
                      className="whitespace-nowrap"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <ScrollArea className="flex-1 pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <Card 
                    key={product.id} 
                    className="bg-card/50 border-border hover:border-primary/50 transition-all cursor-pointer group"
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{product.nombre}</h4>
                          <Badge variant="secondary" className="text-[10px] font-mono">{product.estacion}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{product.descripcion}</p>
                      </div>
                      <div className="flex justify-between items-center mt-auto">
                        <span className="text-xl font-black text-secondary">${product.precio.toLocaleString()}</span>
                        <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Cart/Order Summary */}
          <Card className="w-[400px] bg-card border-border paper-texture flex flex-col">
            <CardHeader className="border-b border-border py-4">
              <CardTitle className="flex items-center gap-2 text-xl font-headline">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Comanda Actual
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className="flex-1 p-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground mt-20 opacity-50">
                    <Utensils className="w-12 h-12 mb-4" />
                    <p>No hay productos en la comanda</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.producto.id} className="flex flex-col gap-2 p-3 bg-accent/30 rounded-xl border border-border/50 group">
                        <div className="flex justify-between items-start">
                          <h5 className="font-bold text-sm leading-tight">{item.producto.nombre}</h5>
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeFromCart(item.producto.id); }}
                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono text-secondary">${(item.producto.precio * item.cantidad).toLocaleString()}</span>
                          <div className="flex items-center gap-3 bg-background/50 rounded-lg p-1 border border-border">
                            <button 
                              onClick={() => updateQuantity(item.producto.id, -1)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-accent rounded"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-bold min-w-[20px] text-center">{item.cantidad}</span>
                            <button 
                              onClick={() => updateQuantity(item.producto.id, 1)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-accent rounded"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="p-6 border-t border-border bg-accent/20">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-mono mb-1">Total a pagar</p>
                    <p className="text-3xl font-black text-secondary">${total.toLocaleString()}</p>
                  </div>
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    {cart.length} items
                  </Badge>
                </div>
                <Button 
                  disabled={cart.length === 0}
                  onClick={handleSendOrder}
                  className="w-full h-14 bg-primary hover:glow-orange text-lg font-bold gap-3 rounded-xl transition-all"
                >
                  <Send className="w-5 h-5" />
                  ENVIAR A COCINA
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
