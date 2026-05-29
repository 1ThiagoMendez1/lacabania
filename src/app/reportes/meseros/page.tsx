"use client"

import { usePOSStore } from "@/lib/store";
import { 
  History, 
  Search, 
  UserCircle, 
  TrendingUp, 
  Calendar, 
  ChevronRight,
  ClipboardList,
  CircleDollarSign,
  Users
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
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function HistorialMeserosPage() {
  const { ordenes, usuarios } = usePOSStore();
  const [searchTerm, setSearchTerm] = useState("");

  const meseros = usuarios.filter(u => u.rol === 'MESERO' || u.rol === 'ADMINISTRADOR');
  
  const closedOrders = useMemo(() => {
    return ordenes.filter(o => o.estado === 'CERRADA').sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [ordenes]);

  const performanceStats = useMemo(() => {
    return meseros.map(m => {
      const orders = closedOrders.filter(o => o.meseroId === m.id);
      const totalSales = orders.reduce((acc, o) => 
        acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0
      );
      return {
        ...m,
        orderCount: orders.length,
        totalSales
      };
    }).sort((a, b) => b.totalSales - a.totalSales);
  }, [meseros, closedOrders]);

  const filteredOrders = useMemo(() => {
    return closedOrders.filter(o => {
      const meseroName = usuarios.find(u => u.id === o.meseroId)?.nombre.toLowerCase() || "";
      return meseroName.includes(searchTerm.toLowerCase()) || o.id.includes(searchTerm);
    });
  }, [closedOrders, searchTerm, usuarios]);

  return (
    <main className="p-4 md:p-8 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <History className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-headline text-foreground">Historial de Meseros</h2>
          </div>
          <p className="text-muted-foreground">Control de desempeño y mesas atendidas 🤠</p>
        </div>
      </header>

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
              ${closedOrders.reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0).toLocaleString('es-CO')}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-card border-border paper-texture shadow-xl border-t-4 border-t-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Mesas Cerradas</p>
            <h3 className="text-2xl font-black">{closedOrders.length}</h3>
          </CardContent>
        </Card>

        <Card className="bg-card border-border paper-texture shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Promedio por Mesa</p>
            <h3 className="text-2xl font-black">
              ${closedOrders.length > 0 
                ? Math.round(closedOrders.reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0), 0) / closedOrders.length).toLocaleString('es-CO')
                : 0
              }
            </h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Sidebar */}
        <Card className="bg-card border-border shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-accent/20 border-b border-border/50">
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              Ranking de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {performanceStats.map((m, index) => (
              <div key={m.id} className="flex items-center justify-between p-4 bg-accent/10 rounded-2xl border border-border/30 group hover:border-primary/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{m.nombre}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black">{m.orderCount} mesas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-secondary">${m.totalSales.toLocaleString('es-CO')}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Detailed History */}
        <Card className="lg:col-span-2 bg-card border-border shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-accent/20 border-b border-border/50 p-6">
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Historial Detallado
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar mesero u orden..." 
                className="pl-10 h-10 bg-background/50 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-accent/30">
                <TableRow className="border-border">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Mesero</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Mesa</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Fecha / Hora</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Total</TableHead>
                  <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                      No se encontraron registros en el historial.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((o) => {
                    const mesero = usuarios.find(u => u.id === o.meseroId);
                    const total = o.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0) * 1.1; // Total con propina
                    
                    return (
                      <TableRow key={o.id} className="border-border hover:bg-accent/10 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCircle className="w-4 h-4 text-muted-foreground" />
                            <span className="font-bold text-sm">{mesero?.nombre || "Sistema"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                            Mesa {o.mesaId}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-[10px]">
                            <span className="font-bold">{format(new Date(o.updatedAt), "dd MMM yyyy", { locale: es })}</span>
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" /> {format(new Date(o.updatedAt), "HH:mm a")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-black text-secondary">${total.toLocaleString('es-CO')}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-accent text-accent-foreground text-[8px] font-black tracking-widest">
                            {o.metodoPago}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
