
"use client"

import { usePOSStore } from "@/lib/store";
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
  Ban
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { MetodoPago, Orden, ClienteFE, TipoDocumentoFE } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  const { ordenes, mesas, closeOrden, isCajaCerrada } = usePOSStore();
  const { toast } = useToast();
  const [selectedMesaId, setSelectedMesaId] = useState<number | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastClosedOrden, setLastClosedOrden] = useState<Orden | null>(null);
  
  // Facturación Electrónica State
  const [requireFE, setRequireFE] = useState(false);
  const [clienteFE, setClienteFE] = useState<ClienteFE>({
    tipoDocumento: '13',
    numeroDocumento: '',
    nombre: '',
    email: '',
    telefono: '',
    direccion: ''
  });

  const mesasConOrden = mesas.filter(m => 
    m.estado === 'OCUPADA' || m.estado === 'EN PEDIDO' || m.estado === 'LISTA PAGAR'
  );

  const activeOrden = ordenes.find(o => String(o.mesaId) === String(selectedMesaId) && o.estado === 'ABIERTA');

  const subtotal = (activeOrden?.items || []).reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
  const propinaSugerida = subtotal * 0.10;
  const total = subtotal + propinaSugerida;

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
    
    if (requireFE && (!clienteFE.numeroDocumento || !clienteFE.nombre || !clienteFE.email)) {
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
      clienteFE: requireFE ? clienteFE : undefined
    };
    
    setLastClosedOrden(ordenToClose);
    closeOrden(activeOrden.id, selectedMesaId, metodoPago);
    
    setSelectedMesaId(null);
    setMetodoPago(null);
    setRequireFE(false);
    setShowReceipt(true);
    
    toast({ 
      title: requireFE ? "Venta y Factura Exitosa" : "Pago Confirmado", 
      description: `Mesa ${selectedMesaId} pagada con éxito.` 
    });
  };

  const handlePrint = () => {
    window.print();
    toast({ title: "Imprimiendo...", description: "Enviando ticket a la impresora configurada." });
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
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Calculator className="w-4 h-4" /> Mesas Pendientes
          </h3>
          <ScrollArea className="flex-1 h-[200px] lg:h-full">
            <div className="space-y-3 pr-4">
              {mesasConOrden.length === 0 ? (
                <div className="text-center py-10 lg:py-20 opacity-30">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
                  <p className="font-headline">Sin cuentas</p>
                </div>
              ) : (
                mesasConOrden.map((mesa) => (
                  <button
                    key={mesa.id}
                    onClick={() => {setSelectedMesaId(mesa.id); setMetodoPago(null); setRequireFE(false);}}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all wood-texture group",
                      selectedMesaId === mesa.id ? "bg-secondary/20 border-secondary ring-1 ring-secondary" : "bg-card border-border hover:border-secondary/50"
                    )}
                  >
                    <div className="flex justify-between mb-2"><span className="text-xl font-black">MESA {mesa.id}</span></div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3 h-3" /><span>Cuenta Activa</span></div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 overflow-hidden h-full">
          {activeOrden ? (
            <Card className="h-full bg-card border-border paper-texture flex flex-col overflow-hidden">
              <CardHeader className="bg-accent/20 border-b border-border flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <Receipt className="w-6 h-6 text-primary" />
                  <div>
                    <CardTitle className="font-headline text-xl text-foreground">Mesa {selectedMesaId}</CardTitle>
                    <p className="text-[10px] uppercase text-muted-foreground font-mono">Orden: {activeOrden.id}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                  <ScrollArea className="flex-1 p-6 border-r border-border/30">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Consumo</h3>
                    <table className="w-full text-sm">
                      <tbody>
                        {(activeOrden.items || []).map((item) => (
                          <tr key={item.id} className="border-b border-border/30">
                            <td className="py-3 font-bold pr-2">{item.cantidad}x</td>
                            <td className="py-3 text-foreground">{item.nombre}</td>
                            <td className="py-3 text-right font-bold text-foreground">${(item.precioUnitario * item.cantidad).toLocaleString('es-CO')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>

                  <div className="w-full lg:w-96 p-6 bg-accent/10 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-secondary" />
                        <Label htmlFor="fe-toggle" className="font-bold cursor-pointer">Factura Electrónica</Label>
                      </div>
                      <Switch 
                        id="fe-toggle" 
                        checked={requireFE} 
                        onCheckedChange={setRequireFE} 
                      />
                    </div>

                    {requireFE ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold">Tipo Doc.</Label>
                            <Select 
                              value={clienteFE.tipoDocumento} 
                              onValueChange={(val) => setClienteFE({...clienteFE, tipoDocumento: val as TipoDocumentoFE})}
                            >
                              <SelectTrigger className="h-9 text-xs bg-background">
                                <SelectValue />
                              </SelectTrigger>
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
                            <Label className="text-[10px] uppercase font-bold">Número</Label>
                            <Input 
                              className="h-9 text-xs bg-background" 
                              value={clienteFE.numeroDocumento}
                              onChange={(e) => setClienteFE({...clienteFE, numeroDocumento: e.target.value})}
                              placeholder="123456789"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase font-bold">Nombre / Razón Social</Label>
                          <div className="relative">
                            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input 
                              className="h-9 pl-8 text-xs bg-background" 
                              value={clienteFE.nombre}
                              onChange={(e) => setClienteFE({...clienteFE, nombre: e.target.value})}
                              placeholder="Juan Pérez SAS"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase font-bold">Correo Electrónico</Label>
                          <div className="relative">
                            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input 
                              className="h-9 pl-8 text-xs bg-background" 
                              value={clienteFE.email}
                              onChange={(e) => setClienteFE({...clienteFE, email: e.target.value})}
                              placeholder="correo@ejemplo.com"
                              type="email"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase font-bold">Teléfono</Label>
                          <div className="relative">
                            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input 
                              className="h-9 pl-8 text-xs bg-background" 
                              value={clienteFE.telefono}
                              onChange={(e) => setClienteFE({...clienteFE, telefono: e.target.value})}
                              placeholder="300 123 4567"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-40 text-center py-10 border-2 border-dashed border-border rounded-2xl">
                        <ShieldCheck className="w-12 h-12 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">Factura POS</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-accent/40 p-4 md:p-8 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Método de Pago</p>
                      <div className="grid grid-cols-3 gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => setMetodoPago('EFECTIVO')} 
                          className={cn(
                            "h-20 flex-col gap-2 transition-all border-border hover:bg-secondary/10", 
                            metodoPago === 'EFECTIVO' && "border-secondary ring-2 bg-secondary/20 text-secondary ring-secondary/50"
                          )}
                        >
                          <Banknote className="w-6 h-6" />
                          <span className="text-xs font-bold">Efectivo</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setMetodoPago('TARJETA')} 
                          className={cn(
                            "h-20 flex-col gap-2 transition-all border-border hover:bg-secondary/10", 
                            metodoPago === 'TARJETA' && "border-secondary ring-2 bg-secondary/20 text-secondary ring-secondary/50"
                          )}
                        >
                          <CreditCard className="w-6 h-6" />
                          <span className="text-xs font-bold">Tarjeta</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setMetodoPago('TRANSFERENCIA')} 
                          className={cn(
                            "h-20 flex-col gap-2 transition-all border-border hover:bg-secondary/10", 
                            metodoPago === 'TRANSFERENCIA' && "border-secondary ring-2 bg-secondary/20 text-secondary ring-secondary/50"
                          )}
                        >
                          <Smartphone className="w-6 h-6" />
                          <span className="text-xs font-bold">Transfer</span>
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Subtotal:</span>
                        <span className="font-bold text-foreground">${subtotal.toLocaleString('es-CO')}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Servicio (10%):</span>
                        <span className="font-bold text-foreground">${propinaSugerida.toLocaleString('es-CO')}</span>
                      </div>
                      <Separator className="bg-border/50" />
                      <div className="flex justify-between items-end py-2">
                        <span className="text-lg font-headline text-foreground">TOTAL:</span>
                        <span className="text-4xl font-black text-secondary glow-gold-text">${total.toLocaleString('es-CO')}</span>
                      </div>
                      <Button 
                        className="w-full h-14 text-lg font-bold rounded-xl mt-4 shadow-lg hover:glow-orange transition-all" 
                        disabled={!metodoPago || isCajaCerrada} 
                        onClick={handleCerrarCuenta}
                      >
                        {isCajaCerrada ? "CAJA CERRADA" : (metodoPago ? (requireFE ? 'EMITIR FACTURA DIAN' : `CONFIRMAR PAGO EN ${metodoPago}`) : 'SELECCIONA PAGO')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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

      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-[400px] p-0 overflow-hidden bg-white text-black border-none rounded-none sm:rounded-none font-mono">
          <div className="p-8 space-y-4">
            <div className="text-center space-y-1">
              <div className="text-3xl mb-2">🤠</div>
              <h1 className="text-xl font-black uppercase tracking-tighter">La Cabaña</h1>
              <p className="text-[10px] font-bold">CARNE AL BARRIL & PARRILLA</p>
              <p className="text-[9px]">NIT: 900.123.456-7</p>
              <p className="text-[9px]">Calle 123 # 45 - 67, Bogotá</p>
              
              {lastClosedOrden?.clienteFE && (
                <div className="mt-4 border-y border-black/10 py-2">
                  <p className="text-[11px] font-black uppercase">Factura Electrónica</p>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-black/30 pt-4 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>FECHA: {new Date().toLocaleDateString()}</span>
                <span>MESA: {lastClosedOrden?.mesaId}</span>
              </div>
              {lastClosedOrden?.clienteFE && (
                <div className="mt-2 pt-2 border-t border-black/5">
                  <p className="font-bold">CLIENTE: {lastClosedOrden.clienteFE.nombre}</p>
                  <p>NIT/CC: {lastClosedOrden.clienteFE.numeroDocumento}</p>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-black/30 pt-4">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-left border-b border-dashed border-black/20">
                    <th className="pb-1 font-bold">CANT</th>
                    <th className="pb-1 font-bold">PRODUCTO</th>
                    <th className="pb-1 text-right font-bold">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-black/10">
                  {lastClosedOrden?.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 align-top">{item.cantidad}</td>
                      <td className="py-2 pr-2">{item.nombre}</td>
                      <td className="py-2 text-right align-top">${(item.precioUnitario * item.cantidad).toLocaleString('es-CO')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-dashed border-black/30 pt-4 space-y-1 text-xs">
              <div className="flex justify-between font-black text-sm pt-2 border-t border-black/10">
                <span>TOTAL:</span>
                <span>${((lastClosedOrden?.items.reduce((acc, i) => acc + (i.precioUnitario * i.cantidad), 0) || 0) * 1.1).toLocaleString('es-CO')}</span>
              </div>
            </div>

            <div className="pt-4 text-center space-y-2">
              <div className="inline-block border border-black px-4 py-1 text-[10px] font-black uppercase">
                PAGADO: {lastClosedOrden?.metodoPago}
              </div>
              <p className="text-[9px] italic mt-4">"Gracias por preferir el sabor del barril"</p>
            </div>

            <div className="flex flex-col gap-2 pt-6 print:hidden">
              <Button onClick={handlePrint} className="w-full bg-black text-white hover:bg-zinc-800 gap-2 font-bold">
                <Printer className="w-4 h-4" /> IMPRIMIR
              </Button>
              <Button variant="outline" className="border-black text-black gap-2 text-xs" onClick={() => setShowReceipt(false)}>
                CERRAR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
