"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  ClipboardCheck, 
  TrendingUp, 
  Flame, 
  ChefHat, 
  Beer, 
  Map,
  Plus,
  Trash2,
  FileText,
  Calculator,
  ArrowDownCircle,
  ArrowUpCircle,
  Printer
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
import { cn } from "@/lib/utils";
import { usePOSStore } from "@/lib/store";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { useState } from "react";
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
  const { ordenes, mesas } = usePOSStore();
  const { toast } = useToast();
  const [isCorteOpen, setIsCorteOpen] = useState(false);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [nuevoGasto, setNuevoGasto] = useState({ descripcion: '', valor: '' });

  // Cálculos de ventas
  const ventasCerradas = ordenes.filter(o => o.estado === 'CERRADA');
  
  const totalVentasCerradas = ventasCerradas.reduce((acc, o) => 
    acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0);
  
  const ventasPorMetodo = {
    EFECTIVO: ventasCerradas.filter(o => o.metodoPago === 'EFECTIVO').reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0),
    TARJETA: ventasCerradas.filter(o => o.metodoPago === 'TARJETA').reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0),
    TRANSFERENCIA: ventasCerradas.filter(o => o.metodoPago === 'TRANSFERENCIA').reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0),
  };

  const totalPropinas = totalVentasCerradas * 0.10;
  const granTotalRecaudado = totalVentasCerradas + totalPropinas;

  // Gestión de Gastos
  const addGasto = () => {
    if (!nuevoGasto.descripcion || !nuevoGasto.valor) return;
    const gasto: Gasto = {
      id: Date.now().toString(),
      descripcion: nuevoGasto.descripcion,
      valor: parseFloat(nuevoGasto.valor),
      categoria: 'Operación',
      fecha: new Date().toISOString()
    };
    setGastos([...gastos, gasto]);
    setNuevoGasto({ descripcion: '', valor: '' });
  };

  const removeGasto = (id: string) => {
    setGastos(gastos.filter(g => g.id !== id));
  };

  const totalGastos = gastos.reduce((acc, g) => acc + g.valor, 0);
  const balanceNeto = granTotalRecaudado - totalGastos;

  const handleFinalizarCorte = () => {
    toast({
      title: "Corte de Caja Exitoso",
      description: "El reporte ha sido generado y los datos del turno han sido guardados.",
    });
    setIsCorteOpen(false);
    setGastos([]);
  };

  const mesasOcupadas = mesas.filter(m => m.estado === 'OCUPADA' || m.estado === 'EN PEDIDO' || m.estado === 'LISTA PAGAR').length;
  const pedidosPendientes = ordenes
    .filter(o => o.estado === 'ABIERTA')
    .reduce((acc, o) => acc + o.items.filter(i => i.estado === 'PENDIENTE' || i.estado === 'EN PREPARACION').length, 0);

  const kpis = [
    { title: "Ventas Hoy", value: `$${totalVentasCerradas.toLocaleString('es-CO')}`, change: "+12.5%", icon: DollarSign, color: "text-green-500" },
    { title: "Mesas Activas", value: `${mesasOcupadas} / ${mesas.length}`, change: `${Math.round((mesasOcupadas/mesas.length)*100)}% Ocupación`, icon: Map, color: "text-secondary" },
    { title: "Pedidos Pendientes", value: pedidosPendientes.toString(), change: "En estaciones", icon: ClipboardCheck, color: "text-primary" },
    { title: "Ticket Promedio", value: `$${totalVentasCerradas > 0 ? Math.round(totalVentasCerradas / ordenes.filter(o => o.estado === 'CERRADA').length).toLocaleString('es-CO') : 0}`, change: "+5% vs ayer", icon: TrendingUp, color: "text-blue-500" },
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
          <p className="text-muted-foreground">Bienvenido al corazón de La Cabaña 🤠</p>
        </div>
        
        <Dialog open={isCorteOpen} onOpenChange={setIsCorteOpen}>
          <DialogTrigger asChild>
            <div className="bg-card px-4 py-2 rounded-xl border border-border flex items-center gap-4 cursor-pointer hover:border-primary/50 transition-all shadow-lg group">
              <div className="text-right">
                <p className="text-[10px] font-mono uppercase text-muted-foreground">Cierre Actual</p>
                <p className="font-bold text-secondary text-xl group-hover:text-primary transition-colors">
                  ${totalVentasCerradas.toLocaleString('es-CO')}
                </p>
              </div>
              <div className="w-px h-10 bg-border" />
              <Button className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-black hover:glow-orange transition-all">
                HACER CORTE
              </Button>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border paper-texture rounded-[2.5rem]">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-primary/20 rounded-2xl">
                  <Calculator className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-headline">Corte de Caja Diario</DialogTitle>
                  <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Resumen de Ventas y Balance Operativo</p>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
              {/* Resumen de Ventas */}
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <ArrowUpCircle className="w-4 h-4" /> Ingresos por Canal
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between p-4 bg-accent/20 rounded-2xl border border-border/50">
                    <span className="text-sm font-bold">Efectivo</span>
                    <span className="font-black">${ventasPorMetodo.EFECTIVO.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-accent/20 rounded-2xl border border-border/50">
                    <span className="text-sm font-bold">Tarjeta</span>
                    <span className="font-black">${ventasPorMetodo.TARJETA.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-accent/20 rounded-2xl border border-border/50">
                    <span className="text-sm font-bold">Transferencia</span>
                    <span className="font-black">${ventasPorMetodo.TRANSFERENCIA.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-primary/5 rounded-2xl border border-primary/20 text-primary">
                    <span className="text-sm font-bold">Servicio (10% sugerido)</span>
                    <span className="font-black">${totalPropinas.toLocaleString('es-CO')}</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-dashed border-border/50">
                  <div className="flex justify-between items-end">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Recaudado</p>
                    <p className="text-4xl font-black text-secondary">${granTotalRecaudado.toLocaleString('es-CO')}</p>
                  </div>
                </div>
              </div>

              {/* Registro de Gastos */}
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-destructive flex items-center gap-2">
                  <ArrowDownCircle className="w-4 h-4" /> Gastos del Turno
                </h3>
                <div className="p-4 bg-destructive/5 rounded-2xl border border-destructive/20 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold">Descripción</Label>
                      <Input 
                        placeholder="Ej: Insumos Verduras" 
                        value={nuevoGasto.descripcion}
                        onChange={(e) => setNuevoGasto({...nuevoGasto, descripcion: e.target.value})}
                        className="bg-background/50 h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold">Valor (COP)</Label>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        value={nuevoGasto.valor}
                        onChange={(e) => setNuevoGasto({...nuevoGasto, valor: e.target.value})}
                        className="bg-background/50 h-9 text-xs"
                      />
                    </div>
                  </div>
                  <Button onClick={addGasto} className="w-full h-9 bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30 text-xs font-bold gap-2">
                    <Plus className="w-3.5 h-3.5" /> AGREGAR GASTO
                  </Button>
                </div>

                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                  {gastos.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground italic py-4">Sin gastos registrados hoy.</p>
                  ) : (
                    gastos.map(g => (
                      <div key={g.id} className="flex justify-between items-center p-3 bg-background/50 rounded-xl border border-border/30 text-xs">
                        <span className="font-medium">{g.descripcion}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-destructive">-${g.valor.toLocaleString('es-CO')}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeGasto(g.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <Separator className="bg-border/30 my-2" />

            <div className="bg-accent/30 p-6 rounded-3xl border border-border shadow-inner">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Balance Neto Final</p>
                  <p className="text-5xl font-black text-foreground tracking-tighter">${balanceNeto.toLocaleString('es-CO')}</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  <Button variant="outline" className="flex-1 md:flex-none h-14 px-8 rounded-2xl font-bold gap-2">
                    <Printer className="w-4 h-4" /> IMPRIMIR CORTE
                  </Button>
                  <Button onClick={handleFinalizarCorte} className="flex-1 md:flex-none h-14 px-8 bg-primary rounded-2xl font-black text-lg hover:glow-orange shadow-xl transition-all">
                    FINALIZAR TURNO 🤠
                  </Button>
                </div>
              </div>
            </div>
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
    </main>
  );
}
