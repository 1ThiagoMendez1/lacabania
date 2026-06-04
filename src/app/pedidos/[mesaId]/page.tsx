
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
  PackageCheck,
  Ban
} from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, uuidv4 } from "@/lib/utils";
import { ItemOrden, MenuItem, Orden } from "@/lib/types";
import { printKitchenTickets } from "@/lib/printHelper";
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
  menuItem: MenuItem;
  cantidad: number;
  notas?: string;
  tempId: string;
};

export default function OrderPage() {
  const { mesaId } = useParams();
  const router = useRouter();
  const { menuItems, mesas, ordenes, addOrden, updateMesaEstado, updateItemEstado, user, isCajaCerrada, fechaOperativa } = usePOSStore();
  const { toast } = useToast();
  
  const mesa = mesas.find(m => m.id === Number(mesaId));
  const activeOrder = useMemo(() => ordenes.find(o => o.mesaId === Number(mesaId) && o.estado === 'ABIERTA'), [ordenes, mesaId]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODOS");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const [noteEditingItem, setNoteEditingItem] = useState<CartItem | null>(null);
  const [tempNote, setTempNote] = useState("");

  if (!mesa) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const cartTotal = cart.reduce((acc, item) => acc + (item.menuItem.precio * item.cantidad), 0);
  const cartItemsCount = cart.reduce((acc, item) => acc + item.cantidad, 0);

  // Normalizar categorías a mayúsculas para evitar duplicados
  const normalizedCategories = Array.from(new Set(menuItems.map(m => m.categoria.trim().toUpperCase())));
  const categories = ['TODOS', ...normalizedCategories];

  const filteredItems = menuItems.filter(m => {
    const matchSearch = m.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'TODOS' || m.categoria.trim().toUpperCase() === selectedCategory;
    return matchSearch && matchCategory;
  });

  const addToCart = (item: MenuItem) => {
    if (isCajaCerrada) return;
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) return prev.map(i => i.menuItem.id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { menuItem: item, cantidad: 1, tempId: Math.random().toString(36).substr(2, 9) }];
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
    if (isCajaCerrada) {
      toast({
        variant: "destructive",
        title: "Ventas Bloqueadas",
        description: "La caja de hoy ya está cerrada. No se pueden marchar nuevos pedidos. 🤠"
      });
      return;
    }
    if (cart.length === 0) return;

    // Helper to get timestamp locked to current operational date
    const getOperationalTimestamp = () => {
      const now = new Date();
      const timePart = now.toTimeString().split(' ')[0]; // hh:mm:ss
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      const offsetMinutes = now.getTimezoneOffset();
      const absOffset = Math.abs(offsetMinutes);
      const sign = offsetMinutes > 0 ? '-' : '+';
      const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, '0');
      const offsetMins = String(absOffset % 60).padStart(2, '0');
      const timezoneOffsetStr = `${sign}${offsetHours}:${offsetMins}`;
      
      const activeDate = fechaOperativa || new Date(now.getTime() - (offsetMinutes * 60000)).toISOString().split('T')[0];
      return `${activeDate}T${timePart}.${ms}${timezoneOffsetStr}`;
    };

    const operationalTimestamp = getOperationalTimestamp();
    
    const newItems: ItemOrden[] = cart.map(item => ({
      id: uuidv4(),
      menuItemId: item.menuItem.id,
      nombre: item.menuItem.nombre,
      cantidad: item.cantidad,
      precioUnitario: item.menuItem.precio,
      notas: item.notas,
      estacion: item.menuItem.estacion,
      estado: 'EN PREPARACION',
      createdAt: operationalTimestamp
    }));
    
    if (activeOrder) {
      usePOSStore.getState().addItemsToOrden(activeOrder.id, newItems);
    } else {
      // Usar UUID real para que Supabase no rechace el insert
      const orderId = uuidv4();
      
      addOrden({ 
        id: orderId, 
        mesaId: Number(mesaId), 
        meseroId: user?.id || '00000000-0000-0000-0000-000000000000', 
        items: newItems, 
        estado: 'ABIERTA', 
        createdAt: operationalTimestamp, 
        updatedAt: operationalTimestamp 
      });
      updateMesaEstado(Number(mesaId), 'EN PEDIDO', user?.id);
    }
    
    // Intentar imprimir comandas en segundo plano
    printKitchenTickets(mesa.numero, user?.nombre || 'Mesero', newItems)
      .then(() => {
        toast({
          title: "Comandas impresas",
          description: "Tickets de comanda enviados a las estaciones correspondientes.",
        });
      })
      .catch((err: any) => {
        console.error("Error al imprimir comandas:", err);
        toast({
          variant: "destructive",
          title: "Error de Impresión",
          description: err.message || "No se pudieron imprimir algunos tickets de comanda. Verifica la conexión con QZ Tray.",
        });
      });

    setCart([]);
    setShowConfirmDialog(false);
    
    if (typeof document !== 'undefined') {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
    }

    toast({ 
      title: "¡Pedido en marcha!", 
      description: "La cocina ya recibió la orden. 🤠" 
    });
    
    setTimeout(() => {
      if (user?.rol === 'MESERO' || user?.rol === 'ADMINISTRADOR') {
        router.push('/mesas');
      } else {
        router.back();
      }
    }, 600);
  };

  const pendingItems = activeOrder?.items.filter(item => item.estado !== 'ENTREGADO') || [];
  const readyItemsCount = pendingItems.filter(item => item.estado === 'LISTO').length;
  const inKitchenCount = pendingItems.filter(item => item.estado === 'EN PREPARACION' || item.estado === 'PENDIENTE').length;

  if (!mesa) return <div className="p-8">Mesa no encontrada</div>;

  const CartSummary = () => (
    <div className="flex flex-col h-full w-full">
      <ScrollArea className="flex-1 px-1">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
            <ShoppingCart className="w-12 h-12 mb-4" />
            <p className="font-headline text-center">Comanda vacía</p>
          </div>
        ) : (
          <div className="space-y-3 py-2 pr-3">
            {cart.map(item => (
              <div key={item.tempId} className="flex flex-col gap-2 p-3 bg-accent/20 rounded-xl border border-border/50 shadow-sm w-full">
                <div className="flex justify-between items-center w-full gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{item.menuItem.nombre}</p>
                    <p className="text-xs text-secondary font-mono">${(item.menuItem.precio * item.cantidad).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border-border/50" onClick={(e) => { e.stopPropagation(); removeFromCart(item.tempId); }}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-black w-4 text-center">{item.cantidad}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border-border/50" onClick={(e) => { e.stopPropagation(); addToCart(item.menuItem); }}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "h-7 text-[10px] font-bold px-2 rounded-lg gap-1",
                      item.notas ? "bg-primary/20 text-primary border border-primary/20" : "bg-accent/50 text-muted-foreground"
                    )}
                    onClick={(e) => { e.stopPropagation(); openNoteEditor(item); }}
                  >
                    <MessageSquarePlus className="w-3 h-3" />
                    {item.notas ? "Nota" : "Añadir nota"}
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
      <div className="mt-2 pt-4 pb-2 border-t bg-background/90 backdrop-blur-xl w-full">
        <div className="flex justify-between items-center mb-4 px-1">
          <div className="flex flex-col">
            <span className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px]">Total</span>
            <span className="text-[10px] text-primary font-mono mt-0.5">{cartItemsCount} items</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-secondary glow-gold-text tracking-tighter">${cartTotal.toLocaleString()}</span>
        </div>
        <Button 
          disabled={cart.length === 0 || isCajaCerrada} 
          onClick={() => setShowConfirmDialog(true)} 
          className="w-full h-14 text-base sm:text-lg font-black rounded-xl shadow-xl bg-primary hover:bg-primary/90 hover:glow-orange transition-all active:scale-95"
        >
          {isCajaCerrada ? "CAJA CERRADA 🤠" : "MARCHAR ORDEN 🤠"}
        </Button>
      </div>
    </div>
  );

  return (
    <main className="flex flex-col h-full bg-background overflow-hidden">
      {isCajaCerrada && (
        <div className="bg-red-600 text-white text-center py-2 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
          <Ban className="w-4 h-4 animate-pulse" />
          Caja Cerrada - Ventas Bloqueadas hoy 🤠
        </div>
      )}
      <header className="p-2 md:p-3 flex justify-between items-center border-b bg-card/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full active:scale-90 h-9 w-9">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h2 className="text-lg md:text-xl font-headline leading-tight">Mesa {mesa.id}</h2>
            <p className="text-[7px] text-muted-foreground uppercase tracking-widest">{mesa.zona}</p>
          </div>
        </div>
        
        <div className="lg:hidden flex gap-2">
           <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary" className="relative gap-2 font-bold h-8 px-3 rounded-full bg-accent/50 border-secondary/30 text-xs">
                <ShoppingCart className="w-3.5 h-3.5 text-secondary" />
                {cartItemsCount > 0 && (
                  <Badge className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center p-0 bg-primary border-2 border-background text-[8px] font-black">
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] rounded-t-[3rem] border-t-4 border-t-primary paper-texture p-4 sm:p-6 pt-8 overflow-hidden flex flex-col">
              <SheetHeader className="mb-4 shrink-0">
                <SheetTitle className="text-xl sm:text-2xl font-headline flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  Orden Actual
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-hidden">
                <CartSummary />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <Tabs defaultValue="menu" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 md:px-8 bg-accent/10 border-b">
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

        <TabsContent value="menu" className="flex-1 flex flex-col lg:flex-row gap-0 lg:gap-3 p-0 lg:p-3 overflow-hidden mt-0">
          <div className="flex-1 flex flex-col gap-2 p-2 lg:p-0 overflow-hidden">
            <div className="space-y-1.5">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Buscar..." 
                  className="pl-10 h-9 bg-card/50 border-border rounded-xl text-sm" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-1">
                  {categories.map(cat => (
                    <Button 
                      key={cat} 
                      variant={selectedCategory === cat ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "rounded-full px-3 h-6 text-[9px] font-bold transition-all",
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 pt-2 pb-28 max-w-7xl mx-auto w-full px-1">
                {filteredItems.map(m => (
                  <Card 
                    key={m.id} 
                    className="bg-card/60 border-border/60 hover:border-primary/50 hover:shadow-lg active:scale-95 transition-all flex flex-col group overflow-hidden w-full mx-auto max-w-sm sm:max-w-none"
                    onClick={() => addToCart(m)}
                  >
                    <CardContent className="p-4 flex items-center justify-between h-full gap-3">
                      <div className="flex-1 text-left">
                        <Badge variant="outline" className="text-[9px] mb-1.5 uppercase opacity-80 border-primary/30 font-bold">
                          {m.categoria}
                        </Badge>
                        <h4 className="font-bold text-sm md:text-base leading-tight">
                          {m.nombre}
                        </h4>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-base md:text-lg font-black text-secondary">
                          ${m.precio.toLocaleString()}
                        </span>
                        <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-all">
                          <Plus className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Card className="hidden lg:flex w-80 bg-card border-border paper-texture flex-col shadow-2xl overflow-hidden">
            <CardHeader className="border-b bg-accent/20 p-3">
              <CardTitle className="text-base font-headline flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                Comanda
              </CardTitle>
            </CardHeader>
            <div className="flex-1 p-3 overflow-hidden">
              <CartSummary />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="flex-1 p-1 md:p-2 overflow-hidden mt-0">
          <div className="max-w-6xl mx-auto h-full flex flex-col gap-2">
            {pendingItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-4 duration-500">
                <Card className="bg-accent/20 border-border/50">
                  <CardContent className="p-2 flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded-xl">
                      <ChefHat className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-0.5">En Cocina</p>
                      <p className="text-base font-black leading-none">{inKitchenCount} platos</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="p-2 flex items-center gap-3">
                    <div className="p-1.5 bg-green-500/10 rounded-xl">
                      <BellRing className={cn("w-3.5 h-3.5 text-green-500", readyItemsCount > 0 && "animate-bounce")} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-green-500/70 leading-none mb-0.5">Listos para Entrega</p>
                      <p className="text-base font-black text-green-500 leading-none">{readyItemsCount} platos</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-secondary/10 border-secondary/20">
                  <CardContent className="p-2 flex items-center gap-3">
                    <div className="p-1.5 bg-secondary/10 rounded-xl">
                      <PackageCheck className="w-3.5 h-3.5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-secondary/70 leading-none mb-0.5">Atendiendo mesa</p>
                      <p className="text-base font-black text-secondary leading-none">#{mesaId}</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 pb-8">
                  {pendingItems.map((item) => {
                    const isReady = item.estado === 'LISTO';
                    const elapsed = Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60);

                    return (
                      <Card 
                        key={item.id} 
                        className={cn(
                          "border-none paper-texture transition-all duration-300 overflow-hidden group hover:scale-[1.01]",
                          isReady ? "ring-2 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.15)] bg-green-500/5" : "bg-card/40 border border-border/50"
                        )}
                      >
                        <CardContent className="p-0">
                          <div className={cn(
                            "p-2.5 border-b border-border/20 flex justify-between items-start",
                            isReady ? "bg-green-500/10" : "bg-accent/10"
                          )}>
                            <div className="flex gap-2.5">
                              <div className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg shadow-lg border",
                                isReady ? "bg-green-500 text-white border-green-400" : "bg-accent text-muted-foreground border-border"
                              )}>
                                {item.cantidad}
                              </div>
                              <div className="min-w-0 pr-2">
                                <p className="font-bold text-sm leading-tight truncate">{item.nombre}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {isReady ? (
                                    <Badge className="bg-green-600 text-white animate-pulse text-[7px] uppercase font-black px-1.5 py-0 border-none">¡LISTO!</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[7px] uppercase font-bold opacity-60 bg-background/30">En Cocina</Badge>
                                  )}
                                  <span className="text-[8px] text-muted-foreground flex items-center gap-1 font-mono">
                                    <Clock className="w-2.5 h-2.5" /> {elapsed}m
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-2.5 space-y-2">
                            {item.notas && (
                              <div className="text-[8px] text-primary italic bg-primary/5 p-1.5 rounded-lg border border-primary/10 mb-1">
                                "{item.notas}"
                              </div>
                            )}
                            <Button 
                              className={cn(
                                "w-full h-11 font-black rounded-xl transition-all shadow-lg active:scale-95 text-sm",
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
              <div className="mt-auto border-t border-border/30 pt-1 pb-3 opacity-60">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-center mb-1.5">Reciente</p>
                <div className="flex flex-wrap justify-center gap-1">
                  {activeOrder.items
                    .filter(i => i.estado === 'ENTREGADO')
                    .slice(-4)
                    .map(item => (
                      <div key={item.id} className="flex items-center gap-1.5 text-[8px] bg-accent/20 px-2 py-0.5 rounded-full border border-border/30">
                        <span className="font-black text-green-500">{item.cantidad}x</span>
                        <span className="font-medium truncate max-w-[80px]">{item.nombre}</span>
                        <CheckCircle2 className="w-2 h-2 text-green-500" />
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
                    <span>{item.menuItem.nombre}</span>
                  </span>
                  <span className="font-bold text-secondary">${(item.menuItem.precio * item.cantidad).toLocaleString()}</span>
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
            <p className="font-black text-lg">{noteEditingItem?.menuItem.nombre}</p>
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

      {/* Floating Bottom Cart (Mobile) */}
      {cartItemsCount > 0 && (
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom-10 duration-300 pointer-events-none">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="w-full h-14 bg-primary text-primary-foreground font-black text-lg rounded-2xl shadow-[0_8px_30px_rgb(239,108,0,0.4)] flex justify-between items-center px-6 pointer-events-auto hover:bg-primary/90 active:scale-95 transition-all">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <ShoppingCart className="w-6 h-6" />
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-background text-primary border-2 border-primary text-[10px] font-black rounded-full">
                      {cartItemsCount}
                    </Badge>
                  </div>
                  <span className="uppercase tracking-widest text-xs opacity-90">Ver Orden</span>
                </div>
                <span>${cartTotal.toLocaleString()}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] rounded-t-[3rem] border-t-4 border-t-primary paper-texture p-4 sm:p-6 pt-8 overflow-hidden flex flex-col">
              <SheetHeader className="mb-4 shrink-0">
                <SheetTitle className="text-xl sm:text-2xl font-headline flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  Orden Actual
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-hidden">
                <CartSummary />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </main>
  );
}
