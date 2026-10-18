
"use client"

import { usePOSStore } from "@/lib/store";
import { useShallow } from 'zustand/react/shallow';
import { 
  CircleDollarSign, 
  Receipt, 
  CreditCard, 
  Banknote, 
  Calculator,
  Printer,
  Clock,
  CheckCircle2,
  Smartphone,
  X,
  Share2,
  FileText,
  User,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Ban,
  Star,
  Search
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { cn, getOrderIdentifier, parseCurrencyInput, formatCurrencyInput } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { printReceiptTicket } from "@/lib/printHelper";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { MetodoPago, Orden, ClienteFE, TipoDocumentoFE } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CajaPage() {
  const { ordenes, mesas, closeOrden, isCajaCerrada, usuarios, updateOrden } = usePOSStore(useShallow(state => ({ ordenes: state.ordenes, mesas: state.mesas, closeOrden: state.closeOrden, isCajaCerrada: state.isCajaCerrada, usuarios: state.usuarios, updateOrden: state.updateOrden })));
  const { toast } = useToast();
  const [selectedMesaId, setSelectedMesaId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [metodoPago, setMetodoPago] = useState<MetodoPago | null>(null);
  const [lastClosedOrden, setLastClosedOrden] = useState<Orden | null>(null);
  const [propinaPersonalizada, setPropinaPersonalizada] = useState<string>("");
  
  const [isGastoDialogOpen, setIsGastoDialogOpen] = useState(false);
  const [gastoCategoria, setGastoCategoria] = useState("Insumos");
  const [gastoDescripcion, setGastoDescripcion] = useState("");
  const [gastoValor, setGastoValor] = useState("");

  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [ratingObservation, setRatingObservation] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mId = params.get('mesaId');
      if (mId) {
        setSelectedMesaId(Number(mId));
      }
    }
  }, []);

  // Sincronización en tiempo real y fallback de sondeo para Caja
  useEffect(() => {
    const refresh = usePOSStore.getState().refreshOrdenesYMesas;
    const setupRealtime = usePOSStore.getState().setupRealtime;
    
    // Forzar actualización inicial
    refresh().catch(err => console.error("Error al refrescar mesas al montar caja:", err));
    setupRealtime();

    // Sondeo de respaldo cada 5 segundos para entornos inestables o pestañas en suspensión
    const interval = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      refresh().catch(err => console.error("Error en sondeo de respaldo de caja:", err));
    }, 20000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setPropinaPersonalizada("");
    setSelectedRating(0);
    setRatingObservation("");
    setIsSubmittingRating(false);
  }, [selectedMesaId]);
  
  // Facturación State
  const [tipoFactura, setTipoFactura] = useState<'NO' | 'RECIBO' | 'ELECTRONICA'>('NO');
  const [clienteFE, setClienteFE] = useState<ClienteFE>({
    tipoDocumento: '13',
    numeroDocumento: '',
    nombre: '',
    email: '',
    telefono: '',
    direccion: ''
  });

  // La orden ABIERTA, y no una bandera desactualizada de la mesa, determina si hay cuenta por cobrar.
  const mesasConOrden = mesas.filter(m => ordenes.some(o => o.mesaId === m.id && o.estado === 'ABIERTA'));
  const [isClosing, setIsClosing] = useState(false);

  const activeOrden = ordenes.find(o => String(o.mesaId) === String(selectedMesaId) && o.estado === 'ABIERTA');

  const subtotal = (activeOrden?.items || [])
    .filter(item => item.estado !== 'CANCELADO')
    .reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
  const propinaAplicada = Number(propinaPersonalizada) || 0;
  const total = subtotal + propinaAplicada;

  const selectedMesa = mesas.find(m => m.id === selectedMesaId);
  const isParaLlevar = selectedMesa?.zona === 'Para Llevar';
  const ratingPendiente = !isParaLlevar && activeOrden && (!activeOrden.rating || activeOrden.rating <= 0);

  const handleCerrarCuenta = async () => {
    if (isCajaCerrada) {
      toast({
        variant: "destructive",
        title: "Ventas Bloqueadas",
        description: "La caja de hoy ya está cerrada. No se pueden procesar cobros. 🤠"
      });
      return;
    }
    if (!activeOrden || !selectedMesaId || !metodoPago) return;
    
    if (ratingPendiente) {
      toast({
        variant: "destructive",
        title: "Calificación Pendiente",
        description: "El cliente debe calificar la atención del mesero antes de pagar. 🤠"
      });
      return;
    }
    
    if (tipoFactura === 'ELECTRONICA' && (!clienteFE.numeroDocumento || !clienteFE.nombre || !clienteFE.email)) {
      toast({
        variant: "destructive",
        title: "Datos F.E. Incompletos",
        description: "Por favor complete los campos obligatorios para la factura electrónica."
      });
      return;
    }

    const ordenToClose = { 
      ...activeOrden, 
      metodoPago, 
      estado: 'CERRADA' as const,
      clienteFE: (tipoFactura !== 'NO' && tipoFactura !== 'RECIBO') ? clienteFE : undefined,
      propina: propinaAplicada
    };
    
    const mesaLabel = getOrderIdentifier({ 
      mesaId: selectedMesaId, 
      consecutivo: activeOrden.consecutivo, 
      id: activeOrden.id 
    });

    if (isClosing) return;
    setIsClosing(true);
    try {
      await closeOrden(activeOrden.id, selectedMesaId, metodoPago, propinaAplicada);
    } catch (error) {
      toast({ variant: 'destructive', title: 'No se confirmó el pago', description: error instanceof Error ? error.message : 'Comprueba la conexión y vuelve a consultar la orden.' });
      setIsClosing(false);
      return;
    }
    setLastClosedOrden(ordenToClose);
    setIsClosing(false);
    
    setSelectedMesaId(null);
    setMetodoPago(null);
    
    const tipoSeleccionado = tipoFactura;
    setTipoFactura('NO');
    
    if (tipoSeleccionado !== 'NO') {
      const mesero = usePOSStore.getState().usuarios.find(u => u.id === activeOrden.meseroId)?.nombre || 'N/A';
      printReceiptTicket(ordenToClose, mesero).then(() => {
        toast({ title: "Factura impresa", description: "El recibo se envió a la impresora." });
      }).catch(err => {
        toast({ variant: "destructive", title: "Error de Impresión", description: err.message || "Revisa la configuración de la impresora." });
      });
    }
    
    toast({ 
      title: tipoSeleccionado === 'ELECTRONICA' ? "Venta y Factura Exitosa" : "Pago Confirmado",  
      description: `${mesaLabel} procesado con éxito.` 
    });
  };

  return (
    <main className="p-4 md:p-8 flex flex-col h-full bg-background print:p-0">
      <header className="flex justify-between items-end mb-8 print:hidden">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary/10 rounded-lg"><CircleDollarSign className="w-8 h-8 text-secondary" /></div>
            <h2 className="text-2xl md:text-3xl font-headline text-foreground">Caja y Facturación</h2>
          </div>
          <p className="text-sm text-muted-foreground">Gestión de cobros y cierre de mesas 🤠</p>
        </div>
      </header>

      {isCajaCerrada && (
        <div className="mb-6 bg-red-600/20 border-2 border-red-500 text-red-500 p-4 rounded-2xl flex items-center gap-3 shadow-lg print:hidden animate-in slide-in-from-top-4 duration-500">
          <Ban className="w-6 h-6 animate-pulse shrink-0" />
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight">Caja Cerrada</h4>
            <p className="text-xs font-medium opacity-90">Las ventas del día han sido bloqueadas debido al Cierre Diario. No se pueden procesar cobros ni cerrar cuentas.</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden print:hidden">
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Calculator className="w-4 h-4" /> Mesas Pendientes
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                className="pl-10 h-11 bg-card border-border/50 shadow-sm rounded-xl text-sm" 
                placeholder="Buscar orden o mesa..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1 h-[200px] lg:h-full">
            <div className="space-y-3 pr-4">
              {(() => {
                const filteredMesas = mesasConOrden.filter(mesa => {
                  if (!searchQuery) return true;
                  const activeOrder = ordenes.find(o => String(o.mesaId) === String(mesa.id) && o.estado === 'ABIERTA');
                  const searchTerm = searchQuery.toLowerCase();
                  
                  const mesaIdStr = String(mesa.id);
                  const mesaVisibleStr = mesa.numero ? String(mesa.numero).toLowerCase() : '';
                  const orderStr = activeOrder ? getOrderIdentifier({ mesaId: mesa.id, consecutivo: activeOrder.consecutivo, id: activeOrder.id }).toLowerCase() : '';
                  
                  return mesaIdStr.includes(searchTerm) || 
                         mesaVisibleStr.includes(searchTerm) || 
                         orderStr.includes(searchTerm);
                });

                if (filteredMesas.length === 0) {
                  return (
                <div className="text-center py-10 lg:py-20 opacity-30">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
                  <p className="font-headline">{searchQuery ? "Sin resultados" : "Sin cuentas"}</p>
                </div>
                  );
                }

                return filteredMesas.map((mesa) => {
                  const activeOrder = ordenes.find(o => String(o.mesaId) === String(mesa.id) && o.estado === 'ABIERTA');
                  return (
                    <button
                      key={mesa.id}
                      onClick={() => {setSelectedMesaId(mesa.id); setMetodoPago(null); setTipoFactura('NO');}}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all wood-texture group",
                        selectedMesaId === mesa.id ? "bg-secondary/20 border-secondary ring-1 ring-secondary" : "bg-card border-border hover:border-secondary/50"
                      )}
                    >
                      <div className="flex justify-between mb-2">
                        <span className="text-xl font-black flex flex-wrap items-center gap-2">
                          {activeOrder ? getOrderIdentifier({ mesaId: mesa.id, consecutivo: activeOrder.consecutivo, id: activeOrder.id }) : (mesa.zona === 'Para Llevar' ? `PLL-${mesa.id}` : `Mesa ${mesa.id}`)}
                          {mesa.id < 101 && activeOrder && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md uppercase tracking-widest font-bold border border-primary/20">
                              {mesa.numero ? `Mesa ${mesa.numero}` : `Mesa ${mesa.id}`}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3 h-3" /><span>Cuenta Activa</span></div>
                    </button>
                  );
                });
              })()}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 overflow-hidden max-h-full flex flex-col">
          {activeOrden ? (
            <div className="max-h-full flex flex-col lg:flex-row gap-6 overflow-hidden">
              {/* Left Panel: Consumo */}
              <Card className="flex-1 flex flex-col bg-card border-border/50 paper-texture rounded-[2rem] overflow-hidden shadow-2xl">
                <CardHeader className="bg-accent/20 border-b border-border/30 flex flex-row items-center justify-between p-6">
                  <div className="flex items-center gap-5">
                    <Receipt className="w-8 h-8 text-primary" />
                    <div>
                      <CardTitle className="font-headline text-3xl text-foreground flex flex-wrap items-center gap-4">
                        {(() => {
                          return getOrderIdentifier({ mesaId: selectedMesaId!, consecutivo: activeOrden.consecutivo, id: activeOrden.id });
                        })()}
                        {selectedMesaId! < 101 && (
                          <span className="text-xl bg-primary/20 text-primary px-4 py-1.5 rounded-xl uppercase tracking-widest font-black shadow-inner border border-primary/30">
                            {(() => {
                              const mesaInfo = mesas.find(m => m.id === selectedMesaId);
                              return mesaInfo?.numero ? `MESA ${mesaInfo.numero}` : `MESA ${selectedMesaId}`;
                            })()}
                          </span>
                        )}
                      </CardTitle>
                      <p className="text-xs uppercase text-muted-foreground font-mono mt-1">Orden ID: {activeOrden.id}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                  <div className="p-4 bg-background/50 border-b border-border/20 flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Receipt className="w-4 h-4" /> Consumo
                    </h3>
                    <Badge variant="outline" className="bg-background">{(activeOrden.items || []).length} items</Badge>
                  </div>
                  <ScrollArea className="flex-1 p-4 lg:p-6">
                    <table className="w-full text-sm">
                      <tbody>
                        {(activeOrden.items || []).map((item) => {
                          const isCancelado = item.estado === 'CANCELADO';
                          return (
                            <tr key={item.id} className={`border-b border-border/30 ${isCancelado ? 'opacity-50 line-through' : ''}`}>
                              <td className="py-3 font-bold pr-2">{item.cantidad}x</td>
                              <td className="py-3 text-foreground">
                                {isCancelado && <span className="text-[10px] text-red-500 font-bold bg-red-500/10 px-1 py-0.5 rounded mr-1">CANCELADO</span>}
                                {item.nombre}
                              </td>
                              <td className="py-3 text-right font-bold text-foreground">
                                {isCancelado ? "$0" : `$${(item.precioUnitario * item.cantidad).toLocaleString('es-CO')}`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Right Panel: Checkout Sidebar */}
              <div className="w-full lg:w-[30rem] xl:w-[35rem] flex flex-col relative z-10">
                  <ScrollArea className="h-full w-full">
                    <div className="p-6 lg:p-8 space-y-6 lg:space-y-8 pb-12">
                      
                      {/* Facturación */}
                      <div className="p-5 rounded-2xl border border-border/50 bg-card shadow-sm transition-all space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-secondary" />
                          <Label className="text-sm font-bold uppercase tracking-wider">Facturación</Label>
                        </div>
                        <Select value={tipoFactura} onValueChange={(val) => setTipoFactura(val as any)}>
                          <SelectTrigger className="w-full bg-background h-12 rounded-xl">
                            <SelectValue placeholder="Seleccionar tipo de factura" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RECIBO">Sin Factura (Solo Recibo)</SelectItem>
                            <SelectItem value="ELECTRONICA">Factura Electrónica (DIAN)</SelectItem>
                            <SelectItem value="NO">No requiere factura</SelectItem>
                          </SelectContent>
                        </Select>

                        {tipoFactura === 'ELECTRONICA' && (
                          <div className="mt-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-border/50 pt-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo Doc.</Label>
                                <Select value={clienteFE.tipoDocumento} onValueChange={(val) => setClienteFE({...clienteFE, tipoDocumento: val as TipoDocumentoFE})}>
                                  <SelectTrigger className="h-9 text-xs bg-background"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="13">C.C.</SelectItem>
                                    <SelectItem value="31">NIT</SelectItem>
                                    <SelectItem value="11">R.C.</SelectItem>
                                    <SelectItem value="12">T.I.</SelectItem>
                                    <SelectItem value="22">C.E.</SelectItem>
                                    <SelectItem value="41">Pasaporte</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Número</Label>
                                <Input className="h-9 text-xs bg-background" value={clienteFE.numeroDocumento} onChange={(e) => setClienteFE({...clienteFE, numeroDocumento: e.target.value})} placeholder="123456789" />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Razón Social / Nombre</Label>
                              <div className="relative">
                                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input className="h-9 pl-9 text-xs bg-background" value={clienteFE.nombre} onChange={(e) => setClienteFE({...clienteFE, nombre: e.target.value})} placeholder="Ej. Juan Pérez" />
                              </div>
                            </div>
                            {tipoFactura === 'ELECTRONICA' && (
                              <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Email</Label>
                                <div className="relative">
                                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input className="h-9 pl-9 text-xs bg-background" value={clienteFE.email} onChange={(e) => setClienteFE({...clienteFE, email: e.target.value})} placeholder="correo@ejemplo.com" type="email" />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Metodos de pago */}
                      <div>
                        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3 px-1">Método de Pago</p>
                        <div className="grid grid-cols-3 gap-3">
                          <Button variant="outline" onClick={() => setMetodoPago('EFECTIVO')} className={cn("h-20 flex-col gap-2 transition-all bg-card border-border hover:bg-secondary/10 hover:border-secondary/50", metodoPago === 'EFECTIVO' && "border-secondary ring-2 bg-secondary/20 text-secondary ring-secondary/50 shadow-md")}>
                            <Banknote className="w-6 h-6" />
                            <span className="text-xs font-bold uppercase">Efectivo</span>
                          </Button>
                          <Button variant="outline" onClick={() => setMetodoPago('TARJETA')} className={cn("h-20 flex-col gap-2 transition-all bg-card border-border hover:bg-secondary/10 hover:border-secondary/50", metodoPago === 'TARJETA' && "border-secondary ring-2 bg-secondary/20 text-secondary ring-secondary/50 shadow-md")}>
                            <CreditCard className="w-6 h-6" />
                            <span className="text-xs font-bold uppercase">Tarjeta</span>
                          </Button>
                          <Button variant="outline" onClick={() => setMetodoPago('TRANSFERENCIA')} className={cn("h-20 flex-col gap-2 transition-all bg-card border-border hover:bg-secondary/10 hover:border-secondary/50", metodoPago === 'TRANSFERENCIA' && "border-secondary ring-2 bg-secondary/20 text-secondary ring-secondary/50 shadow-md")}>
                            <Smartphone className="w-6 h-6" />
                            <span className="text-xs font-bold uppercase">Transfer</span>
                          </Button>
                        </div>
                      </div>

                      {/* Rating Mesero */}
                      {ratingPendiente && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 p-5 rounded-2xl space-y-4 animate-in fade-in duration-300">
                          <div className="flex items-center justify-between border-b border-yellow-500/20 pb-3">
                            <p className="text-xs font-black uppercase tracking-wider text-yellow-600">Calificar Atención</p>
                            <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-700 px-3 py-1 rounded-full uppercase">🤵 {usuarios.find(u => u.id === activeOrden.meseroId)?.nombre || 'N/A'}</span>
                          </div>
                          <div className="flex justify-center items-center gap-2 py-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setSelectedRating(star)}
                                disabled={isSubmittingRating}
                                className="p-1 hover:scale-125 transition-transform duration-200 focus:outline-none"
                              >
                                <Star className={cn("w-9 h-9 transition-colors duration-200", star <= selectedRating ? "fill-yellow-500 text-yellow-500" : "text-yellow-500/20 hover:text-yellow-500/70")} />
                              </button>
                            ))}
                          </div>
                          
                          {selectedRating > 0 && (
                            <div className="space-y-3 animate-in zoom-in-95 duration-200 pt-2">
                              <Textarea 
                                placeholder="Observaciones de la atención (opcional)"
                                value={ratingObservation}
                                onChange={(e) => setRatingObservation(e.target.value)}
                                disabled={isSubmittingRating}
                                className="h-14 min-h-0 text-xs resize-none bg-background/50 rounded-xl border-yellow-500/30"
                              />
                              <Button 
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-12 text-xs rounded-xl shadow-md uppercase tracking-wider"
                                disabled={isSubmittingRating}
                                onClick={async () => {
                                  if (!activeOrden) return;
                                  setIsSubmittingRating(true);
                                  await updateOrden(activeOrden.id, { 
                                    rating: selectedRating, 
                                    ratingObservacion: ratingObservation || undefined 
                                  });
                                  toast({ title: "Calificación guardada", description: "Ahora puedes proceder con el pago." });
                                  setIsSubmittingRating(false);
                                }}
                              >
                                {isSubmittingRating ? "GUARDANDO..." : "GUARDAR CALIFICACIÓN Y PAGAR"}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {!ratingPendiente && activeOrden?.meseroId && activeOrden.rating && activeOrden.rating > 0 && (
                        <div className="p-4 bg-card border border-border/50 rounded-2xl flex justify-between items-center shadow-sm">
                          <span className="text-[11px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                            🤵 {usuarios.find(u => u.id === activeOrden.meseroId)?.nombre || 'N/A'}
                          </span>
                          <span className="text-yellow-500 font-bold text-sm flex items-center gap-1.5 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                            ⭐ {activeOrden.rating}
                          </span>
                        </div>
                      )}

                      {/* Payment Summary Box */}
                      <div className="bg-card border border-border/50 rounded-[2rem] p-6 lg:p-8 shadow-xl mt-4 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent opacity-50" />
                        
                        <div className="space-y-3 relative z-10">
                          <div className="flex justify-between text-muted-foreground text-sm">
                            <span className="font-bold">Subtotal</span>
                            <span className="font-mono font-bold">${subtotal.toLocaleString('es-CO')}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground text-sm items-center">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">Servicio (Propina)</span>
                            </div>
                            <div className="flex items-center">
                              <span className="mr-1 text-muted-foreground">$</span>
                              <Input 
                                className="w-24 h-8 text-right font-mono font-bold text-sm bg-background/50 border-border/50" 
                                value={propinaPersonalizada ? formatCurrencyInput(Number(propinaPersonalizada)) : ""} 
                                placeholder="0"
                                onChange={(e) => {
                                  const val = parseCurrencyInput(e.target.value);
                                  setPropinaPersonalizada(val === 0 && e.target.value === '' ? '' : val.toString());
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <Separator className="bg-border/50" />

                        <div className="space-y-5 relative z-10">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Total a Pagar</span>
                            <span className="text-5xl lg:text-[3.5rem] font-black text-secondary glow-gold-text leading-none tracking-tighter">${total.toLocaleString('es-CO')}</span>
                          </div>
                          
                          <Button 
                            className="w-full h-16 text-sm lg:text-base font-bold rounded-2xl shadow-lg hover:glow-orange transition-all uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground" 
                            disabled={!metodoPago || isCajaCerrada || ratingPendiente} 
                            onClick={handleCerrarCuenta}
                          >
                            {isCajaCerrada ? "CAJA CERRADA" : (ratingPendiente ? "PENDIENTE CALIFICAR" : (metodoPago ? (tipoFactura === 'ELECTRONICA' ? 'EMITIR FACTURA DIAN' : `CONFIRMAR PAGO EN ${metodoPago}`) : 'SELECCIONA MÉTODO DE PAGO'))}
                          </Button>
                        </div>
                      </div>

                    </div>
                  </ScrollArea>
              </div>
            </div>
          ) : selectedMesaId ? (
            <div className="h-full border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-muted-foreground bg-accent/5 p-8 text-center">
              <Receipt className="w-16 h-16 mb-4 opacity-20" />
              {ordenes.filter(o => String(o.mesaId) === String(selectedMesaId)).length > 0 ? (
                <>
                  <h3 className="text-xl font-headline text-orange-500 mb-2">Mesa sin orden ABIERTA</h3>
                  <p className="text-sm">
                    Esta mesa tiene {ordenes.filter(o => String(o.mesaId) === String(selectedMesaId)).length} orden(es), 
                    pero ninguna en estado ABIERTA. (Estados actuales: {ordenes.filter(o => String(o.mesaId) === String(selectedMesaId)).map(o => o.estado).join(', ')})
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-headline text-destructive mb-2">Mesa sin pedidos registrados</h3>
                  <p className="text-sm">La mesa está marcada como ocupada, pero no tiene ninguna orden asociada en el sistema.</p>
                </>
              )}
            </div>
          ) : (
            <div className="h-full border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-muted-foreground bg-accent/5 p-8">
              <Receipt className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-xl font-headline">Selecciona una mesa para cobrar</h3>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
