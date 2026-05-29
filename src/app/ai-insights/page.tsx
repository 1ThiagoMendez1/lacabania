
"use client"

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
    <main className="p-8">
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
        <Button onClick={fetchInsights} disabled={loading} className="bg-accent gap-2">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Actualizar Análisis
        </Button>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-[400px] w-full" /><Skeleton className="h-[400px] w-full" />
        </div>
      ) : insights ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-card border-secondary border-t-4">
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-secondary" />Ventas</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-6 pt-4">
              <div className="bg-accent/30 p-6 rounded-2xl">
                <p className="text-xs text-muted-foreground mb-2">Hoy (Est.)</p>
                <p className="text-3xl font-black text-secondary">${insights.dailySalesForecast.toLocaleString('es-CO')}</p>
              </div>
              <div className="bg-accent/30 p-6 rounded-2xl">
                <p className="text-xs text-muted-foreground mb-2">Semana (Est.)</p>
                <p className="text-3xl font-black text-secondary">${insights.weeklySalesForecast.toLocaleString('es-CO')}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-primary border-t-4">
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Staffing</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {insights.staffingRecommendations.map((rec, i) => (
                <div key={i} className="flex gap-4 p-4 bg-accent/20 rounded-xl border border-border/50">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-1" />
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-orange-500" />Alertas Inventario</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insights.inventoryReorderSuggestions.map((item, i) => (
                <div key={i} className="p-4 bg-accent/30 rounded-xl border">
                  <h4 className="font-bold">{item.item}</h4>
                  <p className="text-sm font-bold mt-2">Pedir +{item.suggestedQuantity} kg</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.reason}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </main>
  );
}
