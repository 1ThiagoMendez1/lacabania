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
  Utensils,
  Users,
  LogOut,
  Printer
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
  { icon: Printer, label: "Impresoras", href: "/configuracion/impresoras" },
  { icon: BarChart3, label: "Reportes & AI", href: "/ai-insights" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout, productos, permisos } = usePOSStore();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const router = useRouter();

  if (!user) return null;

  // En móvil siempre queremos la vista expandida (con labels) para mejor usabilidad
  const isExpanded = state === "expanded" || isMobile;
  const userPermisos = permisos[user.rol] || [];
  const filteredMenu = ALL_MENU_ITEMS.filter(item => userPermisos.includes(item.label));
  const lowStockCount = productos.filter(p => p.stock <= p.stockMinimo).length;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleItemClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-border bg-sidebar wood-texture shadow-2xl transition-all duration-300 ease-in-out"
    >
      <SidebarHeader className={cn(
        "p-4 border-b border-border/50 bg-background/20 transition-all duration-300 flex flex-col items-center justify-center",
        !isExpanded && "p-2"
      )}>
        <div className="flex flex-col items-center justify-center gap-2 w-full">
          <div className="w-11 h-11 bg-primary/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-primary/30 shrink-0">
            🤠
          </div>
          {isExpanded && (
            <div className="text-center animate-in fade-in duration-500">
              <h1 className="font-headline text-lg text-secondary leading-tight">La Cabaña</h1>
              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
                POS SYSTEM
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup className="p-0">
          {isExpanded && (
            <SidebarGroupLabel className="text-muted-foreground/50 text-[10px] uppercase font-bold tracking-widest px-4 mb-2 animate-in fade-in">
              Navegación
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {filteredMenu.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href} className={cn("flex", !isExpanded ? "justify-center" : "")}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      onClick={handleItemClick}
                      className={cn(
                        "h-12 md:h-11 rounded-xl transition-all duration-200 hover:bg-sidebar-accent group flex items-center",
                        isActive && "bg-primary text-primary-foreground shadow-lg glow-orange hover:bg-primary/90",
                        !isExpanded ? "justify-center p-0 w-11" : "px-4"
                      )}
                    >
                      <Link href={item.href} className={cn("flex items-center", !isExpanded ? "justify-center w-full" : "w-full")}>
                        <item.icon className={cn(
                          "w-5 h-5 shrink-0 transition-colors", 
                          isActive ? "text-white" : "text-secondary group-hover:text-primary",
                          !isExpanded && "mx-auto"
                        )} />
                        {isExpanded && (
                          <span className="font-medium ml-3 animate-in slide-in-from-left-2 duration-300">
                            {item.label}
                          </span>
                        )}
                        {isExpanded && item.label === "Inventario" && lowStockCount > 0 && (
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
      </SidebarContent>

      <SidebarFooter className={cn(
        "p-4 border-t border-border bg-background/30 transition-all duration-300 flex flex-col items-center justify-center gap-2",
        !isExpanded && "p-2"
      )}>
        <div className={cn(
          "flex items-center bg-primary/10 rounded-2xl border border-primary/20 transition-all overflow-hidden",
          isExpanded ? "p-3 w-full gap-3" : "p-0 w-11 h-11 justify-center"
        )}>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold border-2 border-secondary/50 shadow-lg shrink-0">
            {user.nombre[0]}
          </div>
          {isExpanded && (
            <div className="flex flex-col min-w-0 animate-in fade-in">
              <span className="text-xs font-bold truncate text-foreground">{user.nombre}</span>
              <span className="text-[9px] text-primary font-bold uppercase tracking-tighter">{user.rol}</span>
            </div>
          )}
        </div>
        
        <SidebarMenuButton 
          onClick={handleLogout}
          tooltip="Cerrar Sesión"
          className={cn(
            "h-12 md:h-10 rounded-xl text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/30",
            !isExpanded && "w-11 justify-center p-0"
          )}
        >
          <LogOut className={cn("w-4 h-4", !isExpanded && "mx-auto")} />
          {isExpanded && <span className="ml-2 font-bold text-xs">Cerrar Sesión</span>}
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
