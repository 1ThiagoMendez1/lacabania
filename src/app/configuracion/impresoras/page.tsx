"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Printer, 
  Wifi, 
  WifiOff, 
  Settings2, 
  RefreshCw, 
  HardDrive,
  Flame,
  Utensils,
  Beer,
  ChefHat,
  Receipt,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const STATIONS = [
  { id: 'ASADO', label: 'Estación Asado', icon: Flame, color: 'text-primary' },
  { id: 'PARRILLA', label: 'Estación Parrilla', icon: Utensils, color: 'text-orange-400' },
  { id: 'COCINA', label: 'Estación Cocina', icon: ChefHat, color: 'text-secondary' },
  { id: 'BAR', label: 'Barra de Bebidas', icon: Beer, color: 'text-blue-400' },
  { id: 'CAJA', label: 'Caja Principal (Recibos)', icon: Receipt, color: 'text-green-500' },
];

export default function ImpresorasPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsConnecting(true);
    // Simulación de conexión a QZ Tray
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
      setAvailablePrinters([
        "EPSON TM-T20II (Caja)",
        "Kitchen-Printer-1 (Asado)",
        "Kitchen-Printer-2 (Cocina)",
        "Bar-Thermal-P01",
        "PDF-Printer"
      ]);
      toast({
        title: "QZ Tray Conectado",
        description: "Servidor de impresión local detectado exitosamente.",
      });
    }, 1500);
  };

  const handleUpdateMapping = (stationId: string, printerName: string) => {
    setMappings(prev => ({ ...prev, [stationId]: printerName }));
    toast({
      title: "Configuración Guardada",
      description: `Impresora asignada a ${stationId}.`,
    });
  };

  const testPrint = (stationId: string) => {
    const printer = mappings[stationId];
    if (!printer) {
      toast({
        variant: "destructive",
        title: "Error de Impresión",
        description: "Debes asignar una impresora a esta estación primero.",
      });
      return;
    }
    toast({
      title: "Prueba Enviada",
      description: `Imprimiendo ticket de prueba en: ${printer}`,
    });
  };

  return (
    <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Printer className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-headline text-foreground">Configuración de Impresión</h2>
          </div>
          <p className="text-muted-foreground">Gestión de periféricos mediante QZ Tray 🤠</p>
        </div>

        <div className="w-full md:w-auto">
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting}
            className={cn(
              "w-full md:w-auto font-bold gap-2 h-12 rounded-xl transition-all",
              isConnected ? "bg-green-600 hover:bg-green-700" : "bg-primary"
            )}
          >
            {isConnecting ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : isConnected ? (
              <Wifi className="w-5 h-5" />
            ) : (
              <WifiOff className="w-5 h-5" />
            )}
            {isConnected ? "QZ TRAY CONECTADO" : "CONECTAR QZ TRAY"}
          </Button>
        </div>
      </header>

      {!isConnected ? (
        <Card className="bg-card/50 border-dashed border-2 border-border p-12 flex flex-col items-center text-center space-y-4">
          <div className="p-6 bg-accent/30 rounded-full">
            <HardDrive className="w-12 h-12 text-muted-foreground opacity-20" />
          </div>
          <div className="max-w-md">
            <h3 className="text-xl font-headline mb-2">Servidor de impresión inactivo</h3>
            <p className="text-sm text-muted-foreground">
              Asegúrate de que la aplicación <strong>QZ Tray</strong> esté ejecutándose en esta computadora para poder gestionar las impresoras térmicas.
            </p>
          </div>
          <Button variant="outline" onClick={handleConnect} className="rounded-xl px-8 h-12">
            Reintentar Conexión
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
          <Card className="bg-card border-border paper-texture shadow-xl rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-accent/20 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-xl font-headline">
                <Settings2 className="w-5 h-5 text-secondary" />
                Asignación de Estaciones
              </CardTitle>
              <CardDescription>Vincula cada área con su impresora física</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {STATIONS.map((station) => (
                <div key={station.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
                      <station.icon className={cn("w-4 h-4", station.color)} />
                      {station.label}
                    </Label>
                    {mappings[station.id] && (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/30 text-[9px] py-0">ACTIVA</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Select 
                      onValueChange={(val) => handleUpdateMapping(station.id, val)}
                      value={mappings[station.id]}
                    >
                      <SelectTrigger className="bg-background/50 h-11">
                        <SelectValue placeholder="Seleccionar Impresora" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {availablePrinters.map(printer => (
                          <SelectItem key={printer} value={printer}>{printer}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-11 w-11 shrink-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={() => testPrint(station.id)}
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-card border-border shadow-lg rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-green-500" />
                  Estado del Servicio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-accent/20 rounded-2xl border border-border/50">
                  <span className="text-sm font-medium">Servidor Local</span>
                  <Badge className="bg-green-500 font-bold">ACTIVO</Badge>
                </div>
                <div className="flex justify-between items-center p-4 bg-accent/20 rounded-2xl border border-border/50">
                  <span className="text-sm font-medium">Protocolo</span>
                  <span className="text-xs font-mono text-muted-foreground">WebSocket (Secure)</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-accent/20 rounded-2xl border border-border/50">
                  <span className="text-sm font-medium">Impresoras Listadas</span>
                  <span className="text-lg font-black text-secondary">{availablePrinters.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-secondary/10 border-secondary/20 rounded-[2rem]">
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-4">
                  <div className="p-2 bg-secondary/20 rounded-xl h-fit">
                    <AlertCircle className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-secondary">¿Cómo funciona QZ Tray?</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Este módulo permite que la aplicación web se comunique directamente con las impresoras térmicas de tu local. 
                      Para que funcione, debes descargar e instalar <strong>QZ Tray</strong> en las computadoras que tengan las impresoras conectadas físicamente.
                    </p>
                  </div>
                </div>
                <Button variant="link" className="text-secondary p-0 text-xs font-bold h-auto">Descargar QZ Tray (Sitio Oficial)</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}
