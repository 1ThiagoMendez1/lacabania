
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
  Smartphone
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { MetodoPago } from "@/lib/types";

export default function CajaPage() {
  const { ordenes, mesas, closeOrden } = usePOSStore();
  const { toast } = useToast();
  const [selectedMesaId, setSelectedMesaId] = useState<number | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago | null>(null);

  const mesasConOrden = mesas.filter(m => 
    m.estado === 'OCUPADA' || m.estado === 'EN PEDIDO' || m.estado === 'LISTA PAGAR'
  );

  const activeOrden = ordenes.find(o => o.mesaId === selectedMesaId && o.estado === 'ABIERTA');

  const subtotal = activeOrden?.items.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0) || 0;
  const propinaSugerida = subtotal * 0.10;
  const total = subtotal + propinaSugerida;

  const handleCerrarCuenta = () => {
    if (!activeOrden || !selectedMesaId || !metodoPago) return;
    closeOrden(activeOrden.id, selectedMesaId, metodoPago);
    setSelectedMesaId(null);
    setMetodoPago(null);
    toast({ title: "Cuenta Cerrada", description: `Mesa ${selectedMesaId} liberada.` });
  };

  return (
    <main className="p-8 flex flex-col h-full">
      <header className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary/10 rounded-lg"><CircleDollarSign className="w-8 h-8 text-secondary" /></div>
            <h2 className="text-3xl font-headline text-foreground">Caja y Facturación</h2>
          </div>
          <p className="text-muted-foreground">Gestión de cobros y cierre de mesas 🤠</p>
        </div>
      </header>

      <div className="flex-1 flex gap-8 overflow-hidden">
        <div className="w-80 flex flex-col gap-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Calculator className="w-4 h-4" /> Mesas Pendientes
          </h3>
          <ScrollArea className="flex-1">
            <div className="space-y-3 pr-4">
              {mesasConOrden.length === 0 ? (
                <div className="text-center py-20 opacity-30">
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
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3 h-3" /><span>Activa</span></div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1">
          {activeOrden ? (
            <Card className="h-full bg-card border-border paper-texture flex flex-col overflow-hidden">
              <CardHeader className="bg-accent/20 border-b border-border flex flex-row items-center justify-between">
                <div className="flex items-center gap-4"><Receipt className="w-6 h-6 text-primary" /><div><CardTitle className="font-headline text-xl">Mesa {selectedMesaId}</CardTitle></div></div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-6">
                  <table className="w-full text-sm">
                    {activeOrden.items.map((item) => (
                      <tr key={item.id} className="border-b border-border/30">
                        <td className="py-3 font-bold">{item.cantidad}x</td>
                        <td className="py-3">{item.nombre}</td>
                        <td className="py-3 text-right font-bold">${(item.precioUnitario * item.cantidad).toLocaleString()}</td>
                      </tr>
                    ))}
                  </table>
                </ScrollArea>
                <div className="bg-accent/40 p-8 border-t border-border">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Método de Pago</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" onClick={() => setMetodoPago('EFECTIVO')} className={cn("h-16 flex-col gap-1", metodoPago === 'EFECTIVO' && "border-secondary ring-2 text-secondary")}><Banknote className="w-5 h-5" /><span className="text-[10px]">Efectivo</span></Button>
                        <Button variant="outline" onClick={() => setMetodoPago('TARJETA')} className={cn("h-16 flex-col gap-1", metodoPago === 'TARJETA' && "border-secondary ring-2 text-secondary")}><CreditCard className="w-5 h-5" /><span className="text-[10px]">Tarjeta</span></Button>
                        <Button variant="outline" onClick={() => setMetodoPago('TRANSFERENCIA')} className={cn("h-16 flex-col gap-1", metodoPago === 'TRANSFERENCIA' && "border-secondary ring-2 text-secondary")}><Smartphone className="w-5 h-5" /><span className="text-[10px]">Transfer</span></Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm"><span>Subtotal:</span><span className="font-bold">${subtotal.toLocaleString()}</span></div>
                      <div className="flex justify-between text-sm"><span>Servicio (10%):</span><span className="font-bold">${propinaSugerida.toLocaleString()}</span></div>
                      <Separator />
                      <div className="flex justify-between items-end"><span className="text-lg font-headline">TOTAL:</span><span className="text-4xl font-black text-secondary">${total.toLocaleString()}</span></div>
                      <Button className="w-full h-14 text-lg font-bold rounded-xl mt-4" disabled={!metodoPago} onClick={handleCerrarCuenta}>{metodoPago ? `CERRAR (${metodoPago})` : 'ELIGE PAGO'}</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-muted-foreground bg-accent/5">
              <Receipt className="w-12 h-12 mb-4" /><h3 className="text-xl font-headline">Selecciona una mesa</h3>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
