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
    <header className="fixed top-0 left-0 right-0 h-16 bg-background/70 backdrop-blur-2xl border-b border-white/5 z-40 px-4 md:px-8 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#111] shadow-[0_0_10px_rgba(220,165,60,0.2)] border border-[#B38728]/30 flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#BF953F]/10 via-transparent to-[#FCF6BA]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <Flame className="w-5 h-5 text-[#BF953F] drop-shadow-[0_0_5px_rgba(191,149,63,0.8)]" />
        </div>
        <div className="hidden sm:flex flex-col">
          <h1 className="font-decorative text-xl text-gradient-gold leading-none tracking-wider py-0.5">La Cabaña</h1>
          <p className="text-[9px] font-body font-bold text-foreground/50 uppercase tracking-[0.2em]">Command Center</p>
        </div>
      </div>

      {/* Clock (Center) */}
      <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-foreground/70">
        <Clock className="w-4 h-4 text-[#BF953F]" />
        <span className="text-sm font-mono tracking-widest font-medium">
          {time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
        </span>
      </div>

      {/* User Profile & Logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 bg-white/5 pl-2 pr-4 py-1.5 rounded-full border border-white/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BF953F] to-[#8c6b22] flex items-center justify-center text-black text-sm font-bold shadow-[0_0_10px_rgba(191,149,63,0.3)] shrink-0">
            {user.nombre[0]}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-white leading-tight truncate max-w-[100px]">{user.nombre.split(' ')[0]}</span>
            <span className="text-[9px] text-[#BF953F] font-bold uppercase tracking-widest leading-tight">{user.rol}</span>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-10 h-10 rounded-full flex items-center justify-center text-foreground/50 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
