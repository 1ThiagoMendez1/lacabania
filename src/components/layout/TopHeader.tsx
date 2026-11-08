"use client"

import { usePOSStore } from "@/lib/store";
import { useShallow } from 'zustand/react/shallow';
import { LogOut, Clock, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { ChristmasBrand } from "@/components/seasonal/ChristmasDetails";
import { useRouter } from "next/navigation";

export function TopHeader() {
  const { user, logout } = usePOSStore(useShallow(state => ({ user: state.user, logout: state.logout })));
  const router = useRouter();
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <header className="holiday-topbar fixed top-0 left-0 right-0 h-16 z-40 px-4 md:px-8 flex items-center justify-between gap-3">
      <div aria-hidden="true" className="christmas-only christmas-trim" />
      <div className="flex items-center gap-3 min-w-0">
        <ChristmasBrand className="h-12 w-12" />
        <div className="hidden min-[420px]:flex flex-col">
          <h1 className="font-decorative text-2xl text-foreground leading-none">La Cabaña</h1>
          <p className="text-[9px] text-muted-foreground uppercase tracking-[.2em] mt-1">Punto de venta</p>
        </div>
        <span className="christmas-only holiday-season-label hidden lg:flex items-center gap-2 ml-4 text-[11px] text-[#dfc998]">
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Navidad colombiana
        </span>
      </div>
      <div className="hidden md:flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2">
        <Clock className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
        <time className="text-sm font-mono font-medium tabular-nums" aria-label="Hora de Colombia">
          {time ? time.toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) : '--:--'}
        </time>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="holiday-profile flex items-center gap-2.5 rounded-full pl-1.5 pr-3 py-1.5">
          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary text-sm font-bold shrink-0">{user.nombre[0]}</div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-foreground leading-tight truncate max-w-[100px]">{user.nombre.split(' ')[0]}</span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{user.rol}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="w-11 h-11 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors" title="Cerrar sesión" aria-label="Cerrar sesión">
          <LogOut className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
