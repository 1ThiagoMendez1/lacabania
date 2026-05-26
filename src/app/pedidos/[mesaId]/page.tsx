
"use client"

import { usePOSStore } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  ChevronLeft,
  Search,
  ShoppingCart,
  Utensils,
  X
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ItemOrden, Producto } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function OrderPage() {
  const { mesaId } = useParams();
  const router = useRouter();
  const { productos, mesas, addOrden, updateMesaEstado, user } = usePOSStore();
  
  const mesa = mesas.find(m => m.id === Number(mesaId));
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODOS");
  const [cart, setCart] = useState<{producto: Producto, cantidad: number}[]>([]);

  const categories = ["TODOS", ...new Set(productos.map(p => p.categoria))];
  const filteredProducts = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (selectedCategory === "TODOS" || p.categoria === selectedCategory)
  );

  const cartTotal = cart.reduce((a, b) => a + (b.producto.precio * b.cantidad), 0);
  const cartItemsCount = cart.reduce((a, b) => a + b.cantidad, 0);

  const addToCart = (product: Producto) => {
    setCart(prev => {
      const existing = prev.find(item => item.producto.id === product.id);
      if (existing) return prev.map(item => item.producto.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      return [...prev, { producto: product, cantidad: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.producto.id === productId);
      if (existing && existing.cantidad > 1) {
        return prev.map(item => item.producto.id === productId ? { ...item, cantidad: item.cantidad - 1 } : item);
      }
      return prev.filter(item => item.producto.id !== productId);
    });
  };

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
    addOrden({ 
      id: `ORD-${Date.now()}`, 
      mesaId: Number(mesaId), 
      meseroId: user?.id || 'sys', 
      items: newItems, 
      estado: 'ABIERTA', 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    });
    updateMesaEstado(Number(mesaId), 'EN PEDIDO', user?.id);
    router.push('/mesas');
  };

  if (!mesa) return <div className="p-8">Mesa no encontrada</div>;

  const CartSummary = () => (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 -mx-2 px-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
            <ShoppingCart className="w-12 h-12 mb-4" />
            <p className="font-headline">Comanda vacía</p>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            {cart.map(item => (
              <div key={item.producto.id} className="flex justify-between items-center p-3 bg-accent/30 rounded-xl border border-border/50">
                <div className="flex-1">
                  <p className="text-sm font-bold">{item.producto.nombre}</p>
                  <p className="text-xs text-secondary font-mono">${(item.producto.precio * item.cantidad).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => removeFromCart(item.producto.id)}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-sm font-bold w-4 text-center">{item.cantidad}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => addToCart(item.producto)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      <div className="pt-6 pb-8 lg:pb-0 border-t bg-background/80 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-6">
          <span className="text-muted-foreground font-bold uppercase tracking-wider text-xs">Total a Pagar</span>
          <span className="text-3xl font-black text-secondary">${cartTotal.toLocaleString()}</span>
        </div>
        <Button 
          disabled={cart.length === 0} 
          onClick={handleSendOrder} 
          className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl hover:glow-orange transition-all bg-primary hover:bg-primary/90"
        >
          ENVIAR A COCINA
        </Button>
      </div>
    </div>
  );

  return (
    <main className="flex flex-col h-svh bg-background">
      {/* Header */}
      <header className="p-4 md:p-6 flex justify-between items-center border-b bg-card/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h2 className="text-xl md:text-3xl font-headline">Mesa {mesa.id}</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{mesa.zona}</p>
          </div>
        </div>
        
        {/* Mobile Cart Trigger */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary" className="relative gap-2 font-bold h-10 px-4 rounded-full bg-accent/50 border-secondary/30">
                <ShoppingCart className="w-4 h-4 text-secondary" />
                {cartItemsCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-primary border-2 border-background animate-in zoom-in">
                    {cartItemsCount}
                  </Badge>
                )}
                <span className="hidden sm:inline">Comanda</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-[3rem] border-t-4 border-t-primary paper-texture p-6 pt-8">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl font-headline flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                  </div>
                  Tu Pedido
                </SheetTitle>
              </SheetHeader>
              <CartSummary />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-0 lg:gap-8 p-0 lg:p-8 overflow-hidden">
        {/* Menu Section */}
        <div className="flex-1 flex flex-col gap-4 p-4 lg:p-0 overflow-hidden">
          {/* Search and Categories */}
          <div className="space-y-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="¿Qué desea el cliente?..." 
                className="pl-10 h-12 bg-card/50 border-border focus-visible:ring-primary rounded-xl" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {categories.map(cat => (
                  <Button 
                    key={cat} 
                    variant={selectedCategory === cat ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "rounded-full px-4 h-8 transition-all",
                      selectedCategory === cat ? "shadow-md glow-orange" : "bg-card/30"
                    )}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Product Grid */}
          <ScrollArea className="flex-1 -mx-4 px-4 lg:-mx-2 lg:px-2">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 py-2">
              {filteredProducts.map(p => (
                <Card 
                  key={p.id} 
                  className="bg-card/40 border-border/50 cursor-pointer hover:border-primary/50 hover:bg-accent/20 transition-all active:scale-95 flex flex-col group overflow-hidden"
                  onClick={() => addToCart(p)}
                >
                  <CardContent className="p-3 md:p-5 flex flex-col justify-between h-full relative">
                    <div className="mb-2">
                      <Badge variant="outline" className="text-[8px] md:text-[9px] mb-2 font-mono uppercase tracking-tighter opacity-70">
                        {p.categoria}
                      </Badge>
                      <h4 className="font-bold text-sm md:text-base leading-tight group-hover:text-primary transition-colors">
                        {p.nombre}
                      </h4>
                    </div>
                    <div className="flex justify-between items-end mt-4">
                      <span className="text-base md:text-xl font-black text-secondary">
                        ${p.precio.toLocaleString()}
                      </span>
                      <div className="p-1 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-30 italic">
                  No encontramos nada con ese nombre... 🤠
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Desktop Cart Section */}
        <Card className="hidden lg:flex w-96 bg-card border-border paper-texture flex-col shadow-2xl">
          <CardHeader className="border-b bg-accent/20">
            <CardTitle className="text-xl font-headline flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Comanda Actual
            </CardTitle>
          </CardHeader>
          <div className="flex-1 p-6 overflow-hidden">
            <CartSummary />
          </div>
        </Card>
      </div>

      {/* Floating Action Button for Mobile Cart (Fallback/Direct) */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        {cartItemsCount > 0 && (
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" className="h-16 w-16 rounded-full shadow-2xl glow-orange animate-in zoom-in duration-300 bg-primary text-white hover:bg-primary/90">
                <ShoppingCart className="w-7 h-7" />
                <Badge className="absolute -top-1 -right-1 h-7 w-7 flex items-center justify-center p-0 bg-secondary text-secondary-foreground border-4 border-background text-xs font-bold">
                  {cartItemsCount}
                </Badge>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-[3rem] border-t-4 border-t-primary paper-texture p-6 pt-8">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl font-headline flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                  </div>
                  Tu Pedido
                </SheetTitle>
              </SheetHeader>
              <CartSummary />
            </SheetContent>
          </Sheet>
        )}
      </div>
    </main>
  );
}
