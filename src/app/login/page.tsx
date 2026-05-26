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
  CircleAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const { login, user } = usePOSStore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

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
      router.push("/dashboard");
    } else {
      toast({
        variant: "destructive",
        title: "PIN Incorrecto",
        description: "El código ingresado no coincide con ningún usuario activo.",
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
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Lock className="w-3 h-3" /> Ingresa tu PIN
            </p>
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
              <CircleAlert className="w-6 h-6 text-muted-foreground/20" />
            </div>
          </div>
        </div>

        {/* Roles Helper (For Demo/Dev) */}
        <div className="grid grid-cols-3 gap-2 opacity-40 hover:opacity-100 transition-opacity">
          <div className="text-center">
            <p className="text-[8px] uppercase font-bold text-muted-foreground">Admin</p>
            <code className="text-[10px] bg-accent p-1 rounded">1234</code>
          </div>
          <div className="text-center">
            <p className="text-[8px] uppercase font-bold text-muted-foreground">Mesero</p>
            <code className="text-[10px] bg-accent p-1 rounded">2222</code>
          </div>
          <div className="text-center">
            <p className="text-[8px] uppercase font-bold text-muted-foreground">Cocina</p>
            <code className="text-[10px] bg-accent p-1 rounded">3333</code>
          </div>
        </div>
      </div>
    </main>
  );
}
