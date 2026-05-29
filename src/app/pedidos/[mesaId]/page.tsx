
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
  ChevronLeft,
  Search,
  ShoppingCart,
  CheckCircle2,
  MessageSquarePlus,
  StickyNote,
  ListTodo,
  Clock,
  CheckCircle,
  Truck,
  Timer,
  Flame,
  UtensilsCrossed,
  ChefHat,
  BellRing,
  PackageCheck
} from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ItemOrden, Producto, Orden } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

type CartItem = {
  producto: Producto;
  cantidad: number;
  notas?: string;
  tempId: string;
};

export default function OrderPage() {
  const { mesaId } = useParams();
  const router = useRouter();
  const { productos, mesas, ordenes, addOrden, updateMesaEstado, updateItemEstado, user } = usePOSStore();
  const { toast } = useToast();
  
  const mesa = mesas.find(m => m.id === Number(mesaId));
  const activeOrder = useMemo(() => ordenes.find(o => o.mesaId === Number(mesaId) && o.estado === 'ABIERTA'), [ordenes, mesaId]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODOS");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const [noteEditingItem, setNoteEditingItem] = useState<CartItem | null>(null);
  const [tempNote, setTempNote] = useState("");

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
      return [...prev, { producto: product, cantidad: 1, tempId: Math.random().toString(36).substr(2, 9) }];
    });
  };

  const removeFromCart = (tempId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.tempId === tempId);
      if (existing && existing.cantidad > 1) {
        return prev.map(item => item.tempId === tempId ? { ...item, cantidad: item.cantidad - 1 } : item);
      }
      return prev.filter(item => item.tempId !== tempId);
    });
  };

  const openNoteEditor = (item: CartItem) => {
    setNoteEditingItem(item);
    setTempNote(item.notas || "");
  };

  const saveNote = () => {
    if (!noteEditingItem) return;
    setCart(prev => prev.map(item => 
      item.tempId === noteEditingItem.tempId ? { ...item, notas: tempNote } : item
    ));
    setNoteEditingItem(null);
    setTempNote("");
  };

  const handleSendOrder = () => {
    if (cart.length === 0) return;
    
    const newItems: ItemOrden[] = cart.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      productoId: item.producto.id,
      nombre: item.producto.nombre,
      cantidad: item.cantidad,
      precioUnitario: item.producto.precio,
      notas: item.notas,
      estacion: item.producto.estacion,
      estado: 'EN PREPARACION',
      createdAt: new Date().toISOString()
    }));
    
    if (activeOrder) {
      const updatedItems = [...activeOrder.items, ...newItems];
      usePOSStore.getState().updateOrden(activeOrder.id, { items: updatedItems });
    } else {
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
    }
    
    setCart([]);
    setShowConfirmDialog(false);
    toast({ 
      title: "¡Pedido en marcha!", 
      description: "La cocina ya recibió la orden. 🤠" 
    });
  };

  const pendingItems = activeOrder?.items.filter(item => item.estado !== 'ENTREGADO') || [];
  const readyItemsCount = pendingItems.filter(item => item.estado === 'LISTO').length;
  const inKitchenCount = pendingItems.filter(item => item.estado === 'EN PREPARACION' || item.estado === 'PENDIENTE').length;

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
              <div key={item.tempId} className="flex flex-col gap-2 p-3 bg-accent/30 rounded-xl border border-border/50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-bold">{item.producto.nombre}</p>
                    <p className="text-xs text-secondary font-mono">${(item.producto.precio * item.cantidad).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border/50" onClick={(e) => { e.stopPropagation(); removeFromCart(item.tempId); }}>
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-sm font-black w-4 text-center">{item.cantidad}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border/50" onClick={(e) => { e.stopPropagation(); addToCart(item.producto); }}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "h-8 text-[10px] font-bold px-3 rounded-xl gap-1.5",
                      item.notas ? "bg-primary/20 text-primary border border-primary/20" : "bg-accent/50 text-muted-foreground"
                    )}
                    onClick={(e) => { e.stopPropagation(); openNoteEditor(item); }}
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    {item.notas ? "Cambiar Nota" : "Nota especial"}
                  </Button>
                  {item.notas && (
                    <div className="flex-1 truncate italic text-[10px] text-primary/80 bg-primary/5 px-2 py-1 rounded-md border border-primary/10">
                      "{item.notas}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      <div className="mt-auto pt-4 pb-12 lg:pb-4 border-t bg-card/80 backdrop-blur-xl -mx-6 px-6 rounded-t-3xl shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <span className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px]">Total Pedido</span>
            <span className="text-[10px] text-primary font-mono mt-0.5">{cartItemsCount} items</span>
          </div>
          <span className="text-3xl font-black text-secondary glow-gold-text tracking-tighter">${cartTotal.toLocaleString()}</span>
        </div>
        <Button 
          disabled={cart.length === 0} 
          onClick={() => setShowConfirmDialog(true)} 
          className="w-full h-14 md:h-16 text-lg font-black rounded-2xl shadow-xl bg-primary hover:glow-orange transition-all active:scale-95"
        >
          MARCHAR ORDEN 🤠
        </Button>
      </div>
    </div>
  );

  return (
    <main className="flex flex-col h-svh bg-background overflow-hidden">
      <header className="p-2 md:p-4 flex justify-between items-center border-b bg-card/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full active:scale-90">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h2 className="text-xl md:text-2xl font-headline">Mesa {mesa.id}</h2>
            <p className="text-[8px] text-muted-foreground uppercase tracking-widest">{mesa.zona}</p>
          </div>
        </div>
        
        <div className="lg:hidden flex gap-2">
           <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary" className="relative gap-2 font-bold h-9 px-4 rounded-full bg-accent/50 border-secondary/30">
                <ShoppingCart className="w-4 h-4 text-secondary" />
                {cartItemsCount > 0 && (
                  <Badge className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center p-0 bg-primary border-2 border-background text-[10px] font-black">
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] rounded-t-[3rem] border-t-4 border-t-primary paper-texture p-6 pt-8 overflow-hidden">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-2xl font-headline flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                  </div>
                  Orden Actual
                </SheetTitle>
              </SheetHeader>
              <CartSummary />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <Tabs defaultValue="menu" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 md:px-8 py-1 bg-accent/10 border-b">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto h-10 bg-accent/20 rounded-xl p-1">
            <TabsTrigger value="menu" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-bold gap-2 text-xs">
              <ListTodo className="w-3.5 h-3.5" /> Carta
            </TabsTrigger>
            <TabsTrigger value="status" className="rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground font-bold gap-2 text-xs">
              <UtensilsCrossed className="w-3.5 h-3.5" /> Entregas
              {readyItemsCount > 0 && (
                <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 animate-pulse text-[9px]">
                  {readyItemsCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="menu" className="flex-1 flex flex-col lg:flex-row gap-0 lg:gap-4 p-0 lg:p-4 overflow-hidden mt-0">
          <div className="flex-1 flex flex-col gap-2 p-2 lg:p-0 overflow-hidden">
            <div className="space-y-2">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar..." 
                  className="pl-10 h-10 bg-card/50 border-border rounded-xl" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-1.5">
                  {categories.map(cat => (
                    <Button 
                      key={cat} 
                      variant={selectedCategory === cat ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "rounded-full px-4 h-7 text-[10px] font-bold transition-all",
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

            <ScrollArea className="flex-1 -mx-2 px-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3 py-1">
                {filteredProducts.map(p => (
                  <Card 
                    key={p.id} 
                    className="bg-card/40 border-border/50 active:scale-95 transition-all flex flex-col group overflow-hidden"
                    onClick={() => addToCart(p)}
                  >
                    <CardContent className="p-3 md:p-4 flex flex-col justify-between h-full min-h-[120px]">
                      <div>
                        <Badge variant="outline" className="text-[7px] md:text-[8px] mb-1.5 uppercase opacity-60">
                          {p.categoria}
                        </Badge>
                        <h4 className="font-bold text-[11px] md:text-sm leading-tight line-clamp-2">
                          {p.nombre}
                        </h4>
                      </div>
                      <div className="flex justify-between items-end mt-1.5">
                        <span className="text-xs md:text-lg font-black text-secondary">
                          ${p.precio.toLocaleString()}
                        </span>
                        <div className="p-1 bg-primary/10 rounded-lg group-active:bg-primary group-active:text-white transition-all">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Card className="hidden lg:flex w-80 bg-card border-border paper-texture flex-col shadow-2xl overflow-hidden">
            <CardHeader className="border-b bg-accent/20 p-4">
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                Comanda
              </CardTitle>
            </CardHeader>
            <div className="flex-1 p-4 overflow-hidden">
              <CartSummary />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="flex-1 p-2 md:p-4 overflow-hidden mt-0">
          <div className="max-w-6xl mx-auto h-full flex flex-col gap-4">
            {pendingItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                <Card className="bg-accent/20 border-border/50">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <ChefHat className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">En Cocina</p>
                      <p className="text-lg font-black">{inKitchenCount} platos</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-xl">
                      <BellRing className={cn("w-4 h-4 text-green-500", readyItemsCount > 0 && "animate-bounce")} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-green-500/70">Listos para Entrega</p>
                      <p className="text-lg font-black text-green-500">{readyItemsCount} platos</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-secondary/10 border-secondary/20">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 rounded-xl">
                      <PackageCheck className="w-4 h-4 text-secondary" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-secondary/70">Atendiendo mesa</p>
                      <p className="text-lg font-black text-secondary">#{mesaId}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {!activeOrder || pendingItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center space-y-2">
                <div className="p-6 bg-accent/10 rounded-full">
                  <UtensilsCrossed className="w-16 h-16" />
                </div>
                <p className="font-headline text-2xl">Mesa despejada 🤠</p>
                <p className="text-xs max-w-xs mx-auto opacity-70">
                  No hay platos pendientes por entregar. Todo está en marcha o servido.
                </p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pb-8">
                  {pendingItems.map((item) => {
                    const isReady = item.estado === 'LISTO';
                    const elapsed = Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60);

                    return (
                      <Card 
                        key={item.id} 
                        className={cn(
                          "border-none paper-texture transition-all duration-300 overflow-hidden group hover:scale-[1.02]",
                          isReady ? "ring-2 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.15)] bg-green-500/5" : "bg-card/40 border border-border/50"
                        )}
                      >
                        <CardContent className="p-0">
                          <div className={cn(
                            "p-3 border-b border-border/20 flex justify-between items-start",
                            isReady ? "bg-green-500/10" : "bg-accent/10"
                          )}>
                            <div className="flex gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-lg border",
                                isReady ? "bg-green-500 text-white border-green-400" : "bg-accent text-muted-foreground border-border"
                              )}>
                                {item.cantidad}
                              </div>
                              <div className="min-w-0 pr-2">
                                <p className="font-bold text-base leading-tight truncate">{item.nombre}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {isReady ? (
                                    <Badge className="bg-green-600 text-white animate-pulse text-[8px] uppercase font-black px-1.5 py-0 border-none">¡LISTO!</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[8px] uppercase font-bold opacity-60 bg-background/30">En Cocina</Badge>
                                  )}
                                  <span className="text-[9px] text-muted-foreground flex items-center gap-1 font-mono">
                                    <Clock className="w-2.5 h-2.5" /> {elapsed}m
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-3 space-y-2">
                            {item.notas && (
                              <div className="text-[9px] text-primary italic bg-primary/5 p-1.5 rounded-lg border border-primary/10 mb-1">
                                "{item.notas}"
                              </div>
                            )}
                            <Button 
                              className={cn(
                                "w-full h-12 font-black rounded-xl transition-all shadow-lg active:scale-95 text-base",
                                isReady ? "bg-green-600 hover:bg-green-700 text-white glow-gold" : "bg-secondary text-secondary-foreground"
                              )}
                              onClick={() => updateItemEstado(activeOrder.id, item.id, 'ENTREGADO')}
                            >
                              ENTREGAR 🤠
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {activeOrder?.items.some(i => i.estado === 'ENTREGADO') && (
              <div className="mt-auto border-t border-border/30 pt-2 pb-4 opacity-60">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-center mb-2">Entregado recientemente</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {activeOrder.items
                    .filter(i => i.estado === 'ENTREGADO')
                    .slice(-4)
                    .map(item => (
                      <div key={item.id} className="flex items-center gap-1.5 text-[9px] bg-accent/20 px-2.5 py-1 rounded-full border border-border/30">
                        <span className="font-black text-green-500">{item.cantidad}x</span>
                        <span className="font-medium truncate max-w-[100px]">{item.nombre}</span>
                        <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-[90vw] md:max-w-md bg-card border-border paper-texture rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl md:text-2xl font-headline flex items-center gap-2">
              <UtensilsCrossed className="w-6 h-6 text-primary" />
              Confirmar Comanda
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="my-3 space-y-2 max-h-[35vh] overflow-auto pr-2 border-y border-border/30 py-3">
            {cart.map(item => (
              <div key={item.tempId} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold flex gap-2">
                    <span className="text-primary">{item.cantidad}x</span> 
                    <span>{item.producto.nombre}</span>
                  </span>
                  <span className="font-bold text-secondary">${(item.producto.precio * item.cantidad).toLocaleString()}</span>
                </div>
                {item.notas && (
                  <div className="text-[9px] text-primary bg-primary/5 px-2 py-1 rounded-xl border border-primary/10 italic">
                    "{item.notas}"
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-xs font-black uppercase text-muted-foreground">Total</span>
            <span className="text-2xl font-black text-secondary">${cartTotal.toLocaleString()}</span>
          </div>
          <AlertDialogFooter className="gap-2 sm:gap-3">
            <AlertDialogCancel className="rounded-xl h-12">Corregir</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSendOrder}
              className="rounded-xl bg-primary hover:glow-orange font-bold px-8 h-12"
            >
              MARCHAR 🤠
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!noteEditingItem} onOpenChange={(open) => !open && setNoteEditingItem(null)}>
        <DialogContent className="max-w-[90vw] bg-card border-border paper-texture rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-headline">Nota para Cocina</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="font-black text-lg">{noteEditingItem?.producto.nombre}</p>
            <Textarea 
              placeholder="Ej: Término medio, sin cebolla..." 
              className="h-28 bg-background border-border rounded-xl"
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button className="bg-primary font-bold w-full h-12 rounded-xl" onClick={saveNote}>GUARDAR NOTA</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
