
"use client"

import { AppSidebar } from "@/components/layout/AppSidebar";
import { usePOSStore } from "@/lib/store";
import { 
  CircleDollarSign, 
  Receipt, 
  CreditCard, 
  Banknote, 
  Calculator,
  Trash2,
  Printer,
  ChevronRight,
  Clock,
  User,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function CajaPage() {
  const { ordenes, mesas, closeOrden } = usePOSStore();
  const { toast } = useToast();
  const [selectedMesaId, setSelectedMesaId] = useState<number | null>(null);

  // Filtrar mesas que tienen órdenes abiertas
  const mesasConOrden = mesas.filter(m => 
    m.estado === 'OCUPADA' || m.estado === 'EN PEDIDO' || m.estado === 'LISTA PAGAR'
  );

  const activeMesa = mesas.find(m => m.id === selectedMesaId);
  const activeOrden = ordenes.find(o => o.mesaId === selectedMesaId && o.estado === 'ABIERTA');

  const subtotal = activeOrden?.items.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0) || 0;
  const propinaSugerida = subtotal * 0.10;
  const total = subtotal + propinaSugerida;

  const handleCerrarCuenta = () => {
    if (!activeOrden || !selectedMesaId) return;

    closeOrden(activeOrden.id, selectedMesaId);
    setSelectedMesaId(null);
    toast({
      title: "Cuenta Cerrada",
      description: `La mesa ${selectedMesaId} ha sido liberada y el pago registrado.`,
    });
  };

  const handlePrintPrecuenta = () => {
    toast({
      title: "Imprimiendo Pre-cuenta",
      description: `Enviando a la impresora térmica de caja...`,
    });
  };

  return (
    <div className="flex bg-background min-h-screen">
      <AppSidebar />
      <main className="flex-1 ml-64 p-8 flex flex-col h-screen">
        <header className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <CircleDollarSign className="w-8 h-8 text-secondary" />
              </div>
              <h2 className="text-3xl font-headline text-foreground">Caja y Facturación</h2>
            </div>
            <p className="text-muted-foreground">Gestión de cobros y cierre de mesas 🤠</p>
          </div>
          
          <div className="flex gap-4 bg-accent/30 p-4 rounded-2xl border border-border">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase font-mono">Ventas del Día</p>
              <p className="text-2xl font-black text-secondary">
                ${ordenes.filter(o => o.estado === 'CERRADA').reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex gap-8 overflow-hidden">
          {/* Listado de Mesas Activas */}
          <div className="w-80 flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Mesas por Cobrar
            </h3>
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-4">
                {mesasConOrden.length === 0 ? (
                  <div className="text-center py-20 opacity-30">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-headline">No hay cuentas pendientes</p>
                  </div>
                ) : (
                  mesasConOrden.map((mesa) => (
                    <button
                      key={mesa.id}
                      onClick={() => setSelectedMesaId(mesa.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all wood-texture group",
                        selectedMesaId === mesa.id 
                          ? "bg-secondary/20 border-secondary ring-1 ring-secondary" 
                          : "bg-card border-border hover:border-secondary/50"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xl font-black">MESA {mesa.id}</span>
                        <Badge variant="outline" className={cn(
                          "text-[9px]",
                          mesa.estado === 'LISTA PAGAR' ? "border-orange-500 text-orange-500" : "border-muted-foreground"
                        )}>
                          {mesa.estado}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Hace 25 min</span>
                        <span className="mx-1">•</span>
                        <User className="w-3 h-3" />
                        <span>Mesero 1</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Detalle de Cuenta y Pago */}
          <div className="flex-1">
            {activeOrden ? (
              <Card className="h-full bg-card border-border paper-texture flex flex-col overflow-hidden">
                <CardHeader className="bg-accent/20 border-b border-border flex flex-row items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Receipt className="w-6 h-6 text-primary" />
                    <div>
                      <CardTitle className="font-headline text-xl">Detalle de Cuenta - Mesa {selectedMesaId}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono">ORDEN: {activeOrden.id}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handlePrintPrecuenta} className="gap-2">
                    <Printer className="w-4 h-4" />
                    Imprimir Pre-cuenta
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  <ScrollArea className="flex-1 p-6">
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs font-mono text-muted-foreground border-b border-border/50">
                          <th className="text-left pb-2">CANT</th>
                          <th className="text-left pb-2">PRODUCTO</th>
                          <th className="text-right pb-2">UNIT.</th>
                          <th className="text-right pb-2">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {activeOrden.items.map((item) => (
                          <tr key={item.id} className="border-b border-border/30">
                            <td className="py-3 font-bold">{item.cantidad}</td>
                            <td className="py-3">
                              {item.nombre}
                              {item.notas && <span className="block text-[10px] text-muted-foreground italic">{item.notas}</span>}
                            </td>
                            <td className="py-3 text-right font-mono">${item.precioUnitario.toLocaleString()}</td>
                            <td className="py-3 text-right font-bold font-mono">${(item.precioUnitario * item.cantidad).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>

                  <div className="bg-accent/40 p-8 border-t border-border">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase">Método de Pago</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" className="h-16 flex-col gap-1 border-border bg-background hover:border-secondary hover:text-secondary">
                            <Banknote className="w-5 h-5" />
                            <span className="text-[10px]">Efectivo</span>
                          </Button>
                          <Button variant="outline" className="h-16 flex-col gap-1 border-border bg-background hover:border-secondary hover:text-secondary">
                            <CreditCard className="w-5 h-5" />
                            <span className="text-[10px]">Tarjeta</span>
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal Consumo:</span>
                          <span className="font-bold">${subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Servicio Sugerido (10%):</span>
                          <span className="font-bold">${propinaSugerida.toLocaleString()}</span>
                        </div>
                        <Separator className="bg-border" />
                        <div className="flex justify-between items-end">
                          <span className="text-lg font-headline">TOTAL A PAGAR:</span>
                          <span className="text-4xl font-black text-secondary">${total.toLocaleString()}</span>
                        </div>
                        <Button 
                          className="w-full h-14 bg-primary hover:glow-orange text-lg font-bold rounded-xl mt-4"
                          onClick={handleCerrarCuenta}
                        >
                          CERRAR Y REGISTRAR PAGO
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-muted-foreground bg-accent/5">
                <div className="p-6 bg-accent/20 rounded-full mb-4">
                  <Receipt className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-headline">Selecciona una mesa para cobrar</h3>
                <p className="text-sm">Las cuentas abiertas aparecerán en el listado de la izquierda</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
