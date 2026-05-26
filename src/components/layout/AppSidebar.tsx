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
  Utensils,
  Users
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

export const ALL_MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: UtensilsCrossed, label: "Mesas", href: "/mesas" },
  { icon: Flame, label: "Asado", href: "/estaciones/asado" },
  { icon: Utensils, label: "Parrilla", href: "/estaciones/parrilla" },
  { icon: ChefHat, label: "Cocina", href: "/estaciones/cocina" },
  { icon: Beer, label: "Bar", href: "/estaciones/bar" },
  { icon: CircleDollarSign, label: "Caja", href: "/caja" },
  { icon: Package, label: "Inventario", href: "/inventario" },
  { icon: Users, label: "Personal", href: "/personal" },
  { icon: BarChart3, label: "Reportes & AI", href: "/ai-insights" },
];

const ROLES: Rol[] = ["ADMINISTRADOR", "MESERO", "COCINERO"];
const ESTACIONES: { label: string, val: string }[] = [
  { label: "🔥 Asado", val: "asado" },
  { label: "🍖 Parrilla", val: "parrilla" },
  { label: "👨‍🍳 Cocina", val: "cocina" },
  { label: "🍹 Bar", val: "bar" }
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, productos, permisos } = usePOSStore();
  const { state } = useSidebar();

  if (!user) return null;

  // Filtrar menús según los permisos del rol del usuario
  const userPermisos = permisos[user.rol] || [];
  const filteredMenu = ALL_MENU_ITEMS.filter(item => userPermisos.includes(item.label));
  
  const lowStockCount = productos.filter(p => p.stock <= p.stockMinimo).length;

  const handleRoleChange = (newRol: Rol) => {
    setUser({
      id: Math.random().toString(),
      nombre: newRol.charAt(0) + newRol.slice(1).toLowerCase() + " Usuario",
      rol: newRol,
      estado: 'ACTIVO',
      fechaIngreso: new Date().toISOString()
    });
  };

  const isExpanded = state === "expanded";

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border bg-sidebar wood-texture shadow-2xl">
      <SidebarHeader className="p-6 border-b border-border/50 bg-background/20">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-primary/30">
            🤠
          </div>
          <div className="text-center">
            <h1 className="font-headline text-xl text-secondary leading-tight">La Cabaña</h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              POS SYSTEM v1.0
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/50 text-[10px] uppercase font-bold tracking-widest px-4 mb-2">Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {filteredMenu.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "h-11 px-4 rounded-xl transition-all duration-200 hover:bg-sidebar-accent group",
                        isActive && "bg-primary text-primary-foreground shadow-lg glow-orange hover:bg-primary/90"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-secondary group-hover:text-primary transition-colors")} />
                        <span className="font-medium">{item.label}</span>
                        {item.label === "Inventario" && lowStockCount > 0 && (
                          <Badge className="ml-auto bg-destructive text-[10px] h-5 px-1.5 border-2 border-sidebar-background">
                            {lowStockCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-muted-foreground/50 text-[10px] uppercase font-bold tracking-widest px-4 mb-2">Simulador</SidebarGroupLabel>
          <SidebarGroupContent className="px-2 space-y-4">
            <div className="p-3 bg-accent/30 rounded-2xl border border-border/50 space-y-3">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Cambiar Rol</p>
              <Select onValueChange={(v) => handleRoleChange(v as Rol)} defaultValue={user.rol}>
                <SelectTrigger className="w-full bg-background/50 border-border h-9 text-xs rounded-lg">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border shadow-2xl">
                  {ROLES.map((rol) => (
                    <SelectItem key={rol} value={rol} className="text-xs">{rol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {ESTACIONES.map((est) => (
                <button
                  key={est.val}
                  onClick={() => router.push(`/estaciones/${est.val}`)}
                  className="text-[10px] bg-accent/20 hover:bg-secondary/20 border border-border/50 py-2 px-2 rounded-xl text-left transition-all hover:border-secondary/50 truncate font-semibold"
                >
                  {est.label}
                </button>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border bg-background/30">
        <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-2xl border border-primary/20 transition-all">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold border-2 border-secondary/50 shadow-lg shrink-0">
            {user.nombre[0]}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold truncate text-foreground">{user.nombre}</span>
            <span className="text-[9px] text-primary font-bold uppercase tracking-tighter">{user.rol}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}