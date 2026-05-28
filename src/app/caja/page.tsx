
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
  User,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  X,
  Share2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { MetodoPago, Orden } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CajaPage() {
  const { ordenes, mesas, closeOrden } = usePOSStore();
  const { toast } = useToast();
  const [selectedMesaId, setSelectedMesaId] = useState<number | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastClosedOrden, setLastClosedOrden] = useState<Orden | null>(null);

  const mesasConOrden = mesas.filter(m => 
    m.estado === 'OCUPADA' || m.estado === 'EN PEDIDO' || m.estado === 'LISTA PAGAR'
  );

  const activeOrden = ordenes.find(o => o.mesaId === selectedMesaId && o.estado === 'ABIERTA');

  const subtotal = activeOrden?.items.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0) || 0;
  const propinaSugerida = subtotal * 0.10;
  const total = subtotal + propinaSugerida;

  const handleCerrarCuenta = () => {
    if (!activeOrden || !selectedMesaId || !metodoPago) return;
    
    // Guardamos una copia para el recibo antes de cerrarla
    const ordenToClose = { ...activeOrden, metodoPago, estado: 'CERRADA' as const };
    setLastClosedOrden(ordenToClose);
    
    closeOrden(activeOrden.id, selectedMesaId, metodoPago);
    setSelectedMesaId(null);
    setMetodoPago(null);
    setShowReceipt(true);
    
    toast({ title: "Pago Confirmado", description: `Mesa ${selectedMesaId} pagada con éxito.` });
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

      <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden print:hidden">
        {/* Listado de Mesas */}
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
                    onClick={() => {setSelectedMesaId(mesa.id); setMetodoPago(null);}}
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

        {/* Detalle de Cuenta */}
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
                <ScrollArea className="flex-1 p-6">
                  <table className="w-full text-sm">
                    <tbody>
                      {activeOrden.items.map((item) => (
                        <tr key={item.id} className="border-b border-border/30">
                          <td className="py-3 font-bold pr-2">{item.cantidad}x</td>
                          <td className="py-3 text-foreground">{item.nombre}</td>
                          <td className="py-3 text-right font-bold text-foreground">${(item.precioUnitario * item.cantidad).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
                
                <div className="bg-accent/40 p-4 md:p-8 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Metodos de Pago */}
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

                    {/* Totales */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Subtotal:</span>
                        <span className="font-bold text-foreground">${subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Servicio Sugerido (10%):</span>
                        <span className="font-bold text-foreground">${propinaSugerida.toLocaleString()}</span>
                      </div>
                      <Separator className="bg-border/50" />
                      <div className="flex justify-between items-end py-2">
                        <span className="text-lg font-headline text-foreground">TOTAL:</span>
                        <span className="text-4xl font-black text-secondary glow-gold-text">${total.toLocaleString()}</span>
                      </div>
                      <Button 
                        className="w-full h-14 text-lg font-bold rounded-xl mt-4 shadow-lg hover:glow-orange transition-all" 
                        disabled={!metodoPago} 
                        onClick={handleCerrarCuenta}
                      >
                        {metodoPago ? `CONFIRMAR PAGO EN ${metodoPago}` : 'SELECCIONA PAGO'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-muted-foreground bg-accent/5 p-8">
              <Receipt className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-xl font-headline">Selecciona una mesa para cobrar</h3>
              <p className="text-sm text-center mt-2 max-w-xs">Elige una de las mesas activas a la izquierda para ver el detalle de su cuenta.</p>
            </div>
          )}
        </div>
      </div>

      {/* Dialogo de Recibo Profesional */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-[400px] p-0 overflow-hidden bg-white text-black border-none rounded-none sm:rounded-none font-mono">
          <div className="p-8 space-y-4">
            {/* Cabecera del Recibo */}
            <div className="text-center space-y-1">
              <div className="text-3xl mb-2">🤠</div>
              <h1 className="text-xl font-black uppercase tracking-tighter">La Cabaña</h1>
              <p className="text-[10px] font-bold">CARNE AL BARRIL & PARRILLA</p>
              <p className="text-[9px]">NIT: 900.123.456-7</p>
              <p className="text-[9px]">Calle 123 # 45 - 67, Bogotá</p>
              <p className="text-[9px]">Tel: (601) 234 5678</p>
            </div>

            <div className="border-t border-dashed border-black/30 pt-4 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>FECHA: {new Date().toLocaleDateString()}</span>
                <span>HORA: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span>ORDEN: {lastClosedOrden?.id.split('-')[2] || '001'}</span>
                <span>MESA: {lastClosedOrden?.mesaId}</span>
              </div>
              <div>MESERO: {lastClosedOrden?.meseroId === '2' ? 'Juan Mesero' : 'Admin'}</div>
            </div>

            {/* Items */}
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
                      <td className="py-2 text-right align-top">${(item.precioUnitario * item.cantidad).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="border-t border-dashed border-black/30 pt-4 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span>${(lastClosedOrden?.items.reduce((acc, i) => acc + (i.precioUnitario * i.cantidad), 0) || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>PROPINA (10%):</span>
                <span>${((lastClosedOrden?.items.reduce((acc, i) => acc + (i.precioUnitario * i.cantidad), 0) || 0) * 0.1).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-2 border-t border-black/10">
                <span>TOTAL A PAGAR:</span>
                <span>${((lastClosedOrden?.items.reduce((acc, i) => acc + (i.precioUnitario * i.cantidad), 0) || 0) * 1.1).toLocaleString()}</span>
              </div>
            </div>

            {/* Info de Pago */}
            <div className="pt-4 text-center space-y-2">
              <div className="inline-block border border-black px-4 py-1 text-[10px] font-black uppercase">
                PAGADO CON: {lastClosedOrden?.metodoPago}
              </div>
              <p className="text-[9px] italic mt-4">"Gracias por preferir el sabor del barril"</p>
              <p className="text-[8px] opacity-60">Software POS: La Cabaña System v1.0</p>
            </div>

            <div className="flex flex-col gap-2 pt-6 print:hidden">
              <Button onClick={handlePrint} className="w-full bg-black text-white hover:bg-zinc-800 gap-2 font-bold">
                <Printer className="w-4 h-4" /> IMPRIMIR TICKET
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="border-black text-black gap-2 text-xs" onClick={() => setShowReceipt(false)}>
                  <X className="w-3 h-3" /> CERRAR
                </Button>
                <Button variant="outline" className="border-black text-black gap-2 text-xs">
                  <Share2 className="w-3 h-3" /> COMPARTIR
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
