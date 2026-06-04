"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  ClipboardCheck, 
  TrendingUp, 
  Flame, 
  ChefHat, 
  Beer, 
  Map as MapIcon,
  Plus,
  Trash2,
  FileText,
  Calculator,
  ArrowDownCircle,
  ArrowUpCircle,
  Printer,
  CheckCircle
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { cn, formatCurrencyInput, parseCurrencyInput } from "@/lib/utils";
import { usePOSStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Gasto } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const chartData = [
  { name: '12:00', ventas: 450000 },
  { name: '13:00', ventas: 890000 },
  { name: '14:00', ventas: 1200000 },
  { name: '15:00', ventas: 700000 },
  { name: '16:00', ventas: 400000 },
  { name: '17:00', ventas: 300000 },
  { name: '18:00', ventas: 600000 },
  { name: '19:00', ventas: 1100000 },
];

export default function DashboardPage() {
  const { ordenes, mesas, isCajaCerrada, setCajaCerrada, user, fechaOperativa, setFechaOperativa, usuarios } = usePOSStore();
  const { toast } = useToast();
  const [isCorteOpen, setIsCorteOpen] = useState(false);
  const [realEfectivo, setRealEfectivo] = useState<number | null>(null);
  const [notas, setNotas] = useState<string>("");
  const [historialCierres, setHistorialCierres] = useState<any[]>([]);

  useEffect(() => {
    if (isCorteOpen) {
      setRealEfectivo(null);
      setNotas("");
    }
  }, [isCorteOpen]);

  const getOrderLocalDateStr = (createdAt: string) => {
    const d = new Date(createdAt);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - tzOffset)).toISOString().split('T')[0];
  };

  // Cálculos de ventas
  const ventasCerradas = ordenes.filter(o => 
    o.estado === 'CERRADA' && 
    getOrderLocalDateStr(o.updatedAt || o.createdAt) === fechaOperativa
  );
  
  const totalVentasCerradas = ventasCerradas.reduce((acc, o) => 
    acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0);
  
  const ventasPorMetodo = {
    EFECTIVO: ventasCerradas.filter(o => o.metodoPago === 'EFECTIVO').reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0),
    TARJETA: ventasCerradas.filter(o => o.metodoPago === 'TARJETA').reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0),
    TRANSFERENCIA: ventasCerradas.filter(o => o.metodoPago === 'TRANSFERENCIA').reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0),
  };

  const totalPropinas = totalVentasCerradas * 0.10;
  const granTotalRecaudado = totalVentasCerradas + totalPropinas;

  const esperadoEfectivo = ventasPorMetodo.EFECTIVO * 1.10;
  const esperadoTarjeta = ventasPorMetodo.TARJETA * 1.10;
  const esperadoTransferencia = ventasPorMetodo.TRANSFERENCIA * 1.10;

  const closureReportRaw = typeof window !== 'undefined' ? localStorage.getItem(`cierre_${fechaOperativa}`) : null;
  const closureReport = closureReportRaw ? JSON.parse(closureReportRaw) : null;

  const cargarHistorialCierres = async () => {
    let dbCierres: any[] = [];
    try {
      const { data, error } = await supabase
        .from('cierres_diarios')
        .select('*')
        .order('fecha', { ascending: false });
      if (error) {
        console.warn("No se pudo cargar cierres de Supabase:", error.message);
      } else if (data) {
        dbCierres = data;
      }
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
            if (raw) {
              const parsed = JSON.parse(raw);
              localCierres.push(parsed);
            }
          } catch (e) {
            console.error("Error parsing local closure:", e);
          }
        }
      }
    }

    const map = new globalThis.Map<string, any>();
    
    // Process local first
    localCierres.forEach(c => {
      if (c && c.fecha) {
        map.set(c.fecha, {
          fecha: c.fecha,
          esperadoEfectivo: Number(c.esperadoEfectivo || 0),
          esperadoTarjeta: Number(c.esperadoTarjeta || 0),
          esperadoTransferencia: Number(c.esperadoTransferencia || 0),
          realEfectivo: Number(c.realEfectivo || 0),
          diferencia: Number(c.diferencia || 0),
          notas: c.notas || '',
          usuario: c.usuario || 'Cajero',
          timestamp: c.timestamp || new Date().toISOString()
        });
      }
    });

    // Process database
    dbCierres.forEach(c => {
      if (c && c.fecha) {
        const creator = usuarios.find(u => u.id === c.creado_por);
        const userLabel = creator ? creator.nombre : 'Administrador';
        map.set(c.fecha, {
          fecha: c.fecha,
          esperadoEfectivo: Number(c.esperado_efectivo || 0),
          esperadoTarjeta: Number(c.esperado_tarjeta || 0),
          esperadoTransferencia: Number(c.esperado_transferencia || 0),
          realEfectivo: Number(c.real_efectivo || 0),
          diferencia: Number(c.diferencia || 0),
          notas: c.notas || '',
          usuario: userLabel,
          timestamp: c.created_at || new Date().toISOString()
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
    const realVal = realEfectivo || 0;
    const diferencia = realVal - esperadoEfectivo;
    const closureData = {
      fecha: fechaOperativa,
      esperadoEfectivo,
      esperadoTarjeta,
      esperadoTransferencia,
      realEfectivo: realVal,
      diferencia,
      notas,
      usuario: user?.nombre || "Cajero",
      timestamp: new Date().toISOString()
    };
    
    // Guardar localmente primero (síncrono)
    localStorage.setItem(`cierre_${fechaOperativa}`, JSON.stringify(closureData));

    // Guardar en Supabase de forma robusta
    try {
      const payload = {
        fecha: fechaOperativa,
        esperado_efectivo: esperadoEfectivo,
        esperado_tarjeta: esperadoTarjeta,
        esperado_transferencia: esperadoTransferencia,
        real_efectivo: realVal,
        diferencia: diferencia,
        notas: notas,
        creado_por: user?.id || null
      };

      let insertError = null;
      const { error } = await supabase.from('cierres_diarios').insert(payload);
      
      if (error) {
        insertError = error;
        console.warn("No se pudo guardar el cierre en Supabase con creado_por, reintentando con creado_por = null:", error.message);
        
        // Fallback: si el id del usuario no existe en la base de datos de producción/Supabase, guardamos con creado_por = null
        const { error: retryError } = await supabase.from('cierres_diarios').insert({
          ...payload,
          creado_por: null
        });
        
        if (!retryError) {
          insertError = null; // Éxito en el reintento
        } else {
          insertError = retryError;
        }
      }

      if (insertError) {
        console.error("Fallo definitivo al guardar cierre en Supabase:", insertError.message);
        toast({
          variant: "destructive",
          title: "Error al guardar cierre",
          description: `El cierre se guardó localmente en tu navegador pero no se sincronizó con el servidor: ${insertError.message}.`,
        });
      } else {
        toast({
          title: "Cierre de Caja Guardado",
          description: "El reporte se guardó correctamente en el servidor y las ventas del día fueron bloqueadas.",
        });
      }
    } catch (e: any) {
      console.error("Excepción al guardar en Supabase:", e);
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: `No se pudo conectar a la base de datos: ${e.message || e}`,
      });
    }

    // Actualizar estado local y recargar historial de cierres
    setCajaCerrada(true);
    await cargarHistorialCierres();
    setIsCorteOpen(false);
  };

  const handleIniciarSiguienteDia = () => {
    if (!fechaOperativa) return;
    
    // Parsear fecha operativa de forma súper segura
    let currentDate = new Date();
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaOperativa)) {
      const parts = fechaOperativa.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      currentDate = new Date(year, month, day);
    } else {
      const d = new Date();
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localStr = (new Date(d.getTime() - tzOffset)).toISOString().split('T')[0];
      const parts = localStr.split('-');
      currentDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
    
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dd = String(currentDate.getDate()).padStart(2, '0');
    const nextDayStr = `${yyyy}-${mm}-${dd}`;
    
    setFechaOperativa(nextDayStr);
    
    toast({
      title: "Siguiente Día Iniciado",
      description: `Se ha iniciado la jornada para el día ${nextDayStr}. Las ventas ya están habilitadas.`,
    });
    setIsCorteOpen(false);
  };

  const mesasOcupadas = mesas.filter(m => m.estado === 'OCUPADA' || m.estado === 'EN PEDIDO' || m.estado === 'LISTA PAGAR').length;
  const pedidosPendientes = ordenes
    .filter(o => o.estado === 'ABIERTA')
    .reduce((acc, o) => acc + o.items.filter(i => i.estado === 'PENDIENTE' || i.estado === 'EN PREPARACION').length, 0);

  const kpis = [
    { title: "Ventas Hoy", value: `$${totalVentasCerradas.toLocaleString('es-CO')}`, change: "+12.5%", icon: DollarSign, color: "text-green-500" },
    { title: "Mesas Activas", value: `${mesasOcupadas} / ${mesas.length}`, change: `${Math.round((mesasOcupadas/mesas.length)*100)}% Ocupación`, icon: MapIcon, color: "text-secondary" },
    { title: "Pedidos Pendientes", value: pedidosPendientes.toString(), change: "En estaciones", icon: ClipboardCheck, color: "text-primary" },
    { title: "Ticket Promedio", value: `$${totalVentasCerradas > 0 ? Math.round(totalVentasCerradas / ventasCerradas.length).toLocaleString('es-CO') : 0}`, change: "+5% vs ayer", icon: TrendingUp, color: "text-blue-500" },
  ];

  const stations = [
    { name: "Asado", icon: Flame, pending: ordenes.filter(o => o.estado === 'ABIERTA').reduce((acc, o) => acc + o.items.filter(i => i.estacion === 'ASADO' && i.estado !== 'LISTO' && i.estado !== 'ENTREGADO').length, 0), color: "bg-primary" },
    { name: "Cocina", icon: ChefHat, pending: ordenes.filter(o => o.estado === 'ABIERTA').reduce((acc, o) => acc + o.items.filter(i => i.estacion === 'COCINA' && i.estado !== 'LISTO' && i.estado !== 'ENTREGADO').length, 0), color: "bg-secondary" },
    { name: "Bar", icon: Beer, pending: ordenes.filter(o => o.estado === 'ABIERTA').reduce((acc, o) => acc + o.items.filter(i => i.estacion === 'BAR' && i.estado !== 'LISTO' && i.estado !== 'ENTREGADO').length, 0), color: "bg-blue-600" },
  ];

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-headline text-foreground">Panel de Control</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">Bienvenido al corazón de La Cabaña 🤠</p>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 font-mono font-bold text-[10px] px-2 py-0.5">
              Fecha Operativa: {fechaOperativa}
            </Badge>
          </div>
        </div>
        
        <Dialog open={isCorteOpen} onOpenChange={setIsCorteOpen}>
          <DialogTrigger asChild>
            <div className="bg-card px-4 py-2 rounded-xl border border-border flex items-center gap-4 cursor-pointer hover:border-primary/50 transition-all shadow-lg group">
              <div className="text-right">
                <p className="text-[10px] font-mono uppercase text-muted-foreground">
                  {isCajaCerrada ? "Caja Cerrada" : "Cierre Actual"}
                </p>
                <p className="font-bold text-secondary text-xl group-hover:text-primary transition-colors">
                  ${totalVentasCerradas.toLocaleString('es-CO')}
                </p>
              </div>
              <div className="w-px h-10 bg-border" />
              <Button className={cn(
                "px-6 py-2 rounded-xl text-sm font-black transition-all",
                isCajaCerrada ? "bg-green-600 hover:bg-green-700 text-white" : "bg-primary text-primary-foreground hover:glow-orange"
              )}>
                {isCajaCerrada ? "VER CORTE" : "HACER CORTE"}
              </Button>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-border paper-texture rounded-[2rem] text-foreground">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className={cn(
                  "p-3 rounded-2xl",
                  isCajaCerrada ? "bg-green-500/20 text-green-500" : "bg-primary/20 text-primary"
                )}>
                  <Calculator className="w-8 h-8" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-headline">
                    {isCajaCerrada ? "Corte de Caja Diario Realizado" : "Corte de Caja Diario"}
                  </DialogTitle>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                    {isCajaCerrada ? "Resumen de ventas y diferencias (Solo Lectura)" : "Verificación y Cierre de Ventas"}
                  </p>
                </div>
              </div>
            </DialogHeader>

            {isCajaCerrada && closureReport ? (
              // VISTA REPORT (CAJA CERRADA)
              <div className="space-y-6 py-4">
                <div className="bg-green-500/10 border-2 border-green-500/30 text-green-400 p-4 rounded-2xl flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 animate-pulse" />
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-white">Ventas Bloqueadas</h4>
                      <p className="text-[10px] font-medium opacity-90 text-muted-foreground">La caja de hoy está oficialmente cerrada.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary">Dinero Esperado (con Propina)</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-accent/20 p-3 rounded-xl border border-border/50 text-center">
                      <span className="text-[10px] text-muted-foreground uppercase block font-bold">Efectivo</span>
                      <span className="text-sm font-black">${closureReport.esperadoEfectivo.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="bg-accent/20 p-3 rounded-xl border border-border/50 text-center">
                      <span className="text-[10px] text-muted-foreground uppercase block font-bold">Tarjeta</span>
                      <span className="text-sm font-black">${closureReport.esperadoTarjeta.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="bg-accent/20 p-3 rounded-xl border border-border/50 text-center">
                      <span className="text-[10px] text-muted-foreground uppercase block font-bold">Transferencia</span>
                      <span className="text-sm font-black">${closureReport.esperadoTransferencia.toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-accent/20 p-4 rounded-2xl border border-border/50">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-muted-foreground">Efectivo Esperado:</span>
                    <span className="font-black">${closureReport.esperadoEfectivo.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-muted-foreground">Efectivo Real en Caja:</span>
                    <span className="font-black text-white">${closureReport.realEfectivo.toLocaleString('es-CO')}</span>
                  </div>
                  <Separator className="bg-border/30" />
                  <div className="flex justify-between items-center text-base">
                    <span className="font-black">Diferencia:</span>
                    <span className={cn(
                      "font-black px-2.5 py-1 rounded-xl text-xs",
                      closureReport.diferencia === 0 ? "bg-green-500/20 text-green-500" :
                      closureReport.diferencia > 0 ? "bg-blue-500/20 text-blue-400" : "bg-destructive/20 text-destructive"
                    )}>
                      {closureReport.diferencia === 0 ? "CUADRADO 🤠" :
                       closureReport.diferencia > 0 ? `SOBRANTE: +$${closureReport.diferencia.toLocaleString('es-CO')}` :
                       `FALTANTE: -$${Math.abs(closureReport.diferencia).toLocaleString('es-CO')}`}
                    </span>
                  </div>
                </div>

                {(closureReport.notas || closureReport.notes) && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Notas o Novedades:</span>
                    <p className="text-xs bg-accent/10 p-3 rounded-xl border border-border/30 italic text-muted-foreground">
                      "{closureReport.notas || closureReport.notes}"
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono border-t border-border/30 pt-3">
                  <span>Cerrado por: {closureReport.usuario}</span>
                  <span>{new Date(closureReport.timestamp).toLocaleString('es-CO')}</span>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-border/30">
                  <Button variant="ghost" className="rounded-xl" onClick={() => setIsCorteOpen(false)}>
                    Cerrar
                  </Button>
                  <Button
                    onClick={handleIniciarSiguienteDia}
                    className="bg-green-600 hover:bg-green-700 text-white font-black px-6 py-2 rounded-xl text-sm shadow-md hover:shadow-green-500/20"
                  >
                    Iniciar Caja del Siguiente Día 🤠
                  </Button>
                </div>
              </div>
            ) : (
              // FORMULARIO (CAJA ABIERTA)
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                    Desglose Esperado (con Propina 10%)
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-accent/20 p-3 rounded-xl border border-border/50 text-center">
                      <span className="text-[10px] text-muted-foreground uppercase block font-bold">Efectivo</span>
                      <span className="text-sm font-black">${esperadoEfectivo.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="bg-accent/20 p-3 rounded-xl border border-border/50 text-center">
                      <span className="text-[10px] text-muted-foreground uppercase block font-bold">Tarjeta</span>
                      <span className="text-sm font-black">${esperadoTarjeta.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="bg-accent/20 p-3 rounded-xl border border-border/50 text-center">
                      <span className="text-[10px] text-muted-foreground uppercase block font-bold">Transf. (Nequi/Davi)</span>
                      <span className="text-sm font-black">${esperadoTransferencia.toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-primary/5 p-3 rounded-xl border border-primary/20 text-primary">
                    <span className="text-xs font-bold">Total General Esperado:</span>
                    <span className="text-base font-black">${granTotalRecaudado.toLocaleString('es-CO')}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="realEfectivo" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Efectivo Real en Caja (Físico)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-sm">$</span>
                      <Input
                        id="realEfectivo"
                        type="text"
                        placeholder="Ingresa la cantidad física de efectivo"
                        value={realEfectivo !== null ? formatCurrencyInput(realEfectivo) : ""}
                        onChange={(e) => {
                          const parsed = parseCurrencyInput(e.target.value);
                          setRealEfectivo(parsed > 0 ? parsed : null);
                        }}
                        className="pl-7 bg-background/50 h-11 text-base font-mono font-bold"
                      />
                    </div>
                  </div>

                  {realEfectivo !== null && (
                    <div className={cn(
                      "p-4 rounded-xl border flex items-center justify-between text-sm transition-all duration-300",
                      (realEfectivo || 0) - esperadoEfectivo === 0 ? "bg-green-500/10 border-green-500/30 text-green-400" :
                      (realEfectivo || 0) - esperadoEfectivo > 0 ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-destructive/10 border-destructive/30 text-destructive"
                    )}>
                      <span className="font-bold">Diferencia:</span>
                      <span className="font-black text-base">
                        {((realEfectivo || 0) - esperadoEfectivo) === 0 ? "CUADRADO 🤠" :
                         ((realEfectivo || 0) - esperadoEfectivo) > 0 ? `SOBRANTE: +$${((realEfectivo || 0) - esperadoEfectivo).toLocaleString('es-CO')}` :
                         `FALTANTE: -$${Math.abs((realEfectivo || 0) - esperadoEfectivo).toLocaleString('es-CO')}`}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="notas" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Notas o Novedades (Opcional)</Label>
                    <Input
                      id="notas"
                      placeholder="Ej. Faltaron $5000 por cambio o error de cobro"
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      className="bg-background/50 text-xs"
                    />
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button variant="ghost" className="rounded-xl" onClick={() => setIsCorteOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmarCierre}
                    disabled={realEfectivo === null}
                    className="bg-primary hover:glow-orange text-primary-foreground font-black px-6 py-2 h-11 rounded-xl text-sm"
                  >
                    Confirmar y Guardar Cierre 🤠
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, i) => (
          <Card key={i} className="bg-card/50 border-border paper-texture shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className={cn("w-5 h-5", kpi.color)} />
                <span className="text-[10px] font-mono text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                  {kpi.change}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{kpi.title}</p>
              <h3 className="text-2xl font-bold mt-1">{kpi.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-card border-border shadow-xl rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-accent/20 border-b border-border/50">
            <CardTitle className="text-lg font-headline">Flujo de Ventas (Hoy)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2E1D12" />
                  <XAxis dataKey="name" stroke="#A08060" fontSize={12} />
                  <YAxis stroke="#A08060" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#2C1810', border: '1px solid #3D2414', borderRadius: '8px' }}
                    itemStyle={{ color: '#F5E6D3' }}
                  />
                  <Bar dataKey="ventas" fill="#C4501A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card border-border border-l-4 border-l-secondary shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-accent/10">
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <Flame className="w-5 h-5 text-secondary" />
                Estado de Estaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {stations.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-accent/30 rounded-xl border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg shadow-inner", s.color)}>
                      <s.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black">{s.pending}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono">Pend.</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border border-l-4 border-l-primary shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5 text-primary" />
                Alertas Críticas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-sm font-bold">Costilla al Barril</span>
                  <span className="text-[10px] opacity-70">Stock agotándose</span>
                </div>
                <Badge className="bg-destructive font-black">8 kg</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-sm font-bold">Punta Trasera</span>
                  <span className="text-[10px] opacity-70">Pedido sugerido</span>
                </div>
                <Badge className="bg-yellow-500 text-black font-black">12 kg</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historial de Cierres Diarios */}
      <Card className="mt-8 bg-card border-border shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-accent/20 border-b border-border/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Historial de Cierres Diarios
            </CardTitle>
            <p className="text-xs text-muted-foreground">Listado de arqueos de caja realizados en el sistema</p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {historialCierres.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm font-medium">
              No hay cierres de caja registrados en el historial.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    <th className="pb-3 pl-2">Fecha</th>
                    <th className="pb-3 text-right">Efectivo Esperado</th>
                    <th className="pb-3 text-right">Otros Métodos</th>
                    <th className="pb-3 text-right">Efectivo Real</th>
                    <th className="pb-3 text-center">Diferencia</th>
                    <th className="pb-3 pl-4">Notas / Novedades</th>
                    <th className="pb-3 pr-2 text-right">Cajero</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-sm">
                  {historialCierres.map((c, idx) => {
                    const esperadoOtros = c.esperadoTarjeta + c.esperadoTransferencia;
                    return (
                      <tr key={idx} className="hover:bg-accent/5 transition-colors">
                        <td className="py-3.5 pl-2 font-mono font-bold text-foreground">
                          {c.fecha}
                        </td>
                        <td className="py-3.5 text-right font-medium">
                          ${c.esperadoEfectivo.toLocaleString('es-CO')}
                        </td>
                        <td className="py-3.5 text-right text-muted-foreground">
                          ${esperadoOtros.toLocaleString('es-CO')}
                        </td>
                        <td className="py-3.5 text-right font-bold text-white">
                          ${c.realEfectivo.toLocaleString('es-CO')}
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded-lg text-xs font-black inline-block",
                            c.diferencia === 0 ? "bg-green-500/20 text-green-400" :
                            c.diferencia > 0 ? "bg-blue-500/20 text-blue-400" : "bg-destructive/20 text-destructive-foreground text-red-400"
                          )}>
                            {c.diferencia === 0 ? "Cuadrado" :
                             c.diferencia > 0 ? `+ $${c.diferencia.toLocaleString('es-CO')}` :
                             `- $${Math.abs(c.diferencia).toLocaleString('es-CO')}`}
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 text-xs italic text-muted-foreground max-w-[250px] truncate" title={c.notas}>
                          {c.notas || "Sin novedades"}
                        </td>
                        <td className="py-3.5 pr-2 text-right font-medium text-muted-foreground">
                          {c.usuario}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
