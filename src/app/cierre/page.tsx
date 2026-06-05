"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  CheckCircle,
  AlertTriangle,
  History,
  Lock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePOSStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function CierrePage() {
  const { ordenes, isCajaCerrada, setCajaCerrada, user, fechaOperativa, setFechaOperativa, usuarios } = usePOSStore();
  const { toast } = useToast();
  const [historialCierres, setHistorialCierres] = useState<any[]>([]);
  const [expandedCloseIdx, setExpandedCloseIdx] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
          timestamp: c.timestamp || new Date().toISOString()
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

                  <Button 
                    className="w-full h-14 text-base font-black rounded-2xl shadow-lg hover:shadow-xl transition-all"
                    disabled={isProcessing || totalPedidosHoy === 0}
                    onClick={handleConfirmarCierre}
                  >
                    {isProcessing ? "Procesando..." : "Realizar Cierre de Caja 🔒"}
                  </Button>
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
    </main>
  );
}
