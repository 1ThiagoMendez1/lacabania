
"use client"

import { useState, useEffect } from "react";
import { usePOSStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Lock, 
  Delete, 
  IdCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ALL_MENU_ITEMS } from "@/components/layout/AppSidebar";

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
    <main className="min-h-svh w-full flex flex-col items-center justify-center bg-background wood-texture p-4">
      <div className="max-w-md w-full space-y-4 md:space-y-8 animate-in fade-in zoom-in duration-500">
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 md:w-20 md:h-20 bg-primary/20 rounded-[2rem] flex items-center justify-center text-4xl md:text-5xl shadow-2xl border-2 border-primary/30 glow-orange">
            🤠
          </div>
          <h1 className="text-3xl md:text-4xl font-headline text-secondary glow-gold-text">La Cabaña</h1>
          <p className="text-muted-foreground font-mono text-[9px] md:text-[10px] uppercase tracking-[0.3em]">
            Gestión Gastronómica
          </p>
        </div>

        {/* PIN Display */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 md:space-y-8 paper-texture">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-3 md:gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-3 h-3 md:w-4 md:h-4 rounded-full border-2 transition-all duration-300 scale-100",
                    pin.length > i 
                      ? "bg-primary border-primary scale-125 glow-orange" 
                      : "border-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            <div className="text-center">
              <p className="text-[10px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2 mb-1">
                <IdCard className="w-4 h-4" /> Acceso de Personal
              </p>
              <p className="text-[9px] md:text-[10px] text-muted-foreground/60 font-medium">
                Últimos 4 dígitos de tu Cédula
              </p>
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <Button
                key={num}
                variant="outline"
                onClick={() => handleKeyPress(num)}
                className="h-14 md:h-16 text-xl md:text-2xl font-black rounded-2xl border-border/40 bg-background/40 active:bg-primary active:text-white transition-all active:scale-95"
              >
                {num}
              </Button>
            ))}
            <Button
              variant="ghost"
              onClick={clearPin}
              className="h-14 md:h-16 rounded-2xl text-destructive hover:bg-destructive/10"
            >
              <Delete className="w-6 h-6" />
            </Button>
            <Button
              variant="outline"
              onClick={() => handleKeyPress("0")}
              className="h-14 md:h-16 text-xl md:text-2xl font-black rounded-2xl border-border/40 bg-background/40 active:bg-primary active:text-white transition-all active:scale-95"
            >
              0
            </Button>
            <div className="h-14 md:h-16 flex items-center justify-center">
              <Lock className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground/20" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
