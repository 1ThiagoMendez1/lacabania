
"use client"

import { AppSidebar } from "@/components/layout/AppSidebar";
import { generateProactiveOperationalInsights, ProactiveOperationalInsightsOutput } from "@/ai/flows/proactive-operational-insights";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BrainCircuit, 
  TrendingUp, 
  Users, 
  Package, 
  Calendar, 
  Clock,
  Sparkles,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<ProactiveOperationalInsightsOutput | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const data = await generateProactiveOperationalInsights({
        historicalSalesSummary: "Las ventas han aumentado un 20% los fines de semana. La Picaña es el plato más vendido entre las 13:00 y las 15:00. Los jueves tenemos un flujo constante de grupos empresariales.",
        currentInventorySummary: "Estamos bajos en Costilla al Barril (8kg) y Punta Trasera (12kg). El stock de bebidas está saludable.",
        currentDate: new Date().toISOString().split('T')[0]
      });
      setInsights(data);
    } catch (err) {
      console.error("Failed to fetch AI insights", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="flex bg-background min-h-screen">
      <AppSidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BrainCircuit className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-headline text-foreground">Inteligencia Operacional</h2>
            </div>
            <p className="text-muted-foreground">Recomendaciones proactivas basadas en tus datos históricos 🤠</p>
          </div>
          <Button 
            onClick={fetchInsights} 
            disabled={loading}
            className="bg-accent border border-border hover:bg-accent/80 gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Actualizar Análisis
          </Button>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-[400px] w-full bg-card/50" />
            <Skeleton className="h-[400px] w-full bg-card/50" />
            <Skeleton className="h-[200px] w-full bg-card/50" />
            <Skeleton className="h-[200px] w-full bg-card/50" />
          </div>
        ) : insights ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sales Forecast */}
            <Card className="bg-card border-border border-t-4 border-t-secondary relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <TrendingUp className="w-24 h-24" />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-headline">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                  Proyección de Ventas
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-6 pt-4">
                <div className="bg-accent/30 p-6 rounded-2xl border border-border">
                  <p className="text-xs text-muted-foreground uppercase font-mono mb-2">Hoy (Est.)</p>
                  <p className="text-3xl font-black text-secondary">${insights.dailySalesForecast.toLocaleString()}</p>
                </div>
                <div className="bg-accent/30 p-6 rounded-2xl border border-border">
                  <p className="text-xs text-muted-foreground uppercase font-mono mb-2">Semana (Est.)</p>
                  <p className="text-3xl font-black text-secondary">${insights.weeklySalesForecast.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Staffing */}
            <Card className="bg-card border-border border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-headline">
                  <Users className="w-5 h-5 text-primary" />
                  Recomendaciones de Staffing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.staffingRecommendations.map((rec, i) => (
                  <div key={i} className="flex gap-4 items-start bg-accent/20 p-4 rounded-xl border border-border/50">
                    <div className="mt-1">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm leading-relaxed">{rec}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Inventory Suggestions */}
            <Card className="bg-card border-border lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl font-headline">
                  <Package className="w-5 h-5 text-orange-500" />
                  Sugerencias de Inventario
                </CardTitle>
                <Badge variant="outline" className="border-orange-500/50 text-orange-500">
                  {insights.inventoryReorderSuggestions.length} Alertas
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {insights.inventoryReorderSuggestions.map((item, i) => (
                    <div key={i} className="p-4 bg-accent/30 rounded-xl border border-border hover:border-primary/50 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg">{item.item}</h4>
                        <AlertTriangle className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-4">
                        <span>Actual: <b className="text-foreground">{item.currentStock}kg</b></span>
                        <span>Mínimo: <b className="text-foreground">{item.minimumStock}kg</b></span>
                      </div>
                      <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
                        <p className="text-[10px] text-primary uppercase font-bold mb-1">Recomendación:</p>
                        <p className="text-sm font-bold">Pedir +{item.suggestedQuantity} kg</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Peak Hours & Busy Days */}
            <Card className="bg-card border-border border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-headline">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Horas Pico Proyectadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {insights.peakHours.map((hour, i) => (
                    <Badge key={i} className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-4 py-2 text-sm font-bold">
                      {hour}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-headline">
                  <Calendar className="w-5 h-5 text-green-500" />
                  Días de Alta Demanda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {insights.busyDays.map((day, i) => (
                    <Badge key={i} className="bg-green-500/10 text-green-500 border-green-500/20 px-4 py-2 text-sm font-bold">
                      {day}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>
    </div>
  );
}
