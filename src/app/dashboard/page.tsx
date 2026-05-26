
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  ClipboardCheck, 
  TrendingUp, 
  Flame, 
  ChefHat, 
  Beer, 
  Utensils 
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

  const totalVentasCerradas = ordenes
    .filter(o => o.estado === 'CERRADA')
    .reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0);

  const mesasOcupadas = mesas.filter(m => m.estado === 'OCUPADA' || m.estado === 'EN PEDIDO' || m.estado === 'LISTA PAGAR').length;
  const pedidosPendientes = ordenes
    .filter(o => o.estado === 'ABIERTA')
    .reduce((acc, o) => acc + o.items.filter(i => i.estado === 'PENDIENTE' || i.estado === 'EN PREPARACION').length, 0);

  const kpis = [
    { title: "Ventas Hoy", value: `$${totalVentasCerradas.toLocaleString()}`, change: "+12.5%", icon: DollarSign, color: "text-green-500" },
    { title: "Mesas Activas", value: `${mesasOcupadas} / ${mesas.length}`, change: `${Math.round((mesasOcupadas/mesas.length)*100)}% Ocupación`, icon: Utensils, color: "text-secondary" },
    { title: "Pedidos Pendientes", value: pedidosPendientes.toString(), change: "En estaciones", icon: ClipboardCheck, color: "text-primary" },
    { title: "Ticket Promedio", value: `$${totalVentasCerradas > 0 ? Math.round(totalVentasCerradas / ordenes.filter(o => o.estado === 'CERRADA').length).toLocaleString() : 0}`, change: "+5% vs ayer", icon: TrendingUp, color: "text-blue-500" },
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
        <div className="bg-card px-4 py-2 rounded-lg border border-border flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-mono uppercase text-muted-foreground">Cierre Actual</p>
            <p className="font-bold text-secondary">${totalVentasCerradas.toLocaleString()}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:glow-orange transition-all">
            Hacer Corte
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, i) => (
          <Card key={i} className="bg-card/50 border-border paper-texture">
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
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-headline">Flujo de Ventas (Hoy)</CardTitle>
          </CardHeader>
          <CardContent>
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
          <Card className="bg-card border-border border-l-4 border-l-secondary">
            <CardHeader>
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <Flame className="w-5 h-5 text-secondary" />
                Estado de Estaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stations.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-md", s.color)}>
                      <s.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{s.pending}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono">Pend.</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-lg font-headline">Alertas de Inventario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                <span className="text-sm">Costilla al Barril</span>
                <span className="text-xs font-bold text-destructive">8 kg (Crit.)</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                <span className="text-sm">Punta Trasera</span>
                <span className="text-xs font-bold text-yellow-500">12 kg (Bajo)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
