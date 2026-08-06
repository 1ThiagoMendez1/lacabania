"use client"

import { useState, useEffect } from "react";
import { usePOSStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Lock, 
  Delete, 
  IdCard,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ALL_MENU_ITEMS } from "@/components/layout/FloatingDock";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const { login, user, permisos } = usePOSStore();
  const router = useRouter();
  const { toast } = useToast();

  const getRedirectPath = (rol: string) => {
    const userPermisos = permisos[rol as keyof typeof permisos] || [];
    const firstAllowedItem = ALL_MENU_ITEMS.find(item => userPermisos.includes(item.label));
    return firstAllowedItem ? firstAllowedItem.href : "/dashboard";
  };

  useEffect(() => {
    if (user) {
      router.push(getRedirectPath(user.rol));
    }
  }, [user, router, permisos]);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        handleLogin(newPin);
      }
    }
  };

  const handleLogin = async (pinToAuth: string) => {
    const success = await login(pinToAuth);
    if (success) {
      toast({
        title: "¡Bienvenido!",
        description: `Hola ${success.nombre}, que tengas un excelente turno.`,
      });
      router.push(getRedirectPath(success.rol));
    } else {
      toast({
        variant: "destructive",
        title: "PIN Incorrecto",
        description: "Los 4 dígitos no coinciden con ningún usuario activo.",
      });
      setPin("");
    }
  };

  const clearPin = () => setPin("");

  return (
    <main className="min-h-svh w-full flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#BF953F]/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700 relative z-10">
        {/* Header Logo */}
        <div className="text-center flex flex-col items-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#111] shadow-[0_0_30px_rgba(220,165,60,0.3)] border border-[#B38728]/30 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#BF953F]/20 via-transparent to-[#FCF6BA]/20 opacity-50 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse-slow"></div>
            <Flame className="w-10 h-10 text-[#BF953F] drop-shadow-[0_0_15px_rgba(191,149,63,0.8)]" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-decorative text-gradient-gold tracking-wider mb-2">La Cabaña</h1>
            <p className="text-muted-foreground font-body font-bold text-[10px] uppercase tracking-[0.4em]">
              Command Center
            </p>
          </div>
        </div>

        {/* PIN Display & Keypad */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-8 border-t border-l border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center gap-6">
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-white uppercase tracking-widest flex items-center justify-center gap-2">
                <IdCard className="w-5 h-5 text-[#BF953F]" /> Acceso de Personal
              </p>
              <p className="text-[10px] text-white/50 font-medium">
                Ingresa los últimos 4 dígitos de tu Cédula
              </p>
            </div>

            <div className="flex gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-4 h-4 rounded-full border-2 transition-all duration-300",
                    pin.length > i 
                      ? "bg-[#BF953F] border-[#BF953F] shadow-[0_0_15px_rgba(191,149,63,0.8)] scale-110" 
                      : "border-white/20 bg-black/30"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <Button
                key={num}
                variant="outline"
                onClick={() => handleKeyPress(num)}
                className="h-16 text-2xl font-body font-light rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-white transition-all active:scale-95"
              >
                {num}
              </Button>
            ))}
            <Button
              variant="ghost"
              onClick={clearPin}
              className="h-16 rounded-2xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Delete className="w-6 h-6" />
            </Button>
            <Button
              variant="outline"
              onClick={() => handleKeyPress("0")}
              className="h-16 text-2xl font-body font-light rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-white transition-all active:scale-95"
            >
              0
            </Button>
            <div className="h-16 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white/20" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
