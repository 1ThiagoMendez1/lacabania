"use client"

import { usePOSStore } from "@/lib/store";
import { 
  LayoutDashboard, 
  Map,
  CircleDollarSign, 
  ClipboardList, 
  Package, 
  Users,
  Printer,
  History,
  UtensilsCrossed,
  Lock,
  ReceiptText,
  Menu as MenuIcon,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export const ALL_MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", isPrimary: true },
  { icon: Map, label: "Mesas", href: "/mesas", isPrimary: true },
  { icon: UtensilsCrossed, label: "Entregas", href: "/entregas", isPrimary: true },
  { icon: CircleDollarSign, label: "Caja", href: "/caja", isPrimary: true },
  { icon: ClipboardList, label: "Menú Carta", href: "/menu", isPrimary: true },
  
  // Secondary
  { icon: Lock, label: "Cierre Diario", href: "/cierre", isPrimary: false },
  { icon: Package, label: "Inventario", href: "/inventario", isPrimary: false },
  { icon: History, label: "Historial Meseros", href: "/reportes/meseros", isPrimary: false },
  { icon: ReceiptText, label: "Historial Pedidos", href: "/reportes/pedidos", isPrimary: false },
  { icon: Users, label: "Personal", href: "/personal", isPrimary: false },
  { icon: Printer, label: "Impresoras", href: "/configuracion/impresoras", isPrimary: false },
];

export function FloatingDock() {
  const pathname = usePathname();
  const { user, productos, permisos } = usePOSStore();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  if (!user) return null;

  const userPermisos = permisos[user.rol] || [];
  const allowedItems = ALL_MENU_ITEMS.filter(item => userPermisos.includes(item.label));
  
  const primaryItems = allowedItems.filter(item => item.isPrimary);
  const secondaryItems = allowedItems.filter(item => !item.isPrimary);

  const lowStockCount = productos.filter(p => p.stock <= p.stockMinimo).length;
  const expiringCount = productos.filter(p => {
    if (!p.fechaVencimiento) return false;
    const daysUntilExp = (new Date(p.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExp <= 7;
  }).length;
  const alertsCount = lowStockCount + expiringCount;

  return (
    <>
      {/* Background Overlay for More Menu */}
      {isMoreOpen && (
        <div 
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-300"
          onClick={() => setIsMoreOpen(false)}
        />
      )}

      {/* Floating Dock Container */}
      <div className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-[calc(100vw-1rem)] md:max-w-fit px-2 md:px-0 flex justify-center">
        
        {/* Popup Menu (moved outside the scroll container to prevent clipping) */}
        {isMoreOpen && secondaryItems.length > 0 && (
          <div className="absolute bottom-[calc(100%+1rem)] right-2 md:right-0 w-64 bg-card/95 backdrop-blur-3xl border border-border rounded-3xl p-2 shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 z-50">
            <div className="grid grid-cols-1 gap-1">
              {secondaryItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 group outline-none",
                      isActive ? "bg-primary/10" : "hover:bg-accent/10"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                      isActive ? "bg-primary text-primary-foreground" : "bg-card border border-border text-primary group-hover:bg-primary/20"
                    )}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className={cn(
                      "font-medium text-sm md:text-base",
                      isActive ? "text-foreground font-bold" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {item.label}
                    </span>
                    {item.label === "Inventario" && alertsCount > 0 && (
                      <Badge variant="destructive" className="ml-auto shadow-md px-2 py-0.5">
                        {alertsCount}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Dock Bar */}
        <div className="glass-panel rounded-[2rem] p-2 md:p-3 flex items-center gap-1 md:gap-4 overflow-x-auto no-scrollbar shadow-[0_25px_50px_-12px_rgba(255,81,0,0.3)] animate-in slide-in-from-bottom-full duration-700">
          
          {primaryItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className="relative group outline-none shrink-0"
                onClick={() => setIsMoreOpen(false)}
              >
                <div className={cn(
                  "flex items-center justify-center rounded-2xl transition-all duration-500 ease-out",
                  isActive 
                    ? "btn-primary-3d px-3 md:px-5 h-10 md:h-14 gap-1.5 md:gap-2" 
                    : "w-10 h-10 md:w-14 md:h-14 hover:bg-card hover:shadow-[0_10px_20px_rgba(255,81,0,0.15)] text-muted-foreground hover:text-[#FF5100] border border-transparent hover:border-[#FF5100]/30 hover:scale-105"
                )}>
                  <item.icon className={cn(
                    "transition-all duration-300",
                    isActive ? "w-4 h-4 md:w-6 md:h-6 drop-shadow-sm" : "w-5 h-5 md:w-7 md:h-7 group-hover:scale-110"
                  )} />
                  {/* Text only visible when active or on hover (as tooltip) */}
                  {isActive ? (
                    <span className="text-xs md:text-base font-bold whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                      {item.label}
                    </span>
                  ) : (
                    <span className="absolute -top-10 bg-foreground text-background text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap shadow-xl pointer-events-none hidden md:block">
                      {item.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Vertical Divider */}
          {secondaryItems.length > 0 && (
            <div className="w-[1px] h-6 md:h-8 bg-border mx-0.5 md:mx-1 shrink-0"></div>
          )}

          {/* More Menu Toggle */}
          {secondaryItems.length > 0 && (
            <div className="relative shrink-0">
              <button 
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={cn(
                  "w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-2xl transition-all duration-500 outline-none",
                  isMoreOpen 
                    ? "bg-secondary text-secondary-foreground shadow-md" 
                    : "hover:bg-accent/10 text-muted-foreground hover:text-foreground"
                )}
              >
                {isMoreOpen ? <X className="w-5 h-5 md:w-7 md:h-7 transition-transform duration-300 rotate-90" /> : <MenuIcon className="w-5 h-5 md:w-7 md:h-7 transition-transform duration-300 group-hover:scale-110" />}
                {alertsCount > 0 && !isMoreOpen && (
                  <span className="absolute top-1 md:top-2 right-1 md:right-2 w-2 h-2 md:w-3 md:h-3 bg-destructive rounded-full animate-pulse border md:border-2 border-background" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
