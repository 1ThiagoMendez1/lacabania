
"use client"

import { usePOSStore } from "@/lib/store";
import { 
  History, 
  Search, 
  UserCircle, 
  TrendingUp, 
  Calendar, 
  ChevronRight,
  ChevronDown,
  ClipboardList,
  CircleDollarSign,
  Users,
  UtensilsCrossed
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { cn, getOrderIdentifier } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function HistorialMeserosPage() {
  const { ordenes, usuarios, fechaOperativa } = usePOSStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMeseroId, setExpandedMeseroId] = useState<string | null>(null);

  // Filtro de período (Día / Mes / Año)
  const [filterPeriod, setFilterPeriod] = useState<'dia' | 'mes' | 'ano'>('ano');

  const toggleMesero = (id: string) => {
    setExpandedMeseroId(prev => prev === id ? null : id);
  };

  // Solo incluimos a los meseros para los reportes de desempeño
  const meseros = usuarios.filter(u => u.rol === 'MESERO');
  
  const closedOrders = useMemo(() => {
    return ordenes.filter(o => o.estado === 'CERRADA').sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [ordenes]);

  // Aplicar filtros de fecha a las órdenes
  const filteredClosedOrders = useMemo(() => {
    // Usar la fecha operativa como referencia de "hoy" (o la fecha actual si no existe)
    const refDate = fechaOperativa ? new Date(fechaOperativa + "T12:00:00") : new Date();
    const currentYear = refDate.getFullYear();
    const currentMonth = refDate.getMonth();
    const currentDay = refDate.getDate();

    return closedOrders.filter(o => {
      const orderDate = new Date(o.updatedAt);
      
      if (filterPeriod === 'dia') {
        return (
          orderDate.getFullYear() === currentYear &&
          orderDate.getMonth() === currentMonth &&
          orderDate.getDate() === currentDay
        );
      } else if (filterPeriod === 'mes') {
        return (
          orderDate.getFullYear() === currentYear &&
          orderDate.getMonth() === currentMonth
        );
      } else {
        // 'ano'
        return orderDate.getFullYear() === currentYear;
      }
    });
  }, [closedOrders, filterPeriod, fechaOperativa]);

  const performanceStats = useMemo(() => {
    return meseros.map(m => {
      const orders = filteredClosedOrders.filter(o => o.meseroId === m.id);
      const totalSales = orders.reduce((acc, o) => 
        acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0
      );
      const ratedOrders = orders.filter(o => o.rating && o.rating > 0);
      const avgRating = ratedOrders.length > 0 
        ? (ratedOrders.reduce((sum, o) => sum + (o.rating || 0), 0) / ratedOrders.length).toFixed(1)
        : null;
      return {
        ...m,
        orders,
        orderCount: orders.length,
        totalSales,
        avgRating
      };
    }).sort((a, b) => b.totalSales - a.totalSales);
  }, [meseros, filteredClosedOrders]);

  const filteredStats = useMemo(() => {
    return performanceStats.filter(m => {
      const meseroName = m.nombre.toLowerCase();
      const search = searchTerm.toLowerCase();
      // Match by waiter name or if any of their orders match the search (by ID)
      return meseroName.includes(search) || m.orders.some(o => o.id.toLowerCase().includes(search));
    });
  }, [performanceStats, searchTerm]);

  return (
    <main className="p-4 md:p-8 space-y-8">
      {/* Cabecera general de operación con Filtro */}
      <div className="bg-primary text-primary-foreground p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl wood-texture relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/80 opacity-90 pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/10 shadow-inner">
            <History className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black font-headline tracking-tight text-white">Historial de Meseros</h2>
            <p className="text-sm opacity-90 font-medium mt-1 text-primary-foreground/90">
              Control de desempeño y mesas atendidas 🤠
            </p>
          </div>
        </div>

        {/* Filtro Período (Día / Mes / Año) */}
        <div className="relative z-10 bg-black/15 border border-white/15 p-1 rounded-full flex items-center gap-1 w-fit shrink-0 shadow-inner">
          <button
            onClick={() => setFilterPeriod('dia')}
            className={cn(
              "px-5 py-2 text-xs font-bold rounded-full transition-all duration-200",
              filterPeriod === 'dia' 
                ? "bg-white text-primary shadow-sm" 
                : "text-white hover:bg-black/15"
            )}
          >
            Día
          </button>
          <button
            onClick={() => setFilterPeriod('mes')}
            className={cn(
              "px-5 py-2 text-xs font-bold rounded-full transition-all duration-200",
              filterPeriod === 'mes' 
                ? "bg-white text-primary shadow-sm" 
                : "text-white hover:bg-black/15"
            )}
          >
            Mes
          </button>
          <button
            onClick={() => setFilterPeriod('ano')}
            className={cn(
              "px-5 py-2 text-xs font-bold rounded-full transition-all duration-200",
              filterPeriod === 'ano' 
                ? "bg-white text-primary shadow-sm" 
                : "text-white hover:bg-black/15"
            )}
          >
            Año
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border paper-texture shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-5 h-5 text-secondary" />
              <Badge variant="outline" className="text-[10px]">Turno Hoy</Badge>
            </div>
            <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Meseros en Turno</p>
            <h3 className="text-2xl font-black">{meseros.length}</h3>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border paper-texture shadow-xl border-t-4 border-t-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <CircleDollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Total Facturado</p>
            <h3 className="text-2xl font-black text-green-500">
              ${filteredClosedOrders.reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0).toLocaleString('es-CO')}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-card border-border paper-texture shadow-xl border-t-4 border-t-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Mesas Cerradas</p>
            <h3 className="text-2xl font-black">{filteredClosedOrders.length}</h3>
          </CardContent>
        </Card>

        <Card className="bg-card border-border paper-texture shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Promedio por Mesa</p>
            <h3 className="text-2xl font-black">
              ${filteredClosedOrders.length > 0 
                ? Math.round(filteredClosedOrders.reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0) / filteredClosedOrders.length).toLocaleString('es-CO')
                : 0
              }
            </h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Performance Sidebar */}
        <Card className="bg-card border-border shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-accent/20 border-b border-border/50">
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              Ranking de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {performanceStats.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-10 italic">Sin datos de meseros activos.</p>
            ) : (
              performanceStats.map((m, index) => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-accent/10 rounded-2xl border border-border/30 group hover:border-primary/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{m.nombre}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black">{m.orderCount} mesas{m.avgRating && ` • ⭐ ${m.avgRating}`}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-secondary">${m.totalSales.toLocaleString('es-CO')}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Detailed History */}
        <Card className="lg:col-span-3 bg-card border-border shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between bg-accent/20 border-b border-border/50 p-6 gap-4">
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Historial Detallado
            </CardTitle>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar mesero..." 
                  className="pl-10 h-10 bg-background/50 rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4 bg-background/50">
            {filteredStats.length === 0 ? (
              <p className="text-center py-20 text-muted-foreground italic">
                No se encontraron meseros o registros.
              </p>
            ) : (
              filteredStats.map(m => {
                const isExpanded = expandedMeseroId === m.id;
                return (
                  <div key={m.id} className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent/10 transition-colors"
                      onClick={() => toggleMesero(m.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                          <UserCircle className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-foreground">{m.nombre}</h4>
                          <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{m.orderCount} mesas atendidas{m.avgRating && ` • Promedio: ⭐ ${m.avgRating}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="font-black text-secondary text-xl">${m.totalSales.toLocaleString('es-CO')}</span>
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-muted-foreground">
                          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border/50 bg-accent/5 p-4 animate-in slide-in-from-top-2 fade-in duration-200">
                        <Table>
                          <TableHeader className="bg-accent/30">
                            <TableRow className="border-border/50">
                              <TableHead className="text-[10px] font-black uppercase tracking-widest">Mesa</TableHead>
                              <TableHead className="text-[10px] font-black uppercase tracking-widest">Fecha / Hora</TableHead>
                              <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Total</TableHead>
                              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">Calificación</TableHead>
                              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">Pago</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {m.orders.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic text-sm">
                                  Sin mesas registradas.
                                </TableCell>
                              </TableRow>
                            ) : (
                              m.orders.map((o) => {
                                const subtotal = o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0);
                                const tienePropina = o.clienteNombre !== 'SIN_PROPINA';
                                const total = subtotal * (tienePropina ? 1.1 : 1.0);
                                
                                return (
                                  <TableRow key={o.id} className="border-border/50 hover:bg-background/80 transition-colors">
                                    <TableCell>
                                      <div className="flex flex-col gap-1">
                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 shadow-sm w-fit font-black tracking-wider px-2 py-0.5">
                                          {getOrderIdentifier({ mesaId: o.mesaId, consecutivo: o.consecutivo, id: o.id })}
                                        </Badge>
                                        <span className="text-[9px] font-mono text-muted-foreground uppercase">
                                          {o.mesaId >= 101 ? `Llevar ${o.mesaId - 100}` : `Mesa ${o.mesaId}`}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col text-[10px]">
                                        <span className="font-bold text-foreground">{format(new Date(o.updatedAt), "dd MMM yyyy", { locale: es })}</span>
                                        <span className="text-muted-foreground flex items-center gap-1 mt-0.5">
                                          <Calendar className="w-3 h-3" /> {format(new Date(o.updatedAt), "HH:mm a")}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <span className="font-black text-secondary">${total.toLocaleString('es-CO')}</span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {o.rating && o.rating > 0 ? (
                                        <span className="text-yellow-500 font-bold flex items-center justify-center gap-0.5">
                                          ⭐ {o.rating}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-muted-foreground italic">N/A</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Badge className="bg-muted text-muted-foreground text-[9px] font-black tracking-widest border border-border/50">
                                        {o.metodoPago}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
