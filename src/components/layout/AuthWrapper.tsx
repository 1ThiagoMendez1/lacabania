
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
      
      // Validar si la ruta actual está permitida para el rol del usuario
      const isAllowed = ALL_MENU_ITEMS.some(item => {
        const isExactMatch = pathname === item.href;
        const isSubRoute = pathname.startsWith(item.href + "/");
        
        // Caso especial: La ruta /pedidos/[id] depende del permiso de "Mesas"
        const isPedidosRoute = pathname.startsWith("/pedidos/") && item.label === "Mesas";
        
        return (isExactMatch || isSubRoute || isPedidosRoute) && userPermisos.includes(item.label);
      });

      // Si no es una ruta permitida y no es la raíz, redirigir a la primera opción válida
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
        <div className="animate-pulse text-secondary font-headline text-2xl">
          🤠 Validando acceso...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="flex-1 flex flex-col bg-background">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 bg-background/50 backdrop-blur-sm sticky top-0 z-30">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">La Cabaña POS v1.0</span>
          <div className="ml-auto flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-[9px] font-bold text-secondary uppercase tracking-tighter">Turno Activo</p>
                <p className="text-[11px] font-bold text-foreground">{user.nombre}</p>
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
