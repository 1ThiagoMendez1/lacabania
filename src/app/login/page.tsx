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
    <main className="min-h-svh w-full flex flex-col items-center justify-center bg-transparent p-4 relative overflow-hidden">
      {/* High-Energy Animated Background Elements */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-[#FF5100]/20 rounded-full blur-[140px] pointer-events-none animate-float" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-[#FFC300]/20 rounded-full blur-[160px] pointer-events-none animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[30%] left-[50%] w-[400px] h-[400px] bg-[#2D8C3C]/15 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '1s' }} />

      <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 relative z-10">
        {/* Header Logo */}
        <div className="text-center flex flex-col items-center space-y-4">
          <div className="w-28 h-28 rounded-full bg-card shadow-[0_20px_40px_-10px_rgba(255,81,0,0.4),inset_0_4px_8px_rgba(255,255,255,1)] border-2 border-white flex items-center justify-center relative overflow-hidden group premium-glow animate-float">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#FF5100]/20 via-transparent to-[#FFC300]/20 opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <Flame className="w-14 h-14 text-primary drop-shadow-[0_4px_15px_rgba(255,81,0,0.8)] animate-pulse-glow" />
          </div>
          <div>
            <h1 className="text-5xl md:text-6xl font-decorative text-gradient-gold tracking-wider mb-2 drop-shadow-md">La Cabaña</h1>
            <p className="text-foreground font-body font-black text-[12px] uppercase tracking-[0.5em] drop-shadow-sm">
              Punto de Venta
            </p>
          </div>
        </div>

        {/* PIN Display & Keypad */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-8">
          <div className="flex flex-col items-center gap-6">
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center justify-center gap-2 drop-shadow-sm">
                <IdCard className="w-5 h-5 text-primary" /> Acceso de Personal
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold">
                Ingresa los últimos 4 dígitos de tu Cédula
              </p>
            </div>

            <div className="flex gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-5 h-5 rounded-full transition-all duration-300",
                    pin.length > i 
                      ? "bg-gradient-to-b from-primary to-[#9E3D20] shadow-[0_0_15px_rgba(201,86,45,0.6),inset_0_1px_2px_rgba(255,255,255,0.4)] scale-110 border border-[#8A351C]" 
                      : "border border-border/60 bg-card shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
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
                className="h-16 text-3xl font-body font-bold rounded-2xl btn-soft"
              >
                {num}
              </Button>
            ))}
            <Button
              variant="ghost"
              onClick={clearPin}
              className="h-16 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:shadow-[0_5px_15px_-5px_rgba(185,62,83,0.2)] transition-all"
            >
              <Delete className="w-7 h-7" />
            </Button>
            <Button
              variant="outline"
              onClick={() => handleKeyPress("0")}
              className="h-16 text-3xl font-body font-bold rounded-2xl btn-soft"
            >
              0
            </Button>
            <div className="h-16 flex items-center justify-center">
              <Lock className="w-6 h-6 text-muted-foreground/30 drop-shadow-sm" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
