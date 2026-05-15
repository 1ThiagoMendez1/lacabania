
"use client"

import { usePOSStore } from "@/lib/store";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ChefHat, 
  Flame, 
  Beer, 
  CircleDollarSign, 
  Package, 
  BarChart3, 
  Settings,
  LogOut,
  Bell,
  Utensils,
  PlayCircle
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Rol, Estacion } from "@/lib/types";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", roles: ["ADMINISTRADOR", "CAJERO"] },
  { icon: UtensilsCrossed, label: "Mesas", href: "/mesas", roles: ["ADMINISTRADOR", "CAJERO", "MESERO"] },
  { icon: Flame, label: "Asado", href: "/estaciones/asado", roles: ["ADMINISTRADOR", "COCINERO"] },
  { icon: Utensils, label: "Parrilla", href: "/estaciones/parrilla", roles: ["ADMINISTRADOR", "COCINERO"] },
  { icon: ChefHat, label: "Cocina", href: "/estaciones/cocina", roles: ["ADMINISTRADOR", "COCINERO"] },
  { icon: Beer, label: "Bar", href: "/estaciones/bar", roles: ["ADMINISTRADOR", "BARTENDER"] },
  { icon: CircleDollarSign, label: "Caja", href: "/caja", roles: ["ADMINISTRADOR", "CAJERO"] },
  { icon: Package, label: "Inventario", href: "/inventario", roles: ["ADMINISTRADOR", "CAJERO"] },
  { icon: BarChart3, label: "Reportes & AI", href: "/ai-insights", roles: ["ADMINISTRADOR"] },
];

const ROLES: Rol[] = ["ADMINISTRADOR", "CAJERO", "MESERO", "COCINERO", "BARTENDER"];
const ESTACIONES: { label: string, val: string }[] = [
  { label: "🔥 Asado", val: "asado" },
  { label: "🍖 Parrilla", val: "parrilla" },
  { label: "👨‍🍳 Cocina", val: "cocina" },
  { label: "🍹 Bar", val: "bar" }
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, productos } = usePOSStore();

  if (!user) return null;

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.rol));
  const lowStockCount = productos.filter(p => p.stock <= p.stockMinimo).length;

  const handleRoleChange = (newRol: Rol) => {
    setUser({
      ...user,
      rol: newRol,
      nombre: newRol.charAt(0) + newRol.slice(1).toLowerCase() + " Usuario"
    });
  };

  return (
    <aside className="w-64 border-r border-border bg-card wood-texture flex flex-col h-screen fixed left-0 top-0 z-40">
      <div className="p-6">
        <h1 className="font-decorative text-3xl text-secondary flex items-center gap-2">
          La Cabaña 🤠
        </h1>
        <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest">
          Sistema POS v1.0
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {filteredMenu.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary text-primary-foreground glow-orange font-medium" 
                  : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-secondary")} />
              <span>{item.label}</span>
              {item.label === "Inventario" && lowStockCount > 0 && (
                <Badge className="ml-auto bg-destructive text-[10px] h-4 px-1">{lowStockCount}</Badge>
              )}
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-secondary rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border mt-auto space-y-4 bg-background/20">
        <div className="space-y-3 px-2">
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">
            <PlayCircle className="w-3 h-3" />
            <span>Simulador de Vistas</span>
          </div>
          
          <div className="space-y-2">
            <Select onValueChange={(v) => handleRoleChange(v as Rol)} defaultValue={user.rol}>
              <SelectTrigger className="w-full bg-background/50 border-border h-8 text-[11px]">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {ROLES.map((rol) => (
                  <SelectItem key={rol} value={rol} className="text-xs">{rol}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-1">
              {ESTACIONES.map((est) => (
                <button
                  key={est.val}
                  onClick={() => router.push(`/estaciones/${est.val}`)}
                  className="text-[10px] bg-accent/50 hover:bg-secondary/20 border border-border py-1 px-2 rounded-md text-left transition-colors truncate"
                >
                  {est.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-2 bg-accent/50 rounded-xl border border-border/50">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold border border-secondary">
            {user.nombre[0]}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold truncate">{user.nombre}</span>
            <span className="text-[9px] text-muted-foreground font-mono uppercase">{user.rol}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
