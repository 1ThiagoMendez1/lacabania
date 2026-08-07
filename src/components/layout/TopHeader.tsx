"use client"

import { usePOSStore } from "@/lib/store";
import { Flame, LogOut, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function TopHeader() {
  const { user, logout } = usePOSStore();
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
    <header className="fixed top-0 left-0 right-0 h-16 glass-panel border-b-0 z-40 px-4 md:px-8 flex items-center justify-between shadow-[0_15px_35px_-10px_rgba(255,81,0,0.2)] animate-in slide-in-from-top-full duration-700">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-card shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_15px_rgba(255,81,0,0.4)] border-2 border-white flex items-center justify-center relative overflow-hidden group premium-glow">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#FF5100]/20 via-transparent to-[#FFC300]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <Flame className="w-6 h-6 text-[#FF5100] drop-shadow-[0_2px_10px_rgba(255,81,0,0.8)] animate-pulse-glow" />
        </div>
        <div className="hidden sm:flex flex-col">
          <h1 className="font-decorative text-2xl text-gradient-gold leading-none tracking-wider py-0.5 drop-shadow-sm">La Cabaña</h1>
          <p className="text-[10px] font-body font-black text-foreground uppercase tracking-[0.2em] drop-shadow-sm">Punto de Venta</p>
        </div>
      </div>

      {/* Clock (Center) */}
      <div className="hidden md:flex items-center gap-2 px-5 py-2 rounded-full bg-background border border-white/60 text-foreground shadow-sm hover:shadow-[0_5px_15px_-5px_rgba(255,81,0,0.3)] transition-all group">
        <Clock className="w-4 h-4 text-[#FF5100] group-hover:scale-110 transition-transform" />
        <span className="text-sm font-mono tracking-widest font-black">
          {time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
        </span>
      </div>

      {/* User Profile & Logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 bg-background pl-2 pr-5 py-1.5 rounded-full border border-white/60 shadow-sm hover:shadow-[0_5px_15px_-5px_rgba(255,81,0,0.3)] transition-all">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FFC300] to-[#FF5100] flex items-center justify-center text-white text-sm font-black shadow-[0_2px_10px_rgba(255,81,0,0.4)] shrink-0 border border-white/50">
            {user.nombre[0]}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black text-foreground leading-tight truncate max-w-[100px]">{user.nombre.split(' ')[0]}</span>
            <span className="text-[10px] text-[#FF5100] font-black uppercase tracking-widest leading-tight">{user.rol}</span>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-white hover:bg-[#E61919] border border-transparent hover:border-[#E61919] hover:shadow-[0_5px_15px_-5px_rgba(230,25,25,0.6)] transition-all duration-300 hover:scale-110"
          title="Cerrar Sesión"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
