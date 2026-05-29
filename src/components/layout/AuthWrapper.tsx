
"use client"

import { usePOSStore } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar, ALL_MENU_ITEMS } from "@/components/layout/AppSidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, permisos } = usePOSStore();
  const pathname = usePathname();
  const router = useRouter();

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

  if (pathname === "/login") {
    return <>{children}</>;
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

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <SidebarInset className="flex-1 flex flex-col bg-background">
        <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b px-3 md:px-6 bg-background/50 backdrop-blur-sm sticky top-0 z-30">
          <SidebarTrigger className="h-9 w-9" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-col">
            <span className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground leading-none mb-1">La Cabaña POS</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-bold text-green-500/80 uppercase">Sistema Activo</span>
            </div>
          </div>
          
          <div className="ml-auto flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-secondary uppercase tracking-tighter leading-none mb-1">{user.rol}</p>
                <p className="text-sm font-bold text-foreground leading-none">{user.nombre}</p>
             </div>
             <div className="flex items-center gap-3 bg-accent/30 p-1.5 pr-3 rounded-2xl border border-border/50">
               <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xs font-black shadow-lg border border-primary-foreground/20">
                 {user.nombre[0]}
               </div>
               <div className="sm:hidden">
                 <p className="text-[9px] font-black text-secondary uppercase leading-none mb-0.5">{user.rol}</p>
                 <p className="text-[11px] font-bold text-foreground leading-none">{user.nombre.split(' ')[0]}</p>
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
