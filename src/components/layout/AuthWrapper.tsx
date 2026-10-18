"use client"

import { usePOSStore } from "@/lib/store";
import { useShallow } from 'zustand/react/shallow';
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TopHeader } from "@/components/layout/TopHeader";
import { FloatingDock, ALL_MENU_ITEMS } from "@/components/layout/FloatingDock";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, permisos, isInitialized, fetchInitialData } = usePOSStore(useShallow(state => ({ user: state.user, permisos: state.permisos, isInitialized: state.isInitialized, fetchInitialData: state.fetchInitialData })));
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
      const timestampStr = sessionStorage.getItem('session_timestamp');
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
          sessionStorage.setItem('session_timestamp', Date.now().toString());
        }
      } else {
        sessionStorage.setItem('session_timestamp', Date.now().toString());
      }
    }
  }, [pathname, user, router]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (!mounted) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="animate-pulse text-secondary font-headline text-xl flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-secondary animate-bounce"></div>
          Validando acceso...
        </div>
      </div>
    );
  }

  if (!user || !isInitialized) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="animate-pulse text-secondary font-headline text-xl flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-secondary animate-bounce"></div>
          Cargando Command Center...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-background text-foreground relative">
      <TopHeader />
      
      {/* 
        Main content area with top padding to account for fixed TopHeader
        and bottom padding to account for FloatingDock 
      */}
      <main className="flex-1 w-full pt-20 pb-28 md:pb-32 px-4 md:px-8 mx-auto max-w-7xl overflow-x-hidden">
        {children}
      </main>

      <FloatingDock />
    </div>
  );
}
