
"use client"

import { usePOSStore } from "@/lib/store";
import { ALL_MENU_ITEMS } from "@/components/layout/AppSidebar";
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  UserCircle,
  AlertCircle
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Rol } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ROLES: Rol[] = ["ADMINISTRADOR", "CAJERO", "MESERO", "COCINERO", "BARTENDER"];

export default function PermisosPage() {
  const { permisos, togglePermiso, user } = usePOSStore();

  if (user?.rol !== 'ADMINISTRADOR') {
    return (
      <main className="p-8 flex items-center justify-center h-full">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            Solo el Administrador tiene acceso a la configuración de seguridad.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="p-8">
      <header className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-headline text-foreground">Gestión de Accesos</h2>
          </div>
          <p className="text-muted-foreground">Configura qué apartados puede ver cada rol de tu equipo 🤠</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <Card className="bg-card border-border paper-texture overflow-hidden shadow-2xl">
          <CardHeader className="border-b border-border/50 bg-accent/20">
            <CardTitle className="text-xl font-headline flex items-center gap-2">
              <Lock className="w-5 h-5 text-secondary" />
              Matriz de Visibilidad
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-accent/50">
                <TableRow className="border-border">
                  <TableHead className="w-[250px]">Apartado del Sistema</TableHead>
                  {ROLES.map(rol => (
                    <TableHead key={rol} className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <UserCircle className="w-4 h-4 opacity-50" />
                        <span className="text-[10px] uppercase font-bold tracking-tighter">{rol}</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ALL_MENU_ITEMS.map((item) => (
                  <TableRow key={item.label} className="border-border hover:bg-accent/20 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-accent/50 rounded-md">
                          <item.icon className="w-4 h-4 text-primary" />
                        </div>
                        <span>{item.label}</span>
                      </div>
                    </TableCell>
                    {ROLES.map(rol => {
                      const isAllowed = permisos[rol]?.includes(item.label);
                      const isSelfAdmin = rol === 'ADMINISTRADOR' && item.label === 'Permisos';
                      
                      return (
                        <TableCell key={`${rol}-${item.label}`} className="text-center">
                          <div className="flex justify-center">
                            <Checkbox 
                              checked={isAllowed} 
                              onCheckedChange={() => togglePermiso(rol, item.label)}
                              disabled={isSelfAdmin} // No permitir que el admin se quite acceso a permisos
                              className={cn(
                                "h-5 w-5",
                                isAllowed ? "data-[state=checked]:bg-secondary border-secondary" : "border-muted-foreground/30"
                              )}
                            />
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Alert className="bg-secondary/10 border-secondary/20">
          <Unlock className="h-4 w-4 text-secondary" />
          <AlertTitle className="text-secondary">Consejo Pro</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Los cambios se aplican de forma instantánea. Usa el <strong>Simulador de Roles</strong> en la barra lateral para verificar cómo ve el sistema cada integrante de tu equipo tras tus ajustes.
          </AlertDescription>
        </Alert>
      </div>
    </main>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
