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
  Bell
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", roles: ["ADMINISTRADOR", "CAJERO"] },
  { icon: UtensilsCrossed, label: "Mesas", href: "/mesas", roles: ["ADMINISTRADOR", "CAJERO", "MESERO"] },
  { icon: Flame, label: "Asado", href: "/estaciones/asado", roles: ["ADMINISTRADOR", "COCINERO"] },
  { icon: ChefHat, label: "Cocina", href: "/estaciones/cocina", roles: ["ADMINISTRADOR", "COCINERO"] },
  { icon: Beer, label: "Bar", href: "/estaciones/bar", roles: ["ADMINISTRADOR", "BARTENDER"] },
  { icon: CircleDollarSign, label: "Caja", href: "/caja", roles: ["ADMINISTRADOR", "CAJERO"] },
  { icon: Package, label: "Inventario", href: "/inventario", roles: ["ADMINISTRADOR", "CAJERO"] },
  { icon: BarChart3, label: "Reportes & AI", href: "/ai-insights", roles: ["ADMINISTRADOR"] },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = usePOSStore();

  if (!user) return null;

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.rol));

  return (
    <aside className="w-64 border-r border-border bg-card wood-texture flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6">
        <h1 className="font-decorative text-3xl text-secondary flex items-center gap-2">
          La Cabaña 🤠
        </h1>
        <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest">
          Sistema POS v1.0
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
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
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-secondary")} />
              <span>{item.label}</span>
              {item.label === "Inventario" && (
                <Badge className="ml-auto bg-destructive text-[10px] h-4 px-1">2</Badge>
              )}
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-secondary rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center gap-3 px-4 py-3 bg-accent/50 rounded-xl mb-4 border border-border/50">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold border-2 border-secondary shadow-lg">
            {user.nombre[0]}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">{user.nombre}</span>
            <span className="text-[10px] text-muted-foreground font-mono">{user.rol}</span>
          </div>
          <Bell className="w-4 h-4 ml-auto text-secondary animate-pulse-slow" />
        </div>
        
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}