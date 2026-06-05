"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { 
  DollarSign, 
  ClipboardCheck, 
  TrendingUp, 
  Flame, 
  ChefHat, 
  Beer, 
  Utensils,
  Map as MapIcon,
  Plus,
  Trash2,
  FileText,
  Calculator,
  ArrowDownCircle,
  ArrowUpCircle,
  Printer,
  CheckCircle,
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  CircleDollarSign,
  Package,
  ArrowRight
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
import { useState, useEffect, useMemo } from "react";
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
  const { ordenes, mesas, isCajaCerrada, setCajaCerrada, user, fechaOperativa, setFechaOperativa, usuarios, productos } = usePOSStore();
  const { toast } = useToast();
  const [isCorteOpen, setIsCorteOpen] = useState(false);
  const [realEfectivo, setRealEfectivo] = useState<number | null>(null);
  const [notas, setNotas] = useState<string>("");
  const [historialCierres, setHistorialCierres] = useState<any[]>([]);
  const [otrosCostos, setOtrosCostos] = useState<number>(0);
  const [incidencias, setIncidencias] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<"dashboard" | "cierre">("dashboard");
  const [cierreStep, setCierreStep] = useState<number>(1);
  const [cierreFecha, setCierreFecha] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedWarningDate, setSelectedWarningDate] = useState<string>("");
  const [expandedCloseIdx, setExpandedCloseIdx] = useState<number | null>(null);
  const [dashboardPeriod, setDashboardPeriod] = useState<'DIA' | 'MES' | 'AÑO'>('DIA');

  const lowStockProducts = useMemo(() => {
    if (!productos) return [];
    return productos
      .filter(p => p.stock <= p.stockMinimo)
      .sort((a, b) => {
        const aIsCritical = a.stock <= a.stockMinimo / 2;
        const bIsCritical = b.stock <= b.stockMinimo / 2;
        if (aIsCritical && !bIsCritical) return -1;
        if (!aIsCritical && bIsCritical) return 1;
        const aRatio = a.stockMinimo > 0 ? a.stock / a.stockMinimo : 0;
        const bRatio = b.stockMinimo > 0 ? b.stock / b.stockMinimo : 0;
        return aRatio - bRatio;
      });
  }, [productos]);

  useEffect(() => {
    if (isCorteOpen) {
      setRealEfectivo(null);
      setNotas("");
      setOtrosCostos(0);
      setIncidencias(0);
      
      const activeDate = cierreFecha || fechaOperativa;
      const isClosed = historialCierres.some(c => c.fecha === activeDate) || 
                       (typeof window !== 'undefined' && !!localStorage.getItem(`cierre_${activeDate}`));
      setCierreStep(isClosed ? 3 : 1);
    }
  }, [isCorteOpen, cierreFecha, fechaOperativa, historialCierres]);

  const getOrderLocalDateStr = (createdAt: string) => {
    const d = new Date(createdAt);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - tzOffset)).toISOString().split('T')[0];
  };

  const getFechaAnterior = (dateStr: string) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return "";
    const parts = dateStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    date.setDate(date.getDate() - 1);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
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

  const parseOtrosCostos = (closure: any) => {
    if (!closure) return 0;
    if (typeof closure.otrosCostos === 'number') return closure.otrosCostos;
    if (closure.notas) {
      try {
        if (closure.notas.trim().startsWith("{")) {
          const parsed = JSON.parse(closure.notas);
          return parsed.otrosCostos || 0;
        }
      } catch (e) {}
    }
    return 0;
  };

  const getCostoAsociado = (order: any) => {
    return (order.items || []).reduce((sum: number, item: any) => {
      const matchingProduct = productos.find(
        (p: any) => p.nombre.toLowerCase().trim() === item.nombre.toLowerCase().trim()
      );
      const unitCost = matchingProduct ? (matchingProduct.costoProveedor || 0) : 0;
      return sum + (unitCost * item.cantidad);
    }, 0);
  };

  const activeCloseDate = cierreFecha || fechaOperativa;

  const openCierreForDate = (dateStr: string) => {
    setCierreFecha(dateStr);
    setIsCorteOpen(true);
  };

  // Cálculos de ventas
  const ventasCerradas = ordenes.filter(o => 
    o.estado === 'CERRADA' && 
    getOrderLocalDateStr(o.updatedAt || o.createdAt) === activeCloseDate
  );
  
  const totalVentasCerradas = ventasCerradas.reduce((acc, o) => 
    acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0);
  
  const totalPropinas = ventasCerradas.reduce((acc, o) => {
    const sub = o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0);
    const tienePropina = o.clienteNombre !== 'SIN_PROPINA';
    return acc + (tienePropina ? sub * 0.10 : 0);
  }, 0);
  const granTotalRecaudado = totalVentasCerradas + totalPropinas;

  const subtotalEfectivo = ventasCerradas.filter(o => o.metodoPago === 'EFECTIVO').reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0);
  const subtotalTarjeta = ventasCerradas.filter(o => o.metodoPago === 'TARJETA').reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0);
  const subtotalTransferencia = ventasCerradas.filter(o => o.metodoPago === 'TRANSFERENCIA').reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0);

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

  const closureReportRaw = typeof window !== 'undefined' ? localStorage.getItem(`cierre_${activeCloseDate}`) : null;
  const closureReport = closureReportRaw ? JSON.parse(closureReportRaw) : null;

  // Nuevos campos extraídos del reporte si ya está cerrado
  let reportOtrosCostos = 0;
  let reportIncidencias = 0;
  let reportTextNotas = "";

  if (closureReport) {
    try {
      if (closureReport.notas && closureReport.notas.trim().startsWith("{")) {
        const parsed = JSON.parse(closureReport.notas);
        reportOtrosCostos = parsed.otrosCostos || 0;
        reportIncidencias = parsed.incidencias || 0;
        reportTextNotas = parsed.textNotas || "";
      } else {
        reportTextNotas = closureReport.notas || "";
      }
    } catch (e) {
      reportTextNotas = closureReport.notas || "";
    }
  }

  // 1. Días sin cerrar
  const datesWithActivity = new Set<string>();
  ordenes.forEach(o => {
    const dateStr = getOrderLocalDateStr(o.updatedAt || o.createdAt);
    if (dateStr < fechaOperativa) {
      datesWithActivity.add(dateStr);
    }
  });
  
  const unclosedDates: string[] = [];
  datesWithActivity.forEach(date => {
    const hasCierre = historialCierres.some(c => c.fecha === date) || 
                      (typeof window !== 'undefined' && !!localStorage.getItem(`cierre_${date}`));
    if (!hasCierre) {
      unclosedDates.push(date);
    }
  });
  unclosedDates.sort((a, b) => b.localeCompare(a));
  const diasSinCerrar = unclosedDates.length;

  const ordersToday = ordenes.filter(o => 
    getOrderLocalDateStr(o.updatedAt || o.createdAt) === activeCloseDate
  );
  const totalPedidosHoy = ordersToday.length;
  const pedidosCerradosHoy = ordersToday.filter(o => o.estado === 'CERRADA' || o.estado === 'ANULADA').length;
  const pedidosAbiertosHoy = ordersToday.filter(o => o.estado === 'ABIERTA').length;

  const ordersMesasHoy = ordersToday.filter(o => {
    const mesa = mesas.find(m => m.id === o.mesaId);
    return mesa && mesa.zona !== 'Para Llevar';
  });
  const totalMesasHoy = ordersMesasHoy.length;
  const totalParaLlevarHoy = ordersToday.length - totalMesasHoy;

  useEffect(() => {
    if (unclosedDates.length > 0 && !selectedWarningDate) {
      setSelectedWarningDate(unclosedDates[0]);
    }
  }, [unclosedDates, selectedWarningDate]);

  // 2. Ventas por día (para promedio e históricos)
  const ventasPorDiaMap = new globalThis.Map<string, number>();
  ordenes.filter(o => o.estado === 'CERRADA').forEach(o => {
    const d = getOrderLocalDateStr(o.updatedAt || o.createdAt);
    const totalOrden = o.items.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
    ventasPorDiaMap.set(d, (ventasPorDiaMap.get(d) || 0) + totalOrden);
  });

  // Asegurar que el día operativo actual esté considerado
  if (!ventasPorDiaMap.has(activeCloseDate)) {
    ventasPorDiaMap.set(activeCloseDate, totalVentasCerradas);
  }

  const totalDias = ventasPorDiaMap.size || 1;
  const sumaVentas = Array.from(ventasPorDiaMap.values()).reduce((sum, val) => sum + val, 0);
  const ingresoPromedio = sumaVentas / totalDias;

  // 3. Costo por día (para margen promedio)
  const costoProductosPorDiaMap = new globalThis.Map<string, number>();
  ordenes.filter(o => o.estado === 'CERRADA').forEach(o => {
    const d = getOrderLocalDateStr(o.updatedAt || o.createdAt);
    const costoOrden = getCostoAsociado(o);
    costoProductosPorDiaMap.set(d, (costoProductosPorDiaMap.get(d) || 0) + costoOrden);
  });

  // 4. Margen promedio histórico
  let totalIngresosHistoricos = 0;
  let totalUtilidadesHistoricas = 0;
  
  const allActiveDates = Array.from(new Set([
    ...Array.from(ventasPorDiaMap.keys()),
    ...historialCierres.map(c => c.fecha),
    activeCloseDate
  ]));

  allActiveDates.forEach(d => {
    const ingresos = ventasPorDiaMap.get(d) || 0;
    const costoProductos = costoProductosPorDiaMap.get(d) || 0;
    
    let otrosCostosVal = 0;
    if (d === activeCloseDate) {
      otrosCostosVal = isCajaCerrada ? reportOtrosCostos : otrosCostos;
    } else {
      const closure = historialCierres.find(c => c.fecha === d);
      otrosCostosVal = parseOtrosCostos(closure);
    }
    
    const utilidad = ingresos - costoProductos - otrosCostosVal;
    totalIngresosHistoricos += ingresos;
    totalUtilidadesHistoricas += utilidad;
  });

  const margenPromedioPct = totalIngresosHistoricos > 0 ? (totalUtilidadesHistoricas / totalIngresosHistoricos) * 100 : 0;

  const totalNominaMensual = usuarios.filter(u => u.estado === 'ACTIVO').reduce((sum, u) => sum + (u.sueldo || 0), 0);
  const totalGastosOperativosHistoricos = historialCierres.reduce((sum, c) => sum + parseOtrosCostos(c), 0);

  // 5. Tasa de eficiencia
  const totalPedidosCerrados = ordenes.filter(o => o.estado === 'CERRADA').length;
  const totalPedidosHistoricos = ordenes.filter(o => o.estado === 'CERRADA' || o.estado === 'ANULADA').length;
  const eficienciaPct = totalPedidosHistoricos > 0 ? (totalPedidosCerrados / totalPedidosHistoricos) * 100 : 100;

  // 6. Ingresos de ayer
  const fechaAyer = getFechaAnterior(activeCloseDate);
  const closureAyer = historialCierres.find(c => c.fecha === fechaAyer);
  const ingresosAyer = ventasPorDiaMap.get(fechaAyer) || (closureAyer ? (closureAyer.esperadoEfectivo + closureAyer.esperadoTarjeta + closureAyer.esperadoTransferencia) / 1.10 : 0) || 0;

  // 7. Tiempos promedio de servicio
  const tiemposServicio = ventasCerradas.map(o => {
    if (o.updatedAt && o.createdAt) {
      const start = new Date(o.createdAt).getTime();
      const end = new Date(o.updatedAt).getTime();
      return Math.max(0, (end - start) / 60000);
    }
    return 0;
  }).filter(t => t > 0);
  const tiempoPromedioServicioStr = tiemposServicio.length > 0
    ? `${Math.round(tiemposServicio.reduce((sum, t) => sum + t, 0) / tiemposServicio.length)} min`
    : "0 min";

  // 8. Generar Reporte Markdown
  const generarReporteMarkdown = (
    fechaVal: string,
    ventasHoyVal: number,
    gastosInputVal: number,
    incidenciasInputVal: number,
    notasInputVal: string
  ) => {
    const isSube = ventasHoyVal >= ingresosAyer;
    const pctDiff = ingresosAyer > 0 ? Math.abs((ventasHoyVal - ingresosAyer) / ingresosAyer * 100).toFixed(1) : "100.0";
    const compSymbol = isSube ? "↗️" : "↘️";
    const comparativaText = `${compSymbol} ${pctDiff}% vs anterior`;

    const costoProductosHoy = ventasCerradas.reduce((sum, o) => sum + getCostoAsociado(o), 0);
    const pagosCostosHoy = costoProductosHoy + gastosInputVal;
    const utilidadHoy = ventasHoyVal - pagosCostosHoy;
    const margenHoy = ventasHoyVal > 0 ? (utilidadHoy / ventasHoyVal * 100) : 0;

    const fmt = (val: number) => {
      return `$${Math.round(val).toLocaleString('es-CO').replace(/,/g, '.')}`;
    };

    let alertPart = "";
    if (diasSinCerrar > 0) {
      alertPart = `⚠️ ALERTA DE CONTROL:\n- Hay ${diasSinCerrar} días anteriores con actividad sin cerrar. Revisar y Cerrar.\n\n`;
    }

    let tableRows = "";
    ventasCerradas.forEach(o => {
      const mesa = mesas.find(m => m.id === o.mesaId);
      let nameLabel = `#${o.consecutivo || o.id.slice(0, 4)}`;
      if (mesa) {
        if (mesa.zona === 'Para Llevar') {
          nameLabel = `PLL-${o.consecutivo || 'X'}`;
        } else {
          nameLabel = `Mesa ${mesa.numero}`;
        }
      }
      
      const metodoLabel = o.metodoPago === 'TRANSFERENCIA' ? 'Nequi' : (o.metodoPago === 'TARJETA' ? 'Tarjeta' : 'Efectivo');
      const totalFact = o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0);
      const costAsoc = getCostoAsociado(o);
      const util = totalFact - costAsoc;

      tableRows += `| ${nameLabel} | ${metodoLabel} | ${fmt(totalFact)} | ${fmt(costAsoc)} | ${fmt(util)} |\n`;
    });

    if (ventasCerradas.length === 0) {
      tableRows = "| No hay ventas | - | $0 | $0 | $0 |\n";
    }

    const cleanNotas = notasInputVal.trim() ? `\n\n📝 NOTAS ADICIONALES:\n- ${notasInputVal.trim()}` : "";

    return `${alertPart}📊 INDICADORES GENERALES (KPIs Históricos/Acumulados del Restaurante):
- INGRESO PROMEDIO / DÍA: ${fmt(ingresoPromedio)}
- MARGEN PROMEDIO: ${margenPromedioPct.toFixed(1)}%
- TASA DE OCUPACIÓN / EFICIENCIA: ${eficienciaPct.toFixed(1)}%

📅 HISTORIAL DE CIERRE (DÍA ACTUAL):
- ${getFullDateLabel(fechaVal)} - [COMPLETADO]
- Comparativa porcentual: ${comparativaText}
- Bloque de Métricas del Día:
  * PEDIDOS TOTALES: ${ventasCerradas.length}
  * INCIDENCIAS: ${incidenciasInputVal}
  * MARGEN DEL DÍA: ${margenHoy.toFixed(1)}%
  * TIEMPO PROMEDIO DE SERVICIO: ${tiempoPromedioServicioStr}
  * OTROS COSTOS: ${fmt(gastosInputVal)}

💰 ESTADO FINANCIERO DEL RESTAURANTE:
- INGRESOS TOTALES: ${fmt(ventasHoyVal)}
- PAGOS / COSTOS DEL DÍA: ${fmt(pagosCostosHoy)}
- UTILIDAD DEL DÍA: ${fmt(utilidadHoy)}

💳 DESGLOSE DE VENTAS POR MEDIO DE PAGO (Tabla Detallada):
| [FACTURA / PEDIDO] | [MÉTODO DE PAGO (Efectivo, Nequi, Tarjeta)] | [TOTAL FACTURADO] | [COSTO ASOCIADO] | [UTILIDAD] |
| :--- | :--- | :--- | :--- | :--- |
${tableRows}${cleanNotas}`;
  };

  const costoInsumosHoy = ventasCerradas.reduce((sum, o) => sum + getCostoAsociado(o), 0);
  const totalGastosHoy = isCajaCerrada ? reportOtrosCostos : otrosCostos;
  const utilidadHoy = totalVentasCerradas - (costoInsumosHoy + totalGastosHoy);
  const margenHoy = totalVentasCerradas > 0 ? (utilidadHoy / totalVentasCerradas * 100) : 0;

  const reportMarkdown = generarReporteMarkdown(
    activeCloseDate,
    totalVentasCerradas,
    isCajaCerrada ? reportOtrosCostos : otrosCostos,
    isCajaCerrada ? reportIncidencias : incidencias,
    isCajaCerrada ? reportTextNotas : notas
  );

  const handleCopiarReporte = () => {
    navigator.clipboard.writeText(reportMarkdown);
    toast({
      title: "Reporte Copiado 📋",
      description: "El informe en formato Markdown ha sido copiado al portapapeles.",
    });
  };

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

  // Sincronización en tiempo real y fallback de sondeo para Dashboard
  useEffect(() => {
    const refresh = usePOSStore.getState().refreshOrdenesYMesas;
    const setupRealtime = usePOSStore.getState().setupRealtime;
    
    // Forzar actualización inicial al montar
    refresh().catch(err => console.error("Error al refrescar mesas en dashboard:", err));
    setupRealtime();

    // Sondeo de respaldo cada 5 segundos
    const interval = setInterval(() => {
      refresh().catch(err => console.error("Error en sondeo de respaldo de dashboard:", err));
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleConfirmarCierre = async () => {
    const realVal = realEfectivo || 0;
    const diferencia = realVal - esperadoEfectivo;
    
    const serializedNotas = JSON.stringify({
      textNotas: notas,
      otrosCostos,
      incidencias
    });

    // Usar activeCloseDate (la fecha que se está cerrando) en lugar de fechaOperativa
    const fechaCierre = activeCloseDate;

    const closureData = {
      fecha: fechaCierre,
      esperadoEfectivo,
      esperadoTarjeta,
      esperadoTransferencia,
      realEfectivo: realVal,
      diferencia,
      notas: serializedNotas,
      usuario: user?.nombre || "Cajero",
      timestamp: new Date().toISOString()
    };
    
    // Guardar localmente primero (síncrono)
    localStorage.setItem(`cierre_${fechaCierre}`, JSON.stringify(closureData));

    // Guardar en Supabase de forma robusta
    try {
      let insertError = null;
      const { error } = await supabase.from('cierres_diarios').insert({
        fecha: fechaCierre,
        esperado_efectivo: esperadoEfectivo,
        esperado_tarjeta: esperadoTarjeta,
        esperado_transferencia: esperadoTransferencia,
        real_efectivo: realVal,
        diferencia: diferencia,
        notas: serializedNotas,
        creado_por: user?.id || null
      });
      
      if (error) {
        insertError = error;
        console.warn("No se pudo guardar el cierre en Supabase con creado_por, reintentando con creado_por = null:", error.message);
        
        // Fallback: si el id del usuario no existe en la base de datos de producción/Supabase, guardamos con creado_por = null
        const { error: retryError } = await supabase.from('cierres_diarios').insert({
          fecha: fechaCierre,
          esperado_efectivo: esperadoEfectivo,
          esperado_tarjeta: esperadoTarjeta,
          esperado_transferencia: esperadoTransferencia,
          real_efectivo: realVal,
          diferencia: diferencia,
          notas: serializedNotas,
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

    // Automáticamente iniciar el siguiente día basándose en la fecha que se acaba de cerrar
    handleIniciarSiguienteDia(fechaCierre);
  };

  const handleIniciarSiguienteDia = (fechaCerrada?: string) => {
    // Usar la fecha que se acaba de cerrar como base, no fechaOperativa
    const baseFecha = fechaCerrada || activeCloseDate || fechaOperativa;
    if (!baseFecha) return;
    
    // Parsear la fecha base de forma segura
    let currentDate = new Date();
    if (/^\d{4}-\d{2}-\d{2}$/.test(baseFecha)) {
      const parts = baseFecha.split('-');
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

  const kpiVentasCerradas = useMemo(() => {
    return ordenes.filter(o => {
      if (o.estado !== 'CERRADA') return false;
      const orderDate = getOrderLocalDateStr(o.updatedAt || o.createdAt);
      if (dashboardPeriod === 'DIA') return orderDate === activeCloseDate;
      if (dashboardPeriod === 'MES') return orderDate.substring(0, 7) === activeCloseDate.substring(0, 7);
      if (dashboardPeriod === 'AÑO') return orderDate.substring(0, 4) === activeCloseDate.substring(0, 4);
      return false;
    });
  }, [ordenes, activeCloseDate, dashboardPeriod]);

  const kpiTotalVentas = kpiVentasCerradas.reduce((acc, o) => 
    acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0);
    
  const kpiTicketPromedio = kpiVentasCerradas.length > 0 ? Math.round(kpiTotalVentas / kpiVentasCerradas.length) : 0;

  const kpis = [
    { 
      title: dashboardPeriod === 'DIA' ? "Ventas Hoy" : dashboardPeriod === 'MES' ? "Ventas del Mes" : "Ventas del Año", 
      value: `$${kpiTotalVentas.toLocaleString('es-CO')}`, 
      change: dashboardPeriod === 'DIA' ? "Hoy" : dashboardPeriod === 'MES' ? "Este mes" : "Este año", 
      icon: DollarSign, 
      color: "text-green-500" 
    },
    { title: "Mesas Activas", value: `${mesasOcupadas} / ${mesas.length}`, change: `${Math.round((mesasOcupadas/mesas.length)*100)}% Ocupación`, icon: MapIcon, color: "text-secondary" },
    { title: "Pedidos Pendientes", value: pedidosPendientes.toString(), change: "En estaciones", icon: ClipboardCheck, color: "text-primary" },
    { 
      title: "Ticket Promedio", 
      value: `$${kpiTicketPromedio.toLocaleString('es-CO')}`, 
      change: dashboardPeriod === 'DIA' ? "Hoy" : dashboardPeriod === 'MES' ? "Este mes" : "Este año", 
      icon: TrendingUp, 
      color: "text-blue-500" 
    },
  ];

  const stations = [
    { 
      name: "Asado", 
      icon: Flame, 
      pending: ordenes
        .filter(o => o.estado === 'ABIERTA')
        .reduce((acc, o) => acc + o.items.filter(i => i.estacion === 'ASADO' && i.estado !== 'LISTO' && i.estado !== 'ENTREGADO').length, 0), 
      color: "bg-primary",
      href: "/estaciones/asado"
    },
    { 
      name: "Parrilla", 
      icon: Utensils, 
      pending: ordenes
        .filter(o => o.estado === 'ABIERTA')
        .reduce((acc, o) => acc + o.items.filter(i => i.estacion === 'PARRILLA' && i.estado !== 'LISTO' && i.estado !== 'ENTREGADO').length, 0), 
      color: "bg-orange-600",
      href: "/estaciones/parrilla"
    },
    { 
      name: "Cocina", 
      icon: ChefHat, 
      pending: ordenes
        .filter(o => o.estado === 'ABIERTA')
        .reduce((acc, o) => acc + o.items.filter(i => i.estacion === 'COCINA' && i.estado !== 'LISTO' && i.estado !== 'ENTREGADO').length, 0), 
      color: "bg-secondary",
      href: "/estaciones/cocina"
    },
    { 
      name: "Bar", 
      icon: Beer, 
      pending: ordenes
        .filter(o => o.estado === 'ABIERTA')
        .reduce((acc, o) => acc + o.items.filter(i => i.estacion === 'BAR' && i.estado !== 'LISTO' && i.estado !== 'ENTREGADO').length, 0), 
      color: "bg-blue-600",
      href: "/estaciones/bar"
    },
  ];

  const getShortDateLabel = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const dd = String(day).padStart(2, '0');
    const mm = String(month + 1).padStart(2, '0');
    return `${daysOfWeek[date.getDay()]} ${dd}/${mm}`;
  };

  const generarReporteMarkdownForItem = (closure: any) => {
    let reportOtrosCostos = 0;
    let reportIncidencias = 0;
    let reportTextNotas = "";

    try {
      if (closure.notas && closure.notas.trim().startsWith("{")) {
        const parsed = JSON.parse(closure.notas);
        reportOtrosCostos = parsed.otrosCostos || 0;
        reportIncidencias = parsed.incidencias || 0;
        reportTextNotas = parsed.textNotas || "";
      } else {
        reportTextNotas = closure.notas || "";
      }
    } catch (e) {
      reportTextNotas = closure.notas || "";
    }

    const netIngresos = ventasPorDiaMap.get(closure.fecha) ?? 
      ((closure.esperadoEfectivo + closure.esperadoTarjeta + closure.esperadoTransferencia) / 1.10);

    return generarReporteMarkdown(
      closure.fecha,
      netIngresos,
      reportOtrosCostos,
      reportIncidencias,
      reportTextNotas
    );
  };

  const handleCopiarReporteHistorico = (closure: any) => {
    const md = generarReporteMarkdownForItem(closure);
    navigator.clipboard.writeText(md);
    toast({
      title: "Reporte Copiado 📋",
      description: `El informe de cierre de la fecha ${closure.fecha} ha sido copiado al portapapeles.`,
    });
  };

  const isCierreClosed = historialCierres.some(c => c.fecha === activeCloseDate) || 
                         (typeof window !== 'undefined' && !!localStorage.getItem(`cierre_${activeCloseDate}`));

  const ClosureAccordionItem = ({
    c,
    idx,
    isExpanded,
    onToggle
  }: {
    c: any;
    idx: number;
    isExpanded: boolean;
    onToggle: () => void;
  }) => {
    const fechaAnterior = getFechaAnterior(c.fecha);
    const closureAyerItem = historialCierres.find(x => x.fecha === fechaAnterior);
    
    const totalIngresos = (c.esperadoEfectivo + c.esperadoTarjeta + c.esperadoTransferencia) / 1.10;
    const totalIngresosAyer = closureAyerItem ? (closureAyerItem.esperadoEfectivo + closureAyerItem.esperadoTarjeta + closureAyerItem.esperadoTransferencia) / 1.10 : 0;
    
    const isSubeVal = totalIngresos >= totalIngresosAyer;
    const pctDiffVal = totalIngresosAyer > 0 ? Math.abs((totalIngresos - totalIngresosAyer) / totalIngresosAyer * 100).toFixed(1) : "100.0";
    
    const trendSymbol = isSubeVal ? "↗️" : "↘️";
    const pctColor = isSubeVal ? "text-green-500 font-bold flex items-center gap-1" : "text-red-500 font-bold flex items-center gap-1";

    const otrosCostosVal = parseOtrosCostos(c);
    const ordersForDate = ordenes.filter(o => 
      o.estado === 'CERRADA' && 
      getOrderLocalDateStr(o.updatedAt || o.createdAt) === c.fecha
    );
    
    const numPedidos = ordersForDate.length || 10;
    const ordersMesas = ordersForDate.filter(o => {
      const m = mesas.find(x => x.id === o.mesaId);
      return m && m.zona !== 'Para Llevar';
    });
    const totalMesas = ordersMesas.length;
    const totalParaLlevar = ordersForDate.length - totalMesas;

    const costoInsumos = ordersForDate.reduce((sum, o) => sum + getCostoAsociado(o), 0);
    const pagosVal = (costoInsumos || (totalIngresos * 0.35)) + otrosCostosVal;
    const utilidadVal = totalIngresos - pagosVal;

    return (
      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-md mb-3">
        <div 
          onClick={onToggle}
          className="p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 cursor-pointer select-none"
        >
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 text-primary p-3 rounded-2xl shrink-0">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-bold text-base text-foreground">
                  {getFullDateLabel(c.fecha)}
                </h4>
                <Badge className="bg-green-500/10 text-green-500 border-none font-bold text-[10px] uppercase py-0.5 px-2">
                  COMPLETADO
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <span>por {c.usuario}</span>
                <span className={pctColor}>
                  {trendSymbol} {pctDiffVal}% vs anterior
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 lg:ml-auto w-full lg:w-auto border-t lg:border-none pt-3 lg:pt-0">
            <div className="text-center min-w-[90px]">
              <span className="text-[10px] font-mono text-muted-foreground uppercase block tracking-wider font-bold">Pedidos</span>
              <span className="text-sm font-black text-foreground block mt-0.5">{ordersForDate.length || numPedidos}</span>
              <span className="text-[9px] text-muted-foreground block mt-0.5 font-bold">
                {totalMesas} Mes / {totalParaLlevar} Llev
              </span>
            </div>

            <div className="text-center min-w-[100px]">
              <span className="text-[10px] font-mono text-muted-foreground uppercase block tracking-wider font-bold">Ingresos</span>
              <span className="text-sm font-black text-green-500 block mt-0.5">
                ${Math.round(totalIngresos).toLocaleString('es-CO').replace(/,/g, '.')}
              </span>
            </div>

            <div className="text-center min-w-[100px]">
              <span className="text-[10px] font-mono text-muted-foreground uppercase block tracking-wider font-bold">Pagos</span>
              <span className="text-sm font-black text-amber-500 block mt-0.5">
                ${Math.round(pagosVal).toLocaleString('es-CO').replace(/,/g, '.')}
              </span>
            </div>

            <div className="text-center min-w-[100px]">
              <span className="text-[10px] font-mono text-muted-foreground uppercase block tracking-wider font-bold">Utilidad</span>
              <span className="text-sm font-black text-blue-500 block mt-0.5">
                ${Math.round(utilidadVal).toLocaleString('es-CO').replace(/,/g, '.')}
              </span>
            </div>

            <div className="flex items-center gap-2 ml-auto" onClick={(e) => e.stopPropagation()}>
              <Button
                size="icon"
                variant="ghost"
                onClick={onToggle}
                className="h-9 w-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="px-5 pb-5 pt-1 border-t border-border/30 bg-muted/20 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border/50 p-4 rounded-xl space-y-2">
                <h5 className="text-xs font-black uppercase text-primary">Detalle de Flujo</h5>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Efectivo Esperado (con Propina):</span>
                    <span className="font-bold">${c.esperadoEfectivo.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tarjeta Esperado (con Propina):</span>
                    <span className="font-bold">${c.esperadoTarjeta.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transferencia Esperado (con Propina):</span>
                    <span className="font-bold">${c.esperadoTransferencia.toLocaleString('es-CO')}</span>
                  </div>

                </div>
              </div>

              <div className="bg-card border border-border/50 p-4 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <h5 className="text-xs font-black uppercase text-primary">Novedades y Registro</h5>
                  <p className="text-xs italic text-muted-foreground mt-2 bg-muted/50 p-2.5 rounded-lg border border-border/40">
                    {(() => {
                      if (!c.notas) return "Sin novedades registradas";
                      try {
                        if (c.notas.trim().startsWith("{")) {
                          const parsed = JSON.parse(c.notas);
                          return parsed.textNotas || "Sin novedades registradas";
                        }
                      } catch(e) {}
                      return c.notas;
                    })()}
                  </p>
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono pt-3 mt-auto">
                  <span>Registrado: {new Date(c.timestamp).toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>


          </div>
        )}
      </div>
    );
  };

  const filteredCierres = historialCierres.filter(c => 
    c.fecha.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getFullDateLabel(c.fecha).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="p-8">
      {/* 1. CABECERA GENERAL DE OPERACIÓN */}
      <div className="bg-primary text-primary-foreground p-6 rounded-3xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <h2 className="text-2xl font-black font-headline tracking-tight">Cierre Diario de Operación</h2>
          <p className="text-sm opacity-95 font-medium max-w-xl mt-1 text-primary-foreground/90">
            Consolide ingresos, pagos y calcule la utilidad neta del día con validaciones automáticas.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Tab Selector Switcher */}
          <div className="bg-primary-foreground/10 p-1 rounded-xl flex items-center gap-1 border border-primary-foreground/10">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all",
                activeTab === "dashboard"
                  ? "bg-white text-primary shadow-md"
                  : "text-white hover:bg-white/10"
              )}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("cierre")}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all",
                activeTab === "cierre"
                  ? "bg-white text-primary shadow-md"
                  : "text-white hover:bg-white/10"
              )}
            >
              <CircleDollarSign className="w-3.5 h-3.5" />
              Financiero
            </button>
          </div>

          {/* Period Selector Switcher */}
          <div className="bg-primary-foreground/10 p-1 rounded-xl flex items-center gap-1 border border-primary-foreground/10 animate-fadeIn">
            <button
              onClick={() => setDashboardPeriod('DIA')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black transition-all",
                dashboardPeriod === 'DIA'
                  ? "bg-white text-primary shadow-md"
                  : "text-white hover:bg-white/10"
              )}
            >
              Día
            </button>
            <button
              onClick={() => setDashboardPeriod('MES')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black transition-all",
                dashboardPeriod === 'MES'
                  ? "bg-white text-primary shadow-md"
                  : "text-white hover:bg-white/10"
              )}
            >
              Mes
            </button>
            <button
              onClick={() => setDashboardPeriod('AÑO')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black transition-all",
                dashboardPeriod === 'AÑO'
                  ? "bg-white text-primary shadow-md"
                  : "text-white hover:bg-white/10"
              )}
            >
              Año
            </button>
          </div>

          {/* Dialog for Close */}
          <Dialog open={isCorteOpen} onOpenChange={setIsCorteOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setCierreFecha("")}
                className="bg-white hover:bg-white/95 text-primary font-black px-5 py-2 h-9 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all"
              >
                <Calculator className="w-4 h-4" />
                Cierre Hoy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-card border-border paper-texture rounded-[2rem] text-foreground max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center gap-4 mb-2 border-b border-border/25 pb-3">
                  <div className={cn(
                    "p-3 rounded-2xl text-white",
                    isCierreClosed ? "bg-green-600" : "bg-primary"
                  )}>
                    <Calculator className="w-7 h-7" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-headline tracking-tight">
                      {isCierreClosed 
                        ? `Reporte de Cierre de Caja (${activeCloseDate})`
                        : `${cierreStep}. Pre-Cierre — Revisión Automática`
                      }
                    </DialogTitle>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">
                      {isCierreClosed 
                        ? "Resumen de ventas y diferencias (Solo Lectura)" 
                        : "Revise el estado de la operación antes de cerrar el día."
                      }
                    </p>
                  </div>
                </div>
              </DialogHeader>

              {/* STEPPER BAR (Only visible if box is open) */}
              {!isCierreClosed && (
                <div className="flex items-center justify-center gap-4 py-4 mb-6 border-b border-border/10">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors",
                      cierreStep === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      1
                    </div>
                    <span className={cn("text-xs font-black", cierreStep === 1 ? "text-foreground" : "text-muted-foreground")}>
                      Pre-cierre
                    </span>
                  </div>
                  <div className="w-12 h-0.5 bg-border" />
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors",
                      cierreStep === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      2
                    </div>
                    <span className={cn("text-xs font-black", cierreStep === 2 ? "text-foreground" : "text-muted-foreground")}>
                      Confirmar
                    </span>
                  </div>
                  <div className="w-12 h-0.5 bg-border" />
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors",
                      cierreStep === 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      3
                    </div>
                    <span className={cn("text-xs font-black", cierreStep === 3 ? "text-foreground" : "text-muted-foreground")}>
                      Listo
                    </span>
                  </div>
                </div>
              )}

              {/* DIALOG CONTENT BY STEP */}
              {isCierreClosed && closureReport ? (
                // MODE: CLOSED (Step 3 view only)
                <div className="space-y-6 py-2">
                  <div className="bg-green-500/10 border-2 border-green-500/30 text-green-400 p-4 rounded-2xl flex items-center gap-3 shadow-md">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-white">Ventas Bloqueadas</h4>
                      <p className="text-[10px] font-medium opacity-90 text-muted-foreground">La caja de hoy está oficialmente cerrada.</p>
                    </div>
                  </div>

                  {/* KPIs Summary Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl text-center">
                      <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Pedidos</span>
                      <span className="text-lg font-black text-foreground mt-0.5 block">{ventasCerradas.length}</span>
                    </div>
                    <div className="bg-green-500/5 border border-green-500/20 p-4 rounded-2xl text-center">
                      <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Ingresos</span>
                      <span className="text-lg font-black text-green-500 mt-0.5 block">${totalVentasCerradas.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-2xl text-center">
                      <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Pagos</span>
                      <span className="text-lg font-black text-amber-500 mt-0.5 block">${(costoInsumosHoy + reportOtrosCostos).toLocaleString('es-CO')}</span>
                    </div>
                    <div className="bg-purple-500/5 border border-purple-500/20 p-4 rounded-2xl text-center">
                      <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Utilidad</span>
                      <span className="text-lg font-black text-primary mt-0.5 block">${utilidadHoy.toLocaleString('es-CO')}</span>
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
                        <span className="text-sm font-black text-white">${closureReport.esperadoTarjeta.toLocaleString('es-CO')}</span>
                        <span className="text-[9px] text-muted-foreground block mt-0.5">Subtotal: ${(closureReport.esperadoTarjeta / 1.10).toLocaleString('es-CO')}</span>
                      </div>
                      <div className="bg-card/60 p-3 rounded-xl border border-border/40 text-center">
                        <span className="text-[10px] text-muted-foreground uppercase block font-bold">📲 Transferencias (Nequi/Davi)</span>
                        <span className="text-sm font-black text-white">${closureReport.esperadoTransferencia.toLocaleString('es-CO')}</span>
                        <span className="text-[9px] text-muted-foreground block mt-0.5">Subtotal: ${(closureReport.esperadoTransferencia / 1.10).toLocaleString('es-CO')}</span>
                      </div>
                      <div className="bg-card/60 p-3 rounded-xl border border-border/40 text-center">
                        <span className="text-[10px] text-muted-foreground uppercase block font-bold">💵 Efectivo Esperado</span>
                        <span className="text-sm font-black text-white">${closureReport.esperadoEfectivo.toLocaleString('es-CO')}</span>
                        <span className="text-[9px] text-muted-foreground block mt-0.5">Subtotal: ${(closureReport.esperadoEfectivo / 1.10).toLocaleString('es-CO')}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl text-center">
                        <span className="text-[10px] text-primary uppercase block font-black">Insumos (Costo Platos)</span>
                        <span className="text-base font-black text-primary">${costoInsumosHoy.toLocaleString('es-CO')}</span>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl text-center">
                        <span className="text-[10px] text-green-400 uppercase block font-black">Utilidad Neta</span>
                        <span className="text-base font-black text-green-400">${utilidadHoy.toLocaleString('es-CO')}</span>
                        <span className="text-[9px] text-green-500/80 block mt-0.5">Margen: {margenHoy.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 bg-accent/20 p-4 rounded-2xl border border-border/50">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-muted-foreground">Efectivo Esperado:</span>
                      <span className="font-black">${closureReport.esperadoEfectivo.toLocaleString('es-CO')}</span>
                    </div>

                  </div>


                  {reportTextNotas && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Notas o Novedades:</span>
                      <p className="text-xs bg-accent/10 p-3 rounded-xl border border-border/30 italic text-muted-foreground">
                        "{reportTextNotas}"
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
                  </div>
                </div>
              ) : (
                // MODE: OPEN CLOSE DIALOG (Wizard Flow 1 -> 2 -> 3)
                <div className="py-2">
                  {cierreStep === 1 && (
                    // WIZARD STEP 1: PRE-CIERRE VALIDATIONS
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Pedidos Indicator Card */}
                        <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl text-center">
                          <div className="flex justify-center mb-1.5 text-primary">
                            <Package className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] text-primary font-black uppercase tracking-wider block">Pedidos</span>
                          <span className="text-xl font-black text-primary mt-0.5 block">{totalPedidosHoy}</span>
                          <span className="text-[9px] text-primary/80 block font-bold mt-0.5">
                            {totalMesasHoy} Mesas | {totalParaLlevarHoy} Llevar
                          </span>
                        </div>

                        {/* Ingresos Indicator Card */}
                        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl text-center">
                          <div className="flex justify-center mb-1.5 text-green-500">
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] text-green-500 font-black uppercase tracking-wider block">Ingresos</span>
                          <span className="text-xl font-black text-green-500 mt-0.5 block">${totalVentasCerradas.toLocaleString('es-CO')}</span>
                        </div>

                        {/* Pagos Indicator Card */}
                        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl text-center">
                          <div className="flex justify-center mb-1.5 text-amber-600">
                            <TrendingUp className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] text-amber-600 font-black uppercase tracking-wider block">Pagos</span>
                          <span className="text-xl font-black text-amber-600 mt-0.5 block">${(costoInsumosHoy + otrosCostos).toLocaleString('es-CO')}</span>
                        </div>

                        {/* Utilidad Indicator Card */}
                        <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl text-center">
                          <div className="flex justify-center mb-1.5 text-purple-500">
                            <Calculator className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] text-purple-500 font-black uppercase tracking-wider block">Utilidad</span>
                          <span className="text-xl font-black text-purple-500 mt-0.5 block">${utilidadHoy.toLocaleString('es-CO')}</span>
                        </div>
                      </div>

                      {/* Checklist Validations */}
                      <div className="space-y-3 bg-card border border-border/40 p-5 rounded-[1.5rem] shadow-inner">
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-3">
                          <ClipboardCheck className="w-4 h-4 text-primary" /> Checklist de Validaciones
                        </h4>

                        {/* Row 1: Final States check */}
                        <div className={cn(
                          "p-4 rounded-2xl border flex items-center gap-3 transition-all duration-300",
                          pedidosAbiertosHoy > 0
                            ? "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400"
                            : "bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400"
                        )}>
                          {pedidosAbiertosHoy > 0 ? (
                            <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse text-amber-500" />
                          ) : (
                            <CheckCircle className="w-5 h-5 shrink-0 text-green-500" />
                          )}
                          <div>
                            <h5 className="text-xs font-black uppercase tracking-wider">Pedidos con estado final registrado</h5>
                            <p className="text-[10px] opacity-80 mt-0.5">{pedidosCerradosHoy} de {totalPedidosHoy} pedidos finalizados</p>
                          </div>
                        </div>

                        {/* Row 2: Open states count */}
                        <div className={cn(
                          "p-4 rounded-2xl border flex items-center gap-3 transition-all duration-300",
                          pedidosAbiertosHoy > 0
                            ? "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400"
                            : "bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400"
                        )}>
                          {pedidosAbiertosHoy > 0 ? (
                            <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse text-amber-500" />
                          ) : (
                            <CheckCircle className="w-5 h-5 shrink-0 text-green-500" />
                          )}
                          <div>
                            <h5 className="text-xs font-black uppercase tracking-wider">Pedidos aún en cocina o mesa</h5>
                            <p className="text-[10px] opacity-80 mt-0.5">{pedidosAbiertosHoy} pedidos siguen activos</p>
                          </div>
                        </div>

                        {/* General Warning Note */}
                        <div className={cn(
                          "p-4 rounded-2xl border text-xs font-medium transition-all duration-300 mt-2",
                          totalPedidosHoy === 0
                            ? "bg-red-500/10 border-red-500/30 text-red-500"
                            : pedidosAbiertosHoy > 0
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                              : "bg-green-500/10 border-green-500/30 text-green-800 dark:text-green-300"
                        )}>
                          {totalPedidosHoy === 0 ? (
                            <p><strong>Error:</strong> No se puede realizar el cierre porque no hay pedidos registrados para el día operativo en curso.</p>
                          ) : pedidosAbiertosHoy > 0 ? (
                            <p><strong>Nota:</strong> Hay items con advertencias. Puede continuar con el cierre, pero se recomienda revisar los puntos señalados.</p>
                          ) : (
                            <p><strong>Excelente:</strong> Todos los pedidos del día se han cerrado con éxito. Listo para arqueo de caja.</p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-4 border-t border-border/10 pt-4">
                        <Button variant="ghost" className="rounded-xl" onClick={() => setIsCorteOpen(false)}>
                          Cancelar
                        </Button>
                        <Button
                          onClick={() => setCierreStep(2)}
                          disabled={totalPedidosHoy === 0}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-6 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
                        >
                          Continuar al Cierre <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {cierreStep === 2 && (
                    // WIZARD STEP 2: FORMS AND LIVE SUMMARY
                    <div className="space-y-6">
                      {/* Financial breakdown overview */}
                      <div className="bg-gradient-to-br from-primary/10 to-background/50 border border-primary/20 p-5 rounded-3xl space-y-4 shadow-sm">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                          📊 Análisis Financiero Automático (Hoy)
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="bg-card/60 p-3 rounded-xl border border-border/40 text-center">
                            <span className="text-[10px] text-muted-foreground uppercase block font-bold">💳 Datáfono (Tarjeta)</span>
                            <span className="text-sm font-black text-white">${esperadoTarjeta.toLocaleString('es-CO')}</span>
                            <span className="text-[9px] text-muted-foreground block mt-0.5">Subtotal: ${subtotalTarjeta.toLocaleString('es-CO')}</span>
                          </div>
                          <div className="bg-card/60 p-3 rounded-xl border border-border/40 text-center">
                            <span className="text-[10px] text-muted-foreground uppercase block font-bold">📲 Transferencias (Nequi/Davi)</span>
                            <span className="text-sm font-black text-white">${esperadoTransferencia.toLocaleString('es-CO')}</span>
                            <span className="text-[9px] text-muted-foreground block mt-0.5">Subtotal: ${subtotalTransferencia.toLocaleString('es-CO')}</span>
                          </div>
                          <div className="bg-card/60 p-3 rounded-xl border border-border/40 text-center">
                            <span className="text-[10px] text-muted-foreground uppercase block font-bold">💵 Efectivo Esperado</span>
                            <span className="text-sm font-black text-white">${esperadoEfectivo.toLocaleString('es-CO')}</span>
                            <span className="text-[9px] text-muted-foreground block mt-0.5">Subtotal: ${subtotalEfectivo.toLocaleString('es-CO')}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl text-center">
                            <span className="text-[10px] text-primary uppercase block font-black">Insumos (Costo Platos)</span>
                            <span className="text-base font-black text-primary">${costoInsumosHoy.toLocaleString('es-CO')}</span>
                          </div>
                          <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl text-center">
                            <span className="text-[10px] text-green-400 uppercase block font-black">Utilidad Neta (Hoy)</span>
                            <span className="text-base font-black text-green-400">${utilidadHoy.toLocaleString('es-CO')}</span>
                            <span className="text-[9px] text-green-500/80 block mt-0.5">Margen: {margenHoy.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-primary/5 p-3 rounded-xl border border-primary/20 text-primary">
                        <span className="text-xs font-bold">Total General Esperado (Propina Incluida):</span>
                        <span className="text-base font-black">${granTotalRecaudado.toLocaleString('es-CO')}</span>
                      </div>

                      <DialogFooter className="pt-2 border-t border-border/10">
                        <Button variant="ghost" className="rounded-xl text-xs font-bold" onClick={() => setCierreStep(1)}>
                          Volver
                        </Button>
                        <Button
                          onClick={async () => {
                            await handleConfirmarCierre();
                            setCierreStep(3);
                          }}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-6 h-11 rounded-xl text-xs transition-all"
                        >
                          Confirmar y Guardar Cierre 🤠
                        </Button>
                      </DialogFooter>
                    </div>
                  )}

                  {cierreStep === 3 && (
                    // WIZARD STEP 3: SUCCESS AND NEXT DAY TRIGGER
                    <div className="space-y-6 text-center py-4">
                      <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                        <CheckCircle className="w-9 h-9" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-foreground">Cierre de Caja Guardado con Éxito!</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                          Los datos financieros han sido contabilizados localmente y sincronizados con el servidor.
                        </p>
                      </div>


                      <div className="pt-4 flex flex-col md:flex-row justify-center gap-2 border-t border-border/10 max-w-lg mx-auto">
                        <p className="text-xs text-green-400 font-bold text-center w-full mb-2">✅ El siguiente día ya fue iniciado automáticamente.</p>
                        <Button variant="ghost" className="rounded-xl w-full md:w-auto" onClick={() => setIsCorteOpen(false)}>
                          Cerrar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. TAB CONTENT VIEW SWITCHER */}
      {activeTab === "dashboard" ? (
        // TAB: DASHBOARD VIEW
        <div className="space-y-8 animate-fadeIn">
          {/* Main Dashboard Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, i) => (
              <Card key={i} className="bg-card/50 border-border paper-texture shadow-lg rounded-2xl transition-all hover:translate-y-[-2px]">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <kpi.icon className={cn("w-5 h-5", kpi.color)} />
                    <span className="text-[10px] font-mono text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full font-bold">
                      {kpi.change}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-black uppercase tracking-wider">{kpi.title}</p>
                  <h3 className="text-2xl font-bold mt-1 text-foreground">{kpi.value}</h3>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sales Chart */}
            <Card className="lg:col-span-2 bg-card border-border shadow-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-accent/10 border-b border-border/40 p-5">
                <CardTitle className="text-base font-headline font-black tracking-tight text-foreground">
                  Flujo de Ventas (Hoy)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2E1D12" />
                      <XAxis dataKey="name" stroke="#A08060" fontSize={11} />
                      <YAxis stroke="#A08060" fontSize={11} tickFormatter={(val) => `$${val/1000}k`} />
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
              {/* Kitchen Stations status */}
              <Card className="bg-card border-border border-l-4 border-l-secondary shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="bg-accent/10 p-4">
                  <CardTitle className="text-base font-headline font-black tracking-tight flex items-center gap-2 text-foreground">
                    <Flame className="w-5 h-5 text-secondary" />
                    Estado de Estaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {stations.map((s, i) => (
                    <Link
                      key={i}
                      href={s.href}
                      className="flex items-center justify-between p-3 bg-accent/30 rounded-xl border border-border/50 hover:bg-accent/40 hover:border-primary/30 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg shadow-inner transition-transform group-hover:scale-105", s.color)}>
                          <s.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-sm group-hover:text-primary transition-colors">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black transition-transform group-hover:scale-110">{s.pending}</span>
                        <span className="text-[9px] text-muted-foreground uppercase font-black font-mono">Pend.</span>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>

              {/* Critical Alerts */}
              <Card className="bg-card border-border border-l-4 border-l-primary shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="bg-primary/5 p-4">
                  <CardTitle className="text-base font-headline font-black tracking-tight flex items-center gap-2 text-foreground">
                    <ArrowDownCircle className="w-5 h-5 text-primary" />
                    Alertas Críticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {lowStockProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                      <span className="text-xl mb-1">🤠</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Inventario óptimo</span>
                      <span className="text-[10px] text-muted-foreground/40 mt-0.5">Todos los productos tienen stock suficiente</span>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
                      {lowStockProducts.map((p) => {
                        const isCritical = p.stock <= p.stockMinimo / 2;
                        return (
                          <div
                            key={p.id}
                            className={cn(
                              "flex justify-between items-center p-3 border rounded-xl transition-all duration-200 hover:scale-[1.01]",
                              isCritical
                                ? "bg-destructive/10 border-destructive/20 text-foreground"
                                : "bg-yellow-500/10 border-yellow-500/20 text-foreground"
                            )}
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{p.nombre}</span>
                              <span className="text-[10px] opacity-70">
                                {isCritical ? "Stock agotándose" : "Pedido sugerido"}
                              </span>
                            </div>
                            <Badge
                              className={cn(
                                "font-black text-xs text-white",
                                isCritical
                                  ? "bg-destructive hover:bg-destructive"
                                  : "bg-yellow-500 text-black hover:bg-yellow-500"
                              )}
                            >
                              {p.stock} {p.unidadMedida || 'und'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        // TAB: CIERRE / FINANCIERO VIEW
        <div className="space-y-8 animate-fadeIn">
          {/* Unclosed Days Warning Banner */}
          {diasSinCerrar > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 p-4 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight">Hay {diasSinCerrar} días anteriores con actividad sin cerrar.</h4>
                  <p className="text-xs opacity-90 font-medium">Seleccione los días pendientes para contabilizar sus datos históricos.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                <div className="relative">
                  <select
                    value={selectedWarningDate}
                    onChange={(e) => setSelectedWarningDate(e.target.value)}
                    className="bg-white text-black font-bold text-xs py-2 pl-3 pr-8 rounded-xl focus:outline-none appearance-none cursor-pointer h-9 shadow-sm"
                  >
                    {unclosedDates.map((date) => (
                      <option key={date} value={date}>
                        {getShortDateLabel(date)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-black absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                
                <Button
                  onClick={() => {
                    const target = selectedWarningDate || unclosedDates[0];
                    if (target) {
                      openCierreForDate(target);
                    }
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-4 h-9 rounded-xl shadow-md transition-all"
                >
                  Revisar y Cerrar
                </Button>
              </div>
            </div>
          )}

          {/* Historical Cierre KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card border-border paper-texture shadow-lg rounded-2xl">
              <CardContent className="pt-6 pb-6">
                <span className="text-[10px] font-mono text-muted-foreground uppercase font-black tracking-widest block">Ingreso Promedio / Día</span>
                <h3 className="text-3xl font-black mt-2 text-foreground font-headline">
                  ${Math.round(ingresoPromedio).toLocaleString('es-CO').replace(/,/g, '.')}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Basado en {totalDias} cierres registrados</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border paper-texture shadow-lg rounded-2xl">
              <CardContent className="pt-6 pb-6">
                <span className="text-[10px] font-mono text-muted-foreground uppercase font-black tracking-widest block">Margen Promedio</span>
                <h3 className="text-3xl font-black mt-2 text-foreground font-headline">
                  {margenPromedioPct.toFixed(1)}%
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Promedio de utilidad histórica</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border paper-texture shadow-lg rounded-2xl">
              <CardContent className="pt-6 pb-6">
                <span className="text-[10px] font-mono text-muted-foreground uppercase font-black tracking-widest block">Tasa Pedidos Completados</span>
                <h3 className="text-3xl font-black mt-2 text-foreground font-headline">
                  {eficienciaPct.toFixed(1)}%
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Porcentaje de pedidos completados con éxito</p>
              </CardContent>
            </Card>
          </div>

          {/* Resumen de Gastos y Nómina */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payroll Card */}
            <Card className="bg-card border-border paper-texture shadow-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-accent/10 border-b border-border/40 p-5">
                <CardTitle className="text-base font-headline font-black tracking-tight flex items-center justify-between">
                  <span>Gastos de Personal (Nómina Mensual)</span>
                  <span className="text-sm font-black text-secondary">${totalNominaMensual.toLocaleString('es-CO')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 max-h-[280px] overflow-y-auto pr-2 scrollbar-thin">
                <div className="space-y-3">
                  {usuarios.filter(u => u.estado === 'ACTIVO').map((u) => (
                    <div key={u.id} className="flex justify-between items-center p-3 bg-accent/20 rounded-2xl border border-border/30 hover:border-primary/20 transition-all">
                      <div>
                        <span className="text-xs font-bold block">{u.nombre}</span>
                        <span className="text-[9px] text-muted-foreground uppercase font-black">{u.rol}</span>
                      </div>
                      <span className="text-xs font-black text-foreground">{u.sueldo !== undefined && u.sueldo > 0 ? `$${u.sueldo.toLocaleString('es-CO')}` : '-'}</span>
                    </div>
                  ))}
                  {usuarios.filter(u => u.estado === 'ACTIVO').length === 0 && (
                    <p className="text-xs text-muted-foreground text-center italic py-4">No hay personal activo registrado.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Other Expenses Card */}
            <Card className="bg-card border-border paper-texture shadow-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-accent/10 border-b border-border/40 p-5">
                <CardTitle className="text-base font-headline font-black tracking-tight flex items-center justify-between">
                  <span>Otros Gastos Operativos (Cierres Diarios)</span>
                  <span className="text-sm font-black text-red-500">${totalGastosOperativosHistoricos.toLocaleString('es-CO')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 max-h-[280px] overflow-y-auto pr-2 scrollbar-thin">
                <div className="space-y-3">
                  {historialCierres.filter(c => parseOtrosCostos(c) > 0).map((c) => (
                    <div key={c.fecha} className="flex justify-between items-center p-3 bg-accent/20 rounded-2xl border border-border/30 hover:border-primary/20 transition-all">
                      <div>
                        <span className="text-xs font-bold block">{c.fecha}</span>
                        <span className="text-[9px] text-muted-foreground uppercase font-black">Cajero: {c.usuario}</span>
                      </div>
                      <span className="text-xs font-black text-red-500">${parseOtrosCostos(c).toLocaleString('es-CO')}</span>
                    </div>
                  ))}
                  {historialCierres.filter(c => parseOtrosCostos(c) > 0).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center italic py-4">No hay otros gastos registrados en los cierres.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expandable Accordion List Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-black tracking-tight font-headline text-foreground">Historial de Cierres</h3>
                <p className="text-xs text-muted-foreground">Últimos cierres de caja registrados</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-[220px]">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Buscar por fecha..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl bg-card border-border/80 text-foreground w-full"
                  />
                </div>
                <Badge variant="outline" className="border-border/60 text-muted-foreground text-[10px] py-1 px-3 rounded-lg shrink-0 font-bold">
                  {filteredCierres.length} registros
                </Badge>
              </div>
            </div>

            {filteredCierres.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm font-medium border-2 border-dashed border-border/40 rounded-[2rem] bg-card/25">
                No hay cierres de caja que coincidan con la búsqueda.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCierres.map((c, idx) => (
                  <ClosureAccordionItem
                    key={c.fecha}
                    c={c}
                    idx={idx}
                    isExpanded={expandedCloseIdx === idx}
                    onToggle={() => setExpandedCloseIdx(expandedCloseIdx === idx ? null : idx)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
