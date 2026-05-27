
"use client"

import { usePOSStore } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar, ALL_MENU_ITEMS } from "@/components/layout/AppSidebar"
import { Separator } from "@/components/ui/separator"

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
        <header className="flex h-14 md:h-12 shrink-0 items-center gap-2 border-b px-3 md:px-4 bg-background/50 backdrop-blur-sm sticky top-0 z-30">
          <SidebarTrigger className="h-9 w-9" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-[9px] md:text-[10px] font-mono uppercase tracking-widest text-muted-foreground">La Cabaña POS</span>
          <div className="ml-auto flex items-center gap-3">
             <div className="text-right hidden xs:block">
                <p className="text-[8px] font-black text-secondary uppercase tracking-tighter leading-none mb-0.5">Mesero</p>
                <p className="text-[10px] md:text-[11px] font-bold text-foreground leading-none">{user.nombre.split(' ')[0]}</p>
             </div>
             <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-black border border-primary/30">
               {user.nombre[0]}
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
