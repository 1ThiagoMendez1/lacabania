
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
  Flame
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
    
    // Simplificación: Los ítems ahora pasan directo a EN PREPARACION
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
      title: "¡Marchando!", 
      description: "El pedido ya está en preparación en las estaciones correspondientes." 
    });
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
                    {item.notas ? "Cambiar Nota" : "Petición Especial"}
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
      <div className="mt-auto pt-6 pb-12 lg:pb-6 border-t bg-card/80 backdrop-blur-xl -mx-6 px-6 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px]">Subtotal Pedido</span>
            <span className="text-[10px] text-primary font-mono mt-0.5">{cartItemsCount} productos registrados</span>
          </div>
          <span className="text-3xl font-black text-secondary glow-gold-text tracking-tighter">${cartTotal.toLocaleString()}</span>
        </div>
        <Button 
          disabled={cart.length === 0} 
          onClick={() => setShowConfirmDialog(true)} 
          className="w-full h-14 md:h-16 text-lg font-black rounded-2xl shadow-2xl hover:glow-orange transition-all bg-primary active:scale-95 border-b-4 border-primary-foreground/20"
        >
          ENVIAR A COCINA
        </Button>
      </div>
    </div>
  );

  return (
    <main className="flex flex-col h-svh bg-background overflow-hidden">
      {/* Header */}
      <header className="p-3 md:p-6 flex justify-between items-center border-b bg-card/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full active:scale-90">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h2 className="text-xl md:text-3xl font-headline">Mesa {mesa.id}</h2>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{mesa.zona}</p>
          </div>
        </div>
        
        <div className="lg:hidden flex gap-2">
           <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary" className="relative gap-2 font-bold h-10 px-4 rounded-full bg-accent/50 border-secondary/30 active:scale-95">
                <ShoppingCart className="w-4 h-4 text-secondary" />
                {cartItemsCount > 0 && (
                  <Badge className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center p-0 bg-primary border-2 border-background animate-in zoom-in text-[10px] font-black">
                    {cartItemsCount}
                  </Badge>
                )}
                <span className="hidden sm:inline">Comanda</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] rounded-t-[3rem] border-t-4 border-t-primary paper-texture p-6 pt-8 overflow-hidden">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-2xl font-headline flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                  </div>
                  Pedido Actual
                </SheetTitle>
              </SheetHeader>
              <CartSummary />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <Tabs defaultValue="menu" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 md:px-8 py-2 bg-accent/10 border-b">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto h-12 bg-accent/20 rounded-2xl p-1">
            <TabsTrigger value="menu" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-bold gap-2">
              <ListTodo className="w-4 h-4" /> Carta
            </TabsTrigger>
            <TabsTrigger value="status" className="rounded-xl data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground font-bold gap-2">
              <Truck className="w-4 h-4" /> Seguimiento
              {activeOrder?.items.filter(i => i.estado === 'LISTO').length! > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 animate-pulse">
                  {activeOrder?.items.filter(i => i.estado === 'LISTO').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="menu" className="flex-1 flex flex-col lg:flex-row gap-0 lg:gap-8 p-0 lg:p-8 overflow-hidden">
          {/* Menu Section */}
          <div className="flex-1 flex flex-col gap-3 p-3 lg:p-0 overflow-hidden">
            <div className="space-y-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar plato o bebida..." 
                  className="pl-10 h-11 bg-card/50 border-border focus-visible:ring-primary rounded-xl text-sm" 
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
                        "rounded-full px-4 h-8 transition-all active:scale-95 text-xs font-bold",
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

            <ScrollArea className="flex-1 -mx-3 px-3 lg:-mx-2 lg:px-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 py-2">
                {filteredProducts.map(p => (
                  <Card 
                    key={p.id} 
                    className="bg-card/40 border-border/50 active:scale-95 transition-all flex flex-col group overflow-hidden touch-manipulation"
                    onClick={() => addToCart(p)}
                  >
                    <CardContent className="p-3 md:p-5 flex flex-col justify-between h-full min-h-[140px] relative">
                      <div className="mb-2">
                        <Badge variant="outline" className="text-[7px] md:text-[9px] mb-2 font-mono uppercase tracking-tighter opacity-60">
                          {p.categoria}
                        </Badge>
                        <h4 className="font-bold text-xs md:text-base leading-tight group-active:text-primary transition-colors line-clamp-2">
                          {p.nombre}
                        </h4>
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        <span className="text-sm md:text-xl font-black text-secondary">
                          ${p.precio.toLocaleString()}
                        </span>
                        <div className="p-1.5 bg-primary/10 rounded-xl group-active:bg-primary group-active:text-white transition-all shadow-inner">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Desktop Cart Section */}
          <Card className="hidden lg:flex w-96 bg-card border-border paper-texture flex-col shadow-2xl overflow-hidden">
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
        </TabsContent>

        <TabsContent value="status" className="flex-1 p-4 md:p-8 overflow-hidden">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            <h3 className="text-xl font-headline mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Estado de Pedidos en Mesa {mesa.id}
            </h3>
            
            {!activeOrder || activeOrder.items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                <div className="p-6 bg-accent/10 rounded-full">
                  <StickyNote className="w-16 h-16" />
                </div>
                <p className="font-headline text-2xl">No hay pedidos activos</p>
                <p className="text-sm">Empieza registrando items en la Carta.</p>
              </div>
            ) : (
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4 pb-10">
                  {activeOrder.items.map((item) => {
                    const statusConfig = {
                      'PENDIENTE': { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/10', label: 'En Cola' },
                      'EN PREPARACION': { icon: Flame, color: 'text-secondary', bg: 'bg-secondary/10', label: 'En Fuego' },
                      'LISTO': { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'LISTO PARA SALIR' },
                      'ENTREGADO': { icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Entregado' }
                    };
                    const config = statusConfig[item.estado];
                    const elapsed = Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60);

                    return (
                      <Card key={item.id} className={cn(
                        "border-l-4 transition-all",
                        item.estado === 'LISTO' ? "border-l-green-500 glow-gold" : "border-l-border"
                      )}>
                        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center font-black text-xl shrink-0">
                              {item.cantidad}
                            </div>
                            <div>
                              <p className="font-bold text-lg leading-tight">{item.nombre}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <Badge variant="outline" className={cn("text-[9px] gap-1 px-2", config.bg, config.color)}>
                                  <config.icon className="w-3 h-3" />
                                  {config.label}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Timer className="w-3 h-3" /> {elapsed} min
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 justify-end">
                            {item.estado === 'LISTO' && (
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2 px-6 rounded-xl shadow-lg animate-pulse"
                                onClick={() => updateItemEstado(activeOrder.id, item.id, 'ENTREGADO')}
                              >
                                <Truck className="w-4 h-4" /> MARCAR ENTREGADO
                              </Button>
                            )}
                            {item.estado === 'ENTREGADO' && (
                              <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase bg-blue-500/10 px-4 py-2 rounded-xl">
                                <CheckCircle2 className="w-4 h-4" /> En Mesa
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-[90vw] md:max-w-md bg-card border-border paper-texture rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl md:text-2xl font-headline flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              Validar Comanda
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground text-sm">
              Verifica los platos y las peticiones especiales con el cliente de la <strong>Mesa {mesaId}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4 space-y-3 max-h-[40vh] overflow-auto pr-2 border-y border-border/30 py-4">
            {cart.map(item => (
              <div key={item.tempId} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs md:text-sm">
                  <span className="font-bold flex gap-2">
                    <span className="text-primary">{item.cantidad}x</span> 
                    <span>{item.producto.nombre}</span>
                  </span>
                  <span className="font-bold text-secondary">${(item.producto.precio * item.cantidad).toLocaleString()}</span>
                </div>
                {item.notas && (
                  <div className="text-[10px] text-primary bg-primary/5 px-2.5 py-1.5 rounded-xl border border-primary/10 italic flex gap-2">
                    <StickyNote className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>"{item.notas}"</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mb-6 px-1">
            <span className="text-sm font-headline uppercase tracking-widest text-muted-foreground">Total Final</span>
            <span className="text-2xl font-black text-secondary">${cartTotal.toLocaleString()}</span>
          </div>

          <AlertDialogFooter className="gap-2 sm:gap-3">
            <AlertDialogCancel className="rounded-xl border-border h-12">Corregir</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSendOrder}
              className="rounded-xl bg-primary hover:bg-primary/90 font-bold px-8 shadow-lg glow-orange h-12"
            >
              CONFIRMAR PEDIDO
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Note Editor Dialog */}
      <Dialog open={!!noteEditingItem} onOpenChange={(open) => !open && setNoteEditingItem(null)}>
        <DialogContent className="max-w-[90vw] bg-card border-border paper-texture rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl font-headline">Nota para Cocina</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-primary tracking-widest">Producto seleccionado</Label>
              <p className="font-black text-lg">{noteEditingItem?.producto.nombre}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-notes" className="text-xs font-bold">Instrucciones del cliente</Label>
              <Textarea 
                id="item-notes" 
                placeholder="Ej: Término medio, sin cebolla, salsa aparte..." 
                className="h-28 bg-background border-border rounded-xl focus-visible:ring-primary text-sm"
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="rounded-xl" onClick={() => setNoteEditingItem(null)}>Cerrar</Button>
            <Button className="bg-primary font-bold px-8 rounded-xl h-12 active:scale-95" onClick={saveNote}>LISTO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
