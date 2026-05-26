
"use client"

import { useState, useEffect } from "react";
import { usePOSStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Lock, 
  Delete, 
  ChefHat, 
  Flame, 
  UtensilsCrossed, 
  CircleAlert,
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
    const userPermisos = permisos[rol as any] || [];
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

  const handleLogin = (pinToAuth: string) => {
    const success = login(pinToAuth);
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
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-20 h-20 bg-primary/20 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl border-2 border-primary/30 glow-orange">
            🤠
          </div>
          <h1 className="text-4xl font-headline text-secondary glow-gold-text">La Cabaña</h1>
          <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-[0.3em]">
            Sistema de Gestión Gastronómica
          </p>
        </div>

        {/* PIN Display */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl space-y-8 paper-texture">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-4 h-4 rounded-full border-2 transition-all duration-300 scale-100",
                    pin.length > i 
                      ? "bg-primary border-primary scale-125 glow-orange" 
                      : "border-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2 mb-1">
                <IdCard className="w-4 h-4" /> Acceso de Personal
              </p>
              <p className="text-[10px] text-muted-foreground/60 font-medium">
                Ingresa los últimos 4 dígitos de tu Cédula
              </p>
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <Button
                key={num}
                variant="outline"
                onClick={() => handleKeyPress(num)}
                className="h-16 text-2xl font-black rounded-2xl border-border/40 bg-background/40 hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-90"
              >
                {num}
              </Button>
            ))}
            <Button
              variant="ghost"
              onClick={clearPin}
              className="h-16 rounded-2xl text-destructive hover:bg-destructive/10"
            >
              <Delete className="w-6 h-6" />
            </Button>
            <Button
              variant="outline"
              onClick={() => handleKeyPress("0")}
              className="h-16 text-2xl font-black rounded-2xl border-border/40 bg-background/40 hover:bg-primary hover:text-white transition-all active:scale-90"
            >
              0
            </Button>
            <div className="h-16 flex items-center justify-center">
              <Lock className="w-6 h-6 text-muted-foreground/20" />
            </div>
          </div>
        </div>

        {/* Roles Helper (For Demo/Dev) */}
        <div className="bg-card/30 p-4 rounded-2xl border border-border/20 backdrop-blur-sm space-y-3">
          <p className="text-[10px] uppercase font-bold text-center text-muted-foreground tracking-widest">Credenciales de Acceso (Demo)</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center bg-accent/20 p-2 rounded-xl">
              <p className="text-[8px] uppercase font-bold text-primary">Admin</p>
              <code className="text-[10px] font-bold">6789</code>
            </div>
            <div className="text-center bg-accent/20 p-2 rounded-xl">
              <p className="text-[8px] uppercase font-bold text-secondary">Mesero</p>
              <code className="text-[10px] font-bold">2033</code>
            </div>
            <div className="text-center bg-accent/20 p-2 rounded-xl">
              <p className="text-[8px] uppercase font-bold text-orange-400">Cocina</p>
              <code className="text-[10px] font-bold">6655</code>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
