
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
  PlayCircle,
  Utensils
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
import { Rol } from "@/lib/types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@/components/ui/sidebar";

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
  const { state } = useSidebar();

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

  const isExpanded = state === "expanded";

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-card wood-texture shadow-xl">
      <SidebarHeader className="p-4 flex items-center justify-center">
        {isExpanded ? (
          <div className="w-full">
            <h1 className="font-decorative text-3xl text-secondary truncate">La Cabaña 🤠</h1>
            <p className="text-[9px] font-mono text-muted-foreground mt-1 uppercase tracking-widest text-center">
              Sistema POS v1.0
            </p>
          </div>
        ) : (
          <span className="text-2xl">🤠</span>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={cn(!isExpanded && "hidden")}>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenu.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "transition-all duration-200",
                        isActive && "bg-primary text-primary-foreground glow-orange"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-secondary")} />
                        <span>{item.label}</span>
                        {item.label === "Inventario" && lowStockCount > 0 && isExpanded && (
                          <Badge className="ml-auto bg-destructive text-[10px] h-4 px-1">{lowStockCount}</Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isExpanded && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <PlayCircle className="w-3 h-3" />
              <span>Simulador</span>
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <div className="space-y-2 mt-2">
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
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border bg-background/20">
        <div className={cn(
          "flex items-center gap-3 bg-accent/50 rounded-xl border border-border/50 transition-all",
          isExpanded ? "p-3" : "p-1 justify-center"
        )}>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold border border-secondary shrink-0">
            {user.nombre[0]}
          </div>
          {isExpanded && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate">{user.nombre}</span>
              <span className="text-[9px] text-muted-foreground font-mono uppercase">{user.rol}</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
