"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  DollarSign, 
  CheckCircle,
  AlertTriangle,
  History,
  Lock,
  ChevronDown,
  ChevronUp,
  Package,
  TrendingUp,
  ClipboardCheck,
  UtensilsCrossed,
  Calculator,
  Receipt,
  Trash2
} from "lucide-react";
import { cn, formatCurrencyInput, parseCurrencyInput } from "@/lib/utils";
import { usePOSStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function CierrePage() {
  const { ordenes, mesas, gastos, isCajaCerrada, setCajaCerrada, user, fechaOperativa, setFechaOperativa, usuarios, addGasto, deleteGasto } = usePOSStore();
  const { toast } = useToast();
  const [historialCierres, setHistorialCierres] = useState<any[]>([]);
  const [expandedCloseIdx, setExpandedCloseIdx] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCierreReport, setSelectedCierreReport] = useState<any | null>(null);
  const [isPreCierreOpen, setIsPreCierreOpen] = useState(false);

  const [gastoCategoria, setGastoCategoria] = useState("Insumos");
  const [gastoDescripcion, setGastoDescripcion] = useState("");
  const [gastoValor, setGastoValor] = useState("");

  const handleDeleteGasto = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este gasto?')) {
      try {
        await deleteGasto(id);
        toast({ title: "Gasto eliminado", description: "El egreso se eliminó correctamente." });
      } catch (err: any) {
        toast({ variant: "destructive", title: "Error", description: err.message });
      }
    }
  };

  const getCostoAsociado = (orden: any) => {
    return orden.items.reduce((sum: number, item: any) => sum + ((item.costoProveedor || 0) * item.cantidad), 0);
  };

  // Funciones de fecha
  const getOrderLocalDateStr = (createdAt: string) => {
    const d = new Date(createdAt);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - tzOffset)).toISOString().split('T')[0];
  };

  const getFullDateLabel = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${daysOfWeek[date.getDay()]}, ${day} de ${months[date.getMonth()]} de ${year}`;
  };

  const getFechaSiguiente = (dateStr: string) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return "";
    const parts = dateStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    date.setDate(date.getDate() + 1);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Cálculos de ventas
  const ventasCerradas = ordenes.filter(o => 
    o.estado === 'CERRADA' && 
    getOrderLocalDateStr(o.updatedAt || o.createdAt) === fechaOperativa
  );
  
  const totalVentasCerradas = ventasCerradas.reduce((acc, o) => 
    acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0);
  
  const totalPropinas = ventasCerradas.reduce((acc, o) => {
    const sub = o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0);
    const tienePropina = o.clienteNombre !== 'SIN_PROPINA';
    return acc + (tienePropina ? sub * 0.10 : 0);
  }, 0);

  const esperadoEfectivo = ventasCerradas.filter(o => o.metodoPago === 'EFECTIVO').reduce((acc, o) => {
    const sub = o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0);
    const tienePropina = o.clienteNombre !== 'SIN_PROPINA';
    return acc + sub + (tienePropina ? sub * 0.10 : 0);
  }, 0);

  const esperadoTarjeta = ventasCerradas.filter(o => o.metodoPago === 'TARJETA').reduce((acc, o) => {
    const sub = o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0);
    const tienePropina = o.clienteNombre !== 'SIN_PROPINA';
    return acc + sub + (tienePropina ? sub * 0.10 : 0);
  }, 0);

  const esperadoTransferencia = ventasCerradas.filter(o => o.metodoPago === 'TRANSFERENCIA').reduce((acc, o) => {
    const sub = o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0);
    const tienePropina = o.clienteNombre !== 'SIN_PROPINA';
    return acc + sub + (tienePropina ? sub * 0.10 : 0);
  }, 0);

  const granTotalRecaudado = totalVentasCerradas + totalPropinas;

  const ordersToday = ordenes.filter(o => 
    getOrderLocalDateStr(o.updatedAt || o.createdAt) === fechaOperativa
  );
  const pedidosAbiertosHoy = ordersToday.filter(o => o.estado === 'ABIERTA').length;
  const totalPedidosHoy = ordersToday.length;

  const totalMesasHoy = ordersToday.filter(o => {
    const m = mesas.find(x => x.id === o.mesaId);
    return m && m.zona !== 'Para Llevar';
  }).length;
  const totalParaLlevarHoy = totalPedidosHoy - totalMesasHoy;
  const pedidosCerradosHoy = ordersToday.filter(o => o.estado === 'CERRADA').length;
  const costoInsumosHoy = ventasCerradas.reduce((sum, o) => sum + getCostoAsociado(o), 0);
  
  const gastosHoy = gastos.filter(g => g.fecha === fechaOperativa);
  const otrosCostos = gastosHoy.reduce((sum, g) => sum + g.valor, 0);

  const utilidadHoy = totalVentasCerradas - (costoInsumosHoy + otrosCostos);
  const margenHoy = totalVentasCerradas > 0 ? (utilidadHoy / totalVentasCerradas) * 100 : 0;

  const cargarHistorialCierres = async () => {
    let dbCierres: any[] = [];
    try {
      const { data, error } = await supabase
        .from('cierres_diarios')
        .select('*')
        .order('fecha', { ascending: false });
      if (data) dbCierres = data;
    } catch (e) {
      console.warn("Excepción al cargar cierres de Supabase:", e);
    }

    const localCierres: any[] = [];
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cierre_')) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) localCierres.push(JSON.parse(raw));
          } catch (e) { }
        }
      }
    }

    const map = new Map<string, any>();
    localCierres.forEach(c => {
      if (c && c.fecha) {
        map.set(c.fecha, {
          fecha: c.fecha,
          esperadoEfectivo: Number(c.esperadoEfectivo || 0),
          esperadoTarjeta: Number(c.esperadoTarjeta || 0),
          esperadoTransferencia: Number(c.esperadoTransferencia || 0),
          usuario: c.usuario || 'Cajero',
          timestamp: c.timestamp || new Date().toISOString(),
          notas: c.notas || "{}"
        });
      }
    });

    dbCierres.forEach(c => {
      if (c && c.fecha) {
        const creator = usuarios.find(u => u.id === c.creado_por);
        map.set(c.fecha, {
          fecha: c.fecha,
          esperadoEfectivo: Number(c.esperado_efectivo || 0),
          esperadoTarjeta: Number(c.esperado_tarjeta || 0),
          esperadoTransferencia: Number(c.esperado_transferencia || 0),
          usuario: creator ? creator.nombre : 'Administrador',
          timestamp: c.created_at || new Date().toISOString(),
          notas: c.notas || "{}"
        });
      }
    });

    const list = Array.from(map.values()).sort((a: any, b: any) => b.fecha.localeCompare(a.fecha));
    setHistorialCierres(list);
  };

  useEffect(() => {
    cargarHistorialCierres();
  }, [isCajaCerrada, fechaOperativa, usuarios]);

  const handleConfirmarCierre = async () => {
    setIsProcessing(true);
    
    // Simplificado, sin efectivo real
    const closureData = {
      fecha: fechaOperativa,
      esperadoEfectivo,
      esperadoTarjeta,
      esperadoTransferencia,
      realEfectivo: esperadoEfectivo, // Se asume cuadre perfecto
      diferencia: 0,
      notas: "{}",
      usuario: user?.nombre || "Cajero",
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(`cierre_${fechaOperativa}`, JSON.stringify(closureData));

    try {
      let insertError = null;
      const { error } = await supabase.from('cierres_diarios').insert({
        fecha: fechaOperativa,
        esperado_efectivo: esperadoEfectivo,
        esperado_tarjeta: esperadoTarjeta,
        esperado_transferencia: esperadoTransferencia,
        real_efectivo: esperadoEfectivo,
        diferencia: 0,
        notas: "{}",
        creado_por: user?.id || null
      });
      
      if (error) {
        const { error: retryError } = await supabase.from('cierres_diarios').insert({
          fecha: fechaOperativa,
          esperado_efectivo: esperadoEfectivo,
          esperado_tarjeta: esperadoTarjeta,
          esperado_transferencia: esperadoTransferencia,
          real_efectivo: esperadoEfectivo,
          diferencia: 0,
          notas: "{}",
          creado_por: null
        });
        insertError = retryError;
      }

      if (insertError) {
        toast({
          variant: "destructive",
          title: "Error al guardar cierre",
          description: `Guardado localmente. Error en servidor: ${insertError.message}`,
        });
      } else {
        toast({
          title: "Cierre Exitoso",
          description: "Cierre guardado correctamente y día finalizado.",
        });
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: `Error: ${e.message || e}`,
      });
    }

    setCajaCerrada(true);
    await cargarHistorialCierres();
    
    // Iniciar el siguiente día automáticamente
    const sigDia = getFechaSiguiente(fechaOperativa);
    setFechaOperativa(sigDia);
    setCajaCerrada(false);
    setIsProcessing(false);
  };

  return (
    <main className="p-4 md:p-8 animate-fadeIn max-w-5xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-headline text-foreground">Cierre Diario</h2>
        </div>
        <p className="text-sm text-muted-foreground">Resumen de ventas y cierre operativo del día.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LADO IZQUIERDO: RESUMEN Y BOTÓN DE CIERRE */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border shadow-xl rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-accent/10 border-b border-border/40 p-6">
              <CardTitle className="text-xl font-headline flex items-center justify-between">
                <span>Día Operativo: {getFullDateLabel(fechaOperativa)}</span>
                {isCajaCerrada ? (
                  <span className="text-xs bg-red-500/20 text-red-500 px-3 py-1 rounded-full border border-red-500/30">CERRADO</span>
                ) : (
                  <span className="text-xs bg-green-500/20 text-green-500 px-3 py-1 rounded-full border border-green-500/30">ABIERTO</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card/60 p-4 rounded-2xl border border-border/40 text-center shadow-sm">
                  <span className="text-xs text-muted-foreground uppercase block font-bold mb-1">💳 Tarjeta</span>
                  <span className="text-lg font-black text-foreground">${esperadoTarjeta.toLocaleString('es-CO')}</span>
                </div>
                <div className="bg-card/60 p-4 rounded-2xl border border-border/40 text-center shadow-sm">
                  <span className="text-xs text-muted-foreground uppercase block font-bold mb-1">📲 Transferencia</span>
                  <span className="text-lg font-black text-foreground">${esperadoTransferencia.toLocaleString('es-CO')}</span>
                </div>
                <div className="bg-card/60 p-4 rounded-2xl border border-border/40 text-center shadow-sm">
                  <span className="text-xs text-muted-foreground uppercase block font-bold mb-1">💵 Efectivo</span>
                  <span className="text-lg font-black text-foreground">${esperadoEfectivo.toLocaleString('es-CO')}</span>
                </div>
              </div>

              <div className="flex justify-between items-center bg-primary/10 p-5 rounded-2xl border border-primary/20">
                <span className="text-sm font-bold text-primary uppercase">Total Ventas (Incluye Propina):</span>
                <span className="text-2xl font-black text-primary">${granTotalRecaudado.toLocaleString('es-CO')}</span>
              </div>

              {!isCajaCerrada && (
                <div className="pt-4 border-t border-border/40">
                  {totalPedidosHoy === 0 ? (
                    <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-2xl flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 shrink-0" />
                      <p className="text-sm">No se puede realizar el cierre: <strong>No hay pedidos registrados</strong> para este día operativo. Debes registrar al menos un pedido antes de hacer el cierre.</p>
                    </div>
                  ) : pedidosAbiertosHoy > 0 ? (
                    <div className="mb-4 bg-amber-500/10 border border-amber-500/30 text-amber-500 p-4 rounded-2xl flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 animate-pulse shrink-0" />
                      <p className="text-sm">Aún hay {pedidosAbiertosHoy} pedido(s) abiertos. Es recomendable cerrarlos antes de hacer corte.</p>
                    </div>
                  ) : (
                    <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-500 p-4 rounded-2xl flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 shrink-0" />
                      <p className="text-sm font-bold">Todos los pedidos están cerrados. Listo para cierre.</p>
                    </div>
                  )}

                  <Dialog open={isPreCierreOpen} onOpenChange={setIsPreCierreOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full h-14 text-base font-black rounded-2xl shadow-lg hover:shadow-xl transition-all"
                        disabled={isProcessing || totalPedidosHoy === 0}
                      >
                        {isProcessing ? "Procesando..." : "Realizar Cierre de Caja 🔒"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl bg-card border-border paper-texture rounded-[2rem] text-foreground max-h-[95vh] overflow-y-auto">
                      <DialogHeader>
                        <div className="flex items-center gap-4 mb-2 border-b border-border/25 pb-3">
                          <div className="p-3 rounded-2xl text-white bg-primary">
                            <Calculator className="w-7 h-7" />
                          </div>
                          <div>
                            <DialogTitle className="text-2xl font-headline tracking-tight flex items-center justify-between gap-4">
                              <span>1. Pre-Cierre — Revisión Automática</span>
                              {typeof window !== 'undefined' && (
                                <span className="text-[12px] uppercase tracking-widest font-mono text-muted-foreground bg-accent/20 border border-border/50 px-3 py-1 rounded-full whitespace-nowrap">
                                  {format(new Date(), "dd MMM yyyy - hh:mm a", { locale: es })}
                                </span>
                              )}
                            </DialogTitle>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">
                              Revise el estado de la operación antes de cerrar el día.
                            </p>
                          </div>
                        </div>
                      </DialogHeader>
                      
                      <div className="flex items-center justify-center gap-4 py-4 mb-6 border-b border-border/10">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors bg-primary text-primary-foreground">1</div>
                          <span className="text-xs font-black text-foreground">Pre-cierre</span>
                        </div>
                        <div className="w-12 h-0.5 bg-border" />
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors bg-muted text-muted-foreground">2</div>
                          <span className="text-xs font-black text-muted-foreground">Confirmar</span>
                        </div>
                        <div className="w-12 h-0.5 bg-border" />
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors bg-muted text-muted-foreground">3</div>
                          <span className="text-xs font-black text-muted-foreground">Listo</span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl text-center">
                            <div className="flex justify-center mb-1.5 text-primary"><Package className="w-5 h-5" /></div>
                            <span className="text-[10px] text-primary font-black uppercase tracking-wider block">Pedidos</span>
                            <span className="text-xl font-black text-primary mt-0.5 block">{totalPedidosHoy}</span>
                            <span className="text-[9px] text-primary/80 block font-bold mt-0.5">{totalMesasHoy} Mesas | {totalParaLlevarHoy} Llevar</span>
                          </div>
                          <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl text-center">
                            <div className="flex justify-center mb-1.5 text-green-500"><DollarSign className="w-5 h-5" /></div>
                            <span className="text-[10px] text-green-500 font-black uppercase tracking-wider block">Ingresos</span>
                            <span className="text-xl font-black text-green-500 mt-0.5 block">${totalVentasCerradas.toLocaleString('es-CO')}</span>
                          </div>
                          <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl text-center">
                            <div className="flex justify-center mb-1.5 text-amber-600"><TrendingUp className="w-5 h-5" /></div>
                            <span className="text-[10px] text-amber-600 font-black uppercase tracking-wider block">Pagos</span>
                            <span className="text-xl font-black text-amber-600 mt-0.5 block">${(costoInsumosHoy + otrosCostos).toLocaleString('es-CO')}</span>
                          </div>
                          <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl text-center">
                            <div className="flex justify-center mb-1.5 text-purple-500"><Calculator className="w-5 h-5" /></div>
                            <span className="text-[10px] text-purple-500 font-black uppercase tracking-wider block">Utilidad</span>
                            <span className="text-xl font-black text-purple-500 mt-0.5 block">${utilidadHoy.toLocaleString('es-CO')}</span>
                          </div>
                        </div>

                        {/* Quick Register form inside closure dialog (Step 1) */}
                        <div className="bg-accent/10 p-4 rounded-[1.5rem] border border-border/30 space-y-3 shadow-inner">
                          <div className="flex items-center gap-2 mb-1">
                            <Receipt className="w-4 h-4 text-primary" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Registrar Gasto Rápido</h4>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <select
                              value={gastoCategoria}
                              onChange={(e) => {
                                setGastoCategoria(e.target.value);
                                setGastoDescripcion("");
                              }}
                              className="bg-card border border-border/60 text-foreground font-semibold text-[11px] py-2 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary h-10 cursor-pointer shrink-0"
                            >
                              <option value="Insumos">Insumos</option>
                              <option value="Servicios">Servicios</option>
                              <option value="Mantenimiento">Mantenimiento</option>
                              <option value="Diversos">Otros</option>
                            </select>
                            <Input
                              placeholder="Descripción (ej. Compra de limones)"
                              value={gastoDescripcion}
                              onChange={(e) => setGastoDescripcion(e.target.value)}
                              className="h-10 text-[11px] rounded-xl bg-card border-border/60 text-foreground flex-1"
                            />
                            <Input
                              placeholder="Valor (ej. 15.000)"
                              value={gastoValor}
                              onChange={(e) => {
                                const parsed = parseCurrencyInput(e.target.value);
                                setGastoValor(parsed > 0 ? formatCurrencyInput(parsed) : "");
                              }}
                              className="h-10 text-[11px] rounded-xl bg-card border-border/60 text-foreground w-full sm:w-[120px] font-bold"
                            />
                            <Button
                              onClick={async (e) => {
                                e.preventDefault();
                                const val = parseCurrencyInput(gastoValor);
                                if (!gastoDescripcion.trim()) return;
                                if (val <= 0) return;
                                try {
                                  await addGasto({
                                    categoria: gastoCategoria,
                                    descripcion: gastoDescripcion.trim(),
                                    valor: val,
                                    fecha: fechaOperativa || new Date().toISOString().split('T')[0]
                                  });
                                  setGastoDescripcion("");
                                  setGastoValor("");
                                  toast({ title: "Gasto agregado", description: "Se registró el gasto exitosamente." });
                                } catch (err: any) {
                                  toast({ variant: "destructive", title: "Error", description: err.message });
                                }
                              }}
                              className="w-full sm:w-auto bg-primary font-bold text-xs h-10 rounded-xl px-4"
                            >
                              Añadir
                            </Button>
                          </div>

                          {/* List of today's expenses inside closure dialog */}
                          <div className="max-h-[120px] overflow-y-auto pr-1 space-y-1 text-xs border-t border-border/20 pt-2">
                            {gastosHoy.length === 0 && (
                              <div className="text-center text-muted-foreground/50 py-2">No hay gastos adicionales hoy</div>
                            )}
                            {gastosHoy.map((g) => (
                              <div key={g.id} className="flex justify-between items-center py-1.5 border-b border-border/5 last:border-0 group">
                                <div className="flex flex-col">
                                  <span className="font-bold text-[10px]">{g.descripcion}</span>
                                  <span className="text-[9px] text-muted-foreground/70 uppercase tracking-widest">{g.categoria}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-red-500/90 tabular-nums">-${g.valor.toLocaleString('es-CO')}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-5 w-5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDeleteGasto(g.id);
                                    }}
                                    title="Eliminar Gasto"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3 bg-card border border-border/40 p-5 rounded-[1.5rem] shadow-inner">
                          <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-3">
                            <ClipboardCheck className="w-4 h-4 text-primary" /> Checklist de Validaciones
                          </h4>
                          <div className={cn("p-4 rounded-2xl border flex items-center gap-3 transition-all duration-300", pedidosAbiertosHoy > 0 ? "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400")}>
                            {pedidosAbiertosHoy > 0 ? <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse text-amber-500" /> : <CheckCircle className="w-5 h-5 shrink-0 text-green-500" />}
                            <div>
                              <h5 className="text-xs font-black uppercase tracking-wider">Pedidos con estado final registrado</h5>
                              <p className="text-[10px] opacity-80 mt-0.5">{pedidosCerradosHoy} de {totalPedidosHoy} pedidos finalizados</p>
                            </div>
                          </div>
                          <div className={cn("p-4 rounded-2xl border flex items-center gap-3 transition-all duration-300", pedidosAbiertosHoy > 0 ? "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400")}>
                            {pedidosAbiertosHoy > 0 ? <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse text-amber-500" /> : <CheckCircle className="w-5 h-5 shrink-0 text-green-500" />}
                            <div>
                              <h5 className="text-xs font-black uppercase tracking-wider">Pedidos aún en cocina o mesa</h5>
                              <p className="text-[10px] opacity-80 mt-0.5">{pedidosAbiertosHoy} pedidos siguen activos</p>
                            </div>
                          </div>
                          <div className={cn("p-4 rounded-2xl border text-xs font-medium transition-all duration-300 mt-2", totalPedidosHoy === 0 ? "bg-red-500/10 border-red-500/30 text-red-500" : pedidosAbiertosHoy > 0 ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300" : "bg-green-500/10 border-green-500/30 text-green-800 dark:text-green-300")}>
                            {totalPedidosHoy === 0 ? (
                              <p><strong>Error:</strong> No se puede realizar el cierre porque no hay pedidos registrados para el día operativo en curso.</p>
                            ) : pedidosAbiertosHoy > 0 ? (
                              <p><strong>Nota:</strong> Hay items con advertencias. Puede continuar con el cierre, pero se recomienda revisar los puntos señalados.</p>
                            ) : (
                              <p><strong>Excelente:</strong> Todos los pedidos del día se han cerrado con éxito. Listo para arqueo de caja.</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3 bg-card border border-border/40 p-5 rounded-[1.5rem] shadow-inner">
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-3">
                              <TrendingUp className="w-4 h-4 text-green-500" /> Desglose Detallado de Caja
                            </h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between items-center py-1.5 border-b border-border/10"><span className="text-muted-foreground font-medium">💵 Ventas en Efectivo:</span><span className="font-bold text-foreground">${esperadoEfectivo.toLocaleString('es-CO')}</span></div>
                              <div className="flex justify-between items-center py-1.5 border-b border-border/10"><span className="text-muted-foreground font-medium">💳 Ventas con Tarjeta:</span><span className="font-bold text-foreground">${esperadoTarjeta.toLocaleString('es-CO')}</span></div>
                              <div className="flex justify-between items-center py-1.5 border-b border-border/10"><span className="text-muted-foreground font-medium">📲 Ventas por Transferencia:</span><span className="font-bold text-foreground">${esperadoTransferencia.toLocaleString('es-CO')}</span></div>
                              <div className="flex justify-between items-center py-1.5 border-b border-border/10"><span className="text-muted-foreground font-medium">💰 Propinas Totales:</span><span className="font-bold text-foreground text-secondary">${totalPropinas.toLocaleString('es-CO')}</span></div>
                            </div>
                          </div>
                          <div className="space-y-3 bg-card border border-border/40 p-5 rounded-[1.5rem] shadow-inner flex flex-col h-[280px]">
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 shrink-0">
                              <UtensilsCrossed className="w-4 h-4 text-primary" /> Mesas y Pedidos de Hoy
                            </h4>
                            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                              {ordersToday.length === 0 && <p className="text-xs text-muted-foreground text-center py-10 italic">No hay mesas atendidas registradas hoy.</p>}
                              {ordersToday.map((o) => {
                                const closedMesa = mesas.find(m => m.id === o.mesaId);
                                const label = closedMesa?.zona === 'Para Llevar' ? `Llevar - PLL-${o.consecutivo || (o.mesaId >= 101 ? o.mesaId - 100 : o.mesaId)}` : `Mesa ${o.mesaId}`;
                                const subtotal = o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0);
                                const tienePropina = o.clienteNombre !== 'SIN_PROPINA';
                                const totalOrder = subtotal * (tienePropina ? 1.10 : 1.00);
                                const waiterName = usuarios.find(u => u.id === o.meseroId)?.nombre || 'Mesero';
                                return (
                                  <div key={o.id} className="p-2.5 bg-background/50 rounded-xl border border-border/30 flex items-center justify-between text-[11px] gap-2 hover:border-primary/20 transition-all duration-200">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 font-bold text-foreground"><span className="truncate">{label}</span></div>
                                      <div className="text-[9px] text-muted-foreground mt-0.5 truncate">Atendió: {waiterName}</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <div className="font-bold text-foreground">${totalOrder.toLocaleString('es-CO')}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-border/40 pt-4">
                          <Button variant="ghost" onClick={() => setIsPreCierreOpen(false)}>Cancelar</Button>
                          <Button 
                            className="font-black"
                            onClick={() => {
                              setIsPreCierreOpen(false);
                              handleConfirmarCierre();
                            }}
                          >
                            Confirmar y Cerrar Día
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* LADO DERECHO: HISTORIAL */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-border shadow-xl rounded-[2rem] overflow-hidden h-full">
            <CardHeader className="bg-accent/10 border-b border-border/40 p-5">
              <CardTitle className="text-base font-headline flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Historial de Cierres
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto p-4 space-y-3">
                {historialCierres.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground text-sm">
                    No hay cierres registrados.
                  </div>
                ) : (
                  historialCierres.map((cierre, idx) => {
                    const totalCierre = cierre.esperadoEfectivo + cierre.esperadoTarjeta + cierre.esperadoTransferencia;
                    const isExpanded = expandedCloseIdx === idx;
                    
                    return (
                      <div key={idx} className="border border-border/40 rounded-2xl overflow-hidden transition-all bg-background/50 hover:bg-accent/5">
                        <button 
                          onClick={() => setExpandedCloseIdx(isExpanded ? null : idx)}
                          className="w-full p-4 flex justify-between items-center text-left"
                        >
                          <div>
                            <p className="text-xs font-bold text-foreground">{cierre.fecha}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{cierre.usuario}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-sm text-primary">${totalCierre.toLocaleString('es-CO')}</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-0 text-xs border-t border-border/20 mt-1">
                            <div className="grid grid-cols-2 gap-2 mt-3 text-muted-foreground">
                              <div><span className="font-bold block">Efectivo:</span>${cierre.esperadoEfectivo.toLocaleString('es-CO')}</div>
                              <div><span className="font-bold block">Tarjeta:</span>${cierre.esperadoTarjeta.toLocaleString('es-CO')}</div>
                              <div className="col-span-2"><span className="font-bold block">Transf/Nequi:</span>${cierre.esperadoTransferencia.toLocaleString('es-CO')}</div>
                            </div>
                            <div className="mt-3 text-[9px] text-muted-foreground/60 text-right">
                              Sincronizado: {new Date(cierre.timestamp).toLocaleString()}
                            </div>
                            <div className="mt-3">
                              <Button 
                                variant="outline" 
                                className="w-full text-xs font-bold border-primary text-primary hover:bg-primary hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCierreReport(cierre);
                                }}
                              >
                                Ver Reporte Detallado
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* REPORTE DE CIERRE DETALLADO MODAL */}
      {selectedCierreReport && (() => {
        let parsedNotas: any = {};
        try {
          parsedNotas = JSON.parse(selectedCierreReport.notas || "{}");
        } catch(e) {}
        
        const reportOtrosCostos = parsedNotas.otrosCostos || 0;
        const textNotas = parsedNotas.textNotas || "";
        
        const ventasDelDia = ordenes.filter(o => 
          o.estado === 'CERRADA' && 
          getOrderLocalDateStr(o.updatedAt || o.createdAt) === selectedCierreReport.fecha
        );
        
        const ingresosTotales = ventasDelDia.reduce((acc, o) => 
          acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0);
          
        const costoInsumosDelDia = ventasDelDia.reduce((sum, o) => sum + getCostoAsociado(o), 0);
        const utilidadDelDia = ingresosTotales - (costoInsumosDelDia + reportOtrosCostos);
        const margenDelDia = ingresosTotales > 0 ? (utilidadDelDia / ingresosTotales) * 100 : 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-[2rem] paper-texture shadow-2xl relative">
              
              <div className="sticky top-0 bg-card/80 backdrop-blur-md border-b border-border/20 z-10 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-xl text-white">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-headline tracking-tight">Reporte de Cierre de Caja ({selectedCierreReport.fecha})</h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">RESUMEN DE VENTAS Y DIFERENCIAS (SOLO LECTURA)</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCierreReport(null)} className="text-muted-foreground hover:text-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-green-500/10 border-2 border-green-500/30 text-green-400 p-4 rounded-2xl flex items-center gap-3 shadow-md">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-white">Ventas Bloqueadas</h4>
                    <p className="text-[10px] font-medium opacity-90 text-muted-foreground">La caja de ese día está oficialmente cerrada.</p>
                  </div>
                </div>

                {/* KPIs Summary Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl text-center">
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Pedidos</span>
                    <span className="text-lg font-black text-foreground mt-0.5 block">{ventasDelDia.length}</span>
                  </div>
                  <div className="bg-green-500/5 border border-green-500/20 p-4 rounded-2xl text-center">
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Ingresos</span>
                    <span className="text-lg font-black text-green-500 mt-0.5 block">${ingresosTotales.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-2xl text-center">
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Pagos</span>
                    <span className="text-lg font-black text-amber-500 mt-0.5 block">${(costoInsumosDelDia + reportOtrosCostos).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="bg-purple-500/5 border border-purple-500/20 p-4 rounded-2xl text-center">
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Utilidad</span>
                    <span className="text-lg font-black text-primary mt-0.5 block">${utilidadDelDia.toLocaleString('es-CO')}</span>
                  </div>
                </div>

                {/* Financial Analysis Grid */}
                <div className="bg-gradient-to-br from-green-500/5 to-background/50 border border-green-500/20 p-5 rounded-3xl space-y-4 shadow-sm">
                  <h4 className="text-xs font-black uppercase tracking-widest text-green-400 flex items-center gap-1.5 border-b border-border/10 pb-2">
                    📊 Análisis Financiero Automático
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-card/60 p-3 rounded-xl border border-border/40 text-center">
                      <span className="text-[10px] text-muted-foreground uppercase block font-bold">💳 Datáfono (Tarjeta)</span>
                      <span className="text-sm font-black text-white">${selectedCierreReport.esperadoTarjeta.toLocaleString('es-CO')}</span>
                      <span className="text-[9px] text-muted-foreground block mt-0.5">Subtotal: ${(selectedCierreReport.esperadoTarjeta / 1.10).toLocaleString('es-CO')}</span>
                    </div>
                    <div className="bg-card/60 p-3 rounded-xl border border-border/40 text-center">
                      <span className="text-[10px] text-muted-foreground uppercase block font-bold">📲 Transferencias (Nequi/Davi)</span>
                      <span className="text-sm font-black text-white">${selectedCierreReport.esperadoTransferencia.toLocaleString('es-CO')}</span>
                      <span className="text-[9px] text-muted-foreground block mt-0.5">Subtotal: ${(selectedCierreReport.esperadoTransferencia / 1.10).toLocaleString('es-CO')}</span>
                    </div>
                    <div className="bg-card/60 p-3 rounded-xl border border-border/40 text-center">
                      <span className="text-[10px] text-muted-foreground uppercase block font-bold">💵 Efectivo Esperado</span>
                      <span className="text-sm font-black text-white">${selectedCierreReport.esperadoEfectivo.toLocaleString('es-CO')}</span>
                      <span className="text-[9px] text-muted-foreground block mt-0.5">Subtotal: ${(selectedCierreReport.esperadoEfectivo / 1.10).toLocaleString('es-CO')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl text-center">
                      <span className="text-[10px] text-primary uppercase block font-black">Insumos (Costo Platos)</span>
                      <span className="text-base font-black text-primary">${costoInsumosDelDia.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl text-center">
                      <span className="text-[10px] text-green-400 uppercase block font-black">Utilidad Neta</span>
                      <span className="text-base font-black text-green-400">${utilidadDelDia.toLocaleString('es-CO')}</span>
                      <span className="text-[9px] text-green-500/80 block mt-0.5">Margen: {margenDelDia.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-accent/20 p-4 rounded-2xl border border-border/50">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-muted-foreground">Efectivo Esperado:</span>
                    <span className="font-black">${selectedCierreReport.esperadoEfectivo.toLocaleString('es-CO')}</span>
                  </div>
                </div>

                {textNotas && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Notas o Novedades:</span>
                    <p className="text-xs bg-accent/10 p-3 rounded-xl border border-border/30 italic text-muted-foreground">
                      "{textNotas}"
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono border-t border-border/30 pt-3">
                  <span>Cerrado por: {selectedCierreReport.usuario}</span>
                  <span>{new Date(selectedCierreReport.timestamp).toLocaleString('es-CO')}</span>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-border/30">
                  <Button variant="ghost" className="rounded-xl" onClick={() => setSelectedCierreReport(null)}>
                    Cerrar
                  </Button>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

    </main>
  );
}
