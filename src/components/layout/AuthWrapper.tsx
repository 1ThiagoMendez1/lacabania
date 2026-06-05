
"use client"

import { usePOSStore } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar, ALL_MENU_ITEMS } from "@/components/layout/AppSidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, permisos, isInitialized, fetchInitialData } = usePOSStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user && !isInitialized) {
      fetchInitialData().catch(err => console.error("Error fetching initial data:", err));
    }
  }, [user, isInitialized, fetchInitialData]);

  useEffect(() => {
    if (!user && pathname !== "/login") {
      router.push("/login");
      return;
    }

    if (user && pathname !== "/login") {
      const userPermisos = permisos[user.rol] || [];
      
      const isAllowed = ALL_MENU_ITEMS.some(item => {
        const isExactMatch = pathname === item.href;
        const isSubRoute = pathname.startsWith(item.href + "/");
        const isPedidosRoute = pathname.startsWith("/pedidos/") && item.label === "Mesas";
        
        return (isExactMatch || isSubRoute || isPedidosRoute) && userPermisos.includes(item.label);
      });

      if (!isAllowed && pathname !== "/") {
        const firstAllowedItem = ALL_MENU_ITEMS.find(item => userPermisos.includes(item.label));
        if (firstAllowedItem && pathname !== firstAllowedItem.href) {
          router.push(firstAllowedItem.href);
        }
      }
    }
  }, [user, pathname, router, permisos]);

  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const timestampStr = localStorage.getItem('session_timestamp');
      if (timestampStr) {
        const timestamp = parseInt(timestampStr, 10);
        const twoHours = 2 * 60 * 60 * 1000;
        if (Date.now() - timestamp >= twoHours) {
          // Log out
          const logout = usePOSStore.getState().logout;
          logout();
          router.push("/login");
        } else {
          // Slide expiration
          localStorage.setItem('session_timestamp', Date.now().toString());
        }
      } else {
        localStorage.setItem('session_timestamp', Date.now().toString());
      }
    }
  }, [pathname, user, router]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (!mounted) {
    return (
      <div className="h-svh w-full bg-background flex items-center justify-center">
        <div className="animate-pulse text-secondary font-headline text-xl">
          🤠 Validando acceso...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-svh w-full bg-background flex items-center justify-center">
        <div className="animate-pulse text-secondary font-headline text-xl">
          🤠 Validando acceso...
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="h-svh w-full bg-background flex items-center justify-center">
        <div className="animate-pulse text-secondary font-headline text-xl">
          🤠 Cargando datos del sistema...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <SidebarInset className="flex-1 flex flex-col bg-background">
        <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b px-3 md:px-6 bg-background/50 backdrop-blur-sm sticky top-0 z-30">
          <SidebarTrigger className="h-9 w-9" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground leading-none mb-1 truncate">La Cabaña POS</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-[9px] font-bold text-green-500/80 uppercase hidden sm:inline truncate">Sistema Activo</span>
            </div>
          </div>
          
          <div className="ml-auto flex items-center gap-2 sm:gap-4 shrink-0">
             <div className="text-right hidden md:block">
                <p className="text-[10px] font-black text-secondary uppercase tracking-tighter leading-none mb-1 truncate max-w-[100px]">{user.rol}</p>
                <p className="text-sm font-bold text-foreground leading-none truncate max-w-[100px]">{user.nombre}</p>
             </div>
             <div className="flex items-center gap-2 sm:gap-3 bg-accent/30 p-1.5 sm:pr-3 rounded-2xl border border-border/50">
               <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xs font-black shadow-lg border border-primary-foreground/20 shrink-0">
                 {user.nombre[0]}
               </div>
               <div className="hidden sm:block md:hidden">
                 <p className="text-[9px] font-black text-secondary uppercase leading-none mb-0.5 truncate">{user.rol}</p>
                 <p className="text-[11px] font-bold text-foreground leading-none truncate">{user.nombre.split(' ')[0]}</p>
               </div>
             </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </div>
  );
}
