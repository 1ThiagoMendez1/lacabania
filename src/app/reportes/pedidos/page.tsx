"use client"

import React from "react";
import { usePOSStore } from "@/lib/store";
import { 
  ClipboardList, 
  Search, 
  Calendar, 
  UserCircle,
  Receipt,
  Utensils,
  ChevronDown,
  ChevronRight,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import { getOrderIdentifier } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { printReceiptTicket } from "@/lib/printHelper";
import { useToast } from "@/hooks/use-toast";

export default function HistorialPedidosPage() {
  const { ordenes, usuarios, fechaOperativa, mesas, user } = usePOSStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<any | null>(null);
  const { toast } = useToast();

  const handlePrint = async () => {
    if (!orderToPrint) return;
    try {
      const mesero = usuarios.find(u => u.id === orderToPrint.meseroId)?.nombre || 'N/A';
      await printReceiptTicket(orderToPrint, mesero);
      toast({ title: "Copia impresa", description: "Se ha enviado la copia a la impresora de CAJA." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error de Impresión", description: err.message || "Revisa la configuración de la impresora." });
    }
  };

  const toggleOrder = (id: string) => {
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  const closedOrders = useMemo(() => {
    return ordenes
      .filter(o => o.estado === 'CERRADA' && (user?.rol === 'ADMINISTRADOR' || user?.rol === 'CAJERO' || o.meseroId === user?.id))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [ordenes, user]);

  const filteredOrders = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return closedOrders.filter(o => {
      const mesero = usuarios.find(u => u.id === o.meseroId)?.nombre?.toLowerCase() || "";
      const m = mesas.find(x => x.id === o.mesaId);
      const isParaLlevar = m?.zona === 'Para Llevar' || o.mesaId >= 101;
      const mesaStr = isParaLlevar ? `para llevar ${m?.numero || o.mesaId - 100}` : `mesa ${m?.numero || o.mesaId}`;
      const identifier = getOrderIdentifier({ mesaId: o.mesaId, consecutivo: o.consecutivo, id: o.id }).toLowerCase();
      
      return (
        mesero.includes(search) || 
        mesaStr.includes(search) || 
        identifier.includes(search)
      );
    });
  }, [closedOrders, usuarios, mesas, searchTerm]);

  return (
    <main className="p-4 md:p-8 space-y-8">
      {/* Cabecera general */}
      <div className="bg-primary text-primary-foreground p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl wood-texture relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/80 opacity-90 pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/10 shadow-inner">
            <ClipboardList className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black font-headline tracking-tight text-white">Historial de Pedidos</h2>
            <p className="text-sm opacity-90 font-medium mt-1 text-primary-foreground/90">
              Detalle completo de todas las órdenes cerradas y pagadas 📝
            </p>
          </div>
        </div>
      </div>

      <Card className="bg-card border-border shadow-2xl rounded-[2rem] overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between bg-accent/20 border-b border-border/50 p-6 gap-4">
          <CardTitle className="text-lg font-headline flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Registro de Órdenes
          </CardTitle>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar mesa, mesero u orden..." 
                className="pl-10 h-10 bg-background/50 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-accent/10">
                <TableRow className="border-border/50">
                  <TableHead className="text-[11px] font-black uppercase tracking-widest p-4">Orden / Mesa</TableHead>
                  <TableHead className="text-[11px] font-black uppercase tracking-widest p-4">Fecha / Hora</TableHead>
                  <TableHead className="text-[11px] font-black uppercase tracking-widest p-4">Mesero</TableHead>
                  <TableHead className="text-right text-[11px] font-black uppercase tracking-widest p-4">Total & Pago</TableHead>
                  <TableHead className="text-center w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic text-sm">
                      No se encontraron pedidos cerrados que coincidan con la búsqueda.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((o) => {
                    const mesero = usuarios.find(u => u.id === o.meseroId);
                    // Filter out canceled items for total calculation
                    const activeItems = o.items.filter(i => i.estado !== 'CANCELADO');
                    const subtotal = activeItems.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0);
                    const tienePropina = o.clienteNombre !== 'SIN_PROPINA';
                    const total = subtotal * (tienePropina ? 1.1 : 1.0);
                    const isExpanded = expandedOrderId === o.id;
                    
                    return (
                      <React.Fragment key={o.id}>
                        <TableRow 
                          className="border-border/50 hover:bg-accent/10 transition-colors group cursor-pointer"
                          onClick={() => toggleOrder(o.id)}
                        >
                          <TableCell className="p-4">
                            <div className="flex flex-col gap-1.5">
                              <Badge variant="secondary" className="bg-primary text-primary-foreground shadow-sm w-fit font-black text-sm px-2.5 py-0.5 tracking-wider">
                                {getOrderIdentifier({ mesaId: o.mesaId, consecutivo: o.consecutivo, id: o.id })}
                              </Badge>
                              <span className="text-[10px] font-mono text-muted-foreground font-bold tracking-widest uppercase flex items-center gap-2">
                                {(() => {
                                  const m = mesas.find(x => x.id === o.mesaId);
                                  const isParaLlevar = m?.zona === 'Para Llevar' || o.mesaId >= 101;
                                  return isParaLlevar ? 'Para Llevar' : `Mesa ${m?.numero || o.mesaId}`;
                                })()}
                                {(() => {
                                  const m = mesas.find(x => x.id === o.mesaId);
                                  const isParaLlevar = m?.zona === 'Para Llevar' || o.mesaId >= 101;
                                  if (isParaLlevar) {
                                    return <Badge className="bg-orange-500/10 text-orange-500 border-none text-[8px] py-0 px-1 uppercase">Llevar</Badge>;
                                  }
                                  return null;
                                })()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="p-4">
                            <div className="flex flex-col text-[11px]">
                              <span className="font-bold text-foreground">
                                {format(new Date(o.updatedAt), "dd MMM yyyy", { locale: es })}
                              </span>
                              <span className="text-muted-foreground flex items-center gap-1 mt-1">
                                <Calendar className="w-3 h-3" /> {format(new Date(o.updatedAt), "hh:mm a")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="p-4">
                            <div className="flex items-center gap-2">
                              <UserCircle className="w-6 h-6 text-muted-foreground" />
                              <span className="font-bold text-sm">
                                {mesero?.nombre || "Desconocido"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right p-4">
                            <div className="flex flex-col items-end gap-1.5">
                              <span className="font-black text-secondary text-lg">
                                ${total.toLocaleString('es-CO')}
                              </span>
                              <Badge className="bg-muted text-muted-foreground text-[10px] font-black tracking-widest border border-border/50 uppercase shadow-sm">
                                {o.metodoPago || "Sin método"}
                              </Badge>
                              {tienePropina && (
                                <span className="text-[9px] text-green-600 font-bold uppercase tracking-widest">
                                  +10% Propina
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center p-4">
                             <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                               {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                             </div>
                          </TableCell>
                        </TableRow>
                        
                        {isExpanded && (
                          <TableRow className="bg-accent/5 hover:bg-accent/5 border-b border-border/50 shadow-inner">
                            <TableCell colSpan={5} className="p-0">
                               <div className="p-6 md:px-8 lg:px-12 animate-in slide-in-from-top-2 fade-in duration-200">
                                  <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                      <Utensils className="w-4 h-4 text-primary"/> Platos del Pedido
                                    </h4>
                                    <Button size="sm" variant="outline" className="text-xs h-7 px-3 gap-2 border-primary text-primary hover:bg-primary hover:text-white" onClick={(e) => { e.stopPropagation(); setOrderToPrint(o); }}>
                                      <Printer className="w-3 h-3" /> Imprimir Copia
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {o.items.map(item => (
                                      <div key={item.id} className="bg-background/80 border border-border/50 rounded-xl p-3 flex justify-between items-start shadow-sm">
                                        <div className="flex items-start gap-2.5">
                                          <div className={`mt-0.5 w-6 h-6 shrink-0 rounded-md flex items-center justify-center text-xs font-black ${item.estado === 'CANCELADO' ? 'bg-destructive/10 text-destructive' : 'bg-secondary/10 text-secondary'}`}>
                                            {item.cantidad}x
                                          </div>
                                          <div className="flex flex-col">
                                            <span className={`text-xs font-bold ${item.estado === 'CANCELADO' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                              {item.nombre}
                                            </span>
                                            {item.notas && (
                                              <span className="text-[10px] text-muted-foreground/80 italic mt-0.5 leading-tight">
                                                * {item.notas}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                          <span className="text-xs font-mono font-bold text-muted-foreground">
                                            ${(item.precioUnitario * item.cantidad).toLocaleString('es-CO')}
                                          </span>
                                          {item.estado === 'CANCELADO' && (
                                            <Badge variant="destructive" className="text-[8px] h-4 px-1 py-0 uppercase mt-1">Cancelado</Badge>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                               </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recibo Dialog */}
      <Dialog open={!!orderToPrint} onOpenChange={(open) => { if (!open) setOrderToPrint(null); }}>
        <DialogContent className="max-w-[400px] p-0 overflow-hidden bg-white text-black border-none rounded-none sm:rounded-none font-mono">
          <DialogTitle className="sr-only">Recibo de Caja</DialogTitle>
          <div className="p-8 space-y-4">
            <div className="text-center space-y-1">
              <div className="text-3xl mb-2">🤠</div>
              <h1 className="text-xl font-black uppercase tracking-tighter">Asadero y Restaurante <br /> La Cabaña</h1>
              {orderToPrint?.consecutivo && (
                <div className="my-2 border border-black py-1">
                  <p className="text-sm font-bold uppercase tracking-widest">
                    {orderToPrint ? getOrderIdentifier({ mesaId: orderToPrint.mesaId, consecutivo: orderToPrint.consecutivo, id: orderToPrint.id }) : ''}
                  </p>
                </div>
              )}
              <p className="text-[9px]">NIT: 1070386281</p>
              <p className="text-[9px]">Calle 6 #4-71</p>
              
              {orderToPrint?.clienteFE && (
                <div className="mt-4 border-y border-black/10 py-2">
                  <p className="text-[11px] font-black uppercase">Factura Electrónica</p>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-black/30 pt-4 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>FECHA: {orderToPrint ? new Date(orderToPrint.updatedAt).toLocaleDateString() : ''}</span>
                <span>
                  PEDIDO: {orderToPrint ? getOrderIdentifier({ mesaId: orderToPrint.mesaId, consecutivo: orderToPrint.consecutivo, id: orderToPrint.id }) : ''}
                </span>
              </div>
              {orderToPrint?.meseroId && (
                <div className="flex justify-between">
                  <span>MESERO:</span>
                  <span className="font-bold">{usuarios.find(u => u.id === orderToPrint.meseroId)?.nombre || 'N/A'}</span>
                </div>
              )}
              {orderToPrint?.clienteFE && (
                <div className="mt-2 pt-2 border-t border-black/5">
                  <p className="font-bold">CLIENTE: {orderToPrint.clienteFE.nombre}</p>
                  <p>NIT/CC: {orderToPrint.clienteFE.numeroDocumento}</p>
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
                  {orderToPrint?.items.map((item: any) => {
                    const isCancelado = item.estado === 'CANCELADO';
                    return (
                      <tr key={item.id} className={isCancelado ? "opacity-60 text-muted-foreground" : ""}>
                        <td className="py-2 align-top">{item.cantidad}</td>
                        <td className="py-2 pr-2">
                          {isCancelado ? `(CANCELADO) ${item.nombre}` : item.nombre}
                        </td>
                        <td className="py-2 text-right align-top">
                          {isCancelado ? "$0" : `$${(item.precioUnitario * item.cantidad).toLocaleString('es-CO')}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-dashed border-black/30 pt-4 space-y-1 text-xs">
              <div className="flex justify-between text-[10px]">
                <span>SUBTOTAL:</span>
                <span>
                  ${(() => {
                    const sub = orderToPrint?.items.filter((i: any) => i.estado !== 'CANCELADO').reduce((acc: number, i: any) => acc + (i.precioUnitario * i.cantidad), 0) || 0;
                    return sub.toLocaleString('es-CO');
                  })()}
                </span>
              </div>
              {orderToPrint?.propina !== undefined && orderToPrint.propina > 0 && (
                <div className="flex justify-between text-[10px]">
                  <span>SERVICIO (PROPINA):</span>
                  <span>
                    ${orderToPrint.propina.toLocaleString('es-CO')}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm pt-2 border-t border-black/10">
                <span>TOTAL:</span>
                <span>
                  ${(() => {
                    const sub = orderToPrint?.items.filter((i: any) => i.estado !== 'CANCELADO').reduce((acc: number, i: any) => acc + (i.precioUnitario * i.cantidad), 0) || 0;
                    const tienePropina = orderToPrint?.propina || 0;
                    return (sub + tienePropina).toLocaleString('es-CO');
                  })()}
                </span>
              </div>
            </div>

            <div className="pt-4 text-center space-y-2">
              <div className="inline-block border border-black px-4 py-1 text-[10px] font-black uppercase">
                PAGADO: {orderToPrint?.metodoPago}
              </div>
              <p className="text-[9px] italic mt-4">"Copia de Factura"</p>
            </div>

            <div className="flex flex-col gap-2 pt-6 print:hidden">
              <Button onClick={handlePrint} className="w-full bg-black text-white hover:bg-zinc-800 gap-2 font-bold">
                <Printer className="w-4 h-4" /> IMPRIMIR
              </Button>
              <Button variant="outline" className="border-black text-black gap-2 text-xs" onClick={() => setOrderToPrint(null)}>
                CERRAR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
