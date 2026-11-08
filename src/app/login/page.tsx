"use client"

import { useState, useEffect } from "react";
import { usePOSStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Lock, 
  Delete, 
  IdCard,
  Sparkles,
  Leaf
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ChristmasBrand, ColombianChristmasScene } from "@/components/seasonal/ChristmasDetails";
import { useFestiveTheme } from "@/components/seasonal/FestiveTheme";
import { ALL_MENU_ITEMS } from "@/components/layout/FloatingDock";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const { enabled, toggle } = useFestiveTheme();
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
    <main className="holiday-login min-h-svh w-full flex items-center justify-center px-5 py-8 md:p-10 relative overflow-hidden">
      <div aria-hidden="true" className="christmas-only holiday-login-grain" />
      <div className="relative w-full max-w-5xl grid lg:grid-cols-[1.15fr_1fr] gap-7 lg:gap-20 items-center">
        <section className="holiday-welcome text-center lg:text-left min-w-0">
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <ChristmasBrand className="w-16 h-16 lg:w-20 lg:h-20" />
            <div className="text-left">
              <h1 className="font-decorative text-4xl lg:text-5xl leading-tight text-foreground">La Cabaña</h1>
              <p className="text-[10px] uppercase tracking-[.28em] text-muted-foreground mt-1">Sabor que nos reúne</p>
            </div>
          </div>
          <div className="hidden lg:block mt-12">
            {enabled && <p className="flex items-center gap-2 text-[11px] uppercase tracking-[.23em] text-[#dfc998]"><span className="holiday-colombia-mark" aria-hidden="true" /> Navidad colombiana</p>}
            <h2 className="font-headline text-[44px] leading-[1.18] tracking-tight mt-5 text-[#f7eddc]">{enabled ? <>La magia está<br />en compartir<br /><span className="text-[#d3b77e]">la mesa.</span></> : <>Una buena mesa.<br /><span className="text-[#d3b77e]">Un gran equipo.</span></>}</h2>
            <p className="mt-5 max-w-[320px] text-sm leading-7 text-[#b6ad9e]">{enabled ? 'Farolitos, velitas y el calor de estar juntos. Bienvenido a otra jornada en La Cabaña.' : 'Bienvenido a otra jornada en La Cabaña. Cada detalle cuenta para servir mejor.'}</p>
            <ColombianChristmasScene />
            {enabled && <p className="text-[11px] text-[#aa9e87] tracking-wide -mt-1">Hecho de tradición. Servido con cariño.</p>}
          </div>
          {enabled && <p className="lg:hidden text-[11px] text-[#dfc998] flex items-center justify-center gap-2 mt-2"><span className="holiday-colombia-mark" aria-hidden="true" /> Navidad colombiana</p>}
        </section>
        <section className="holiday-access-panel w-full max-w-[400px] mx-auto rounded-[1.75rem] p-5 sm:p-8">
          <div className="flex justify-between items-start gap-3">
            <div>
              <p className="text-[10px] text-[#baa780] uppercase tracking-[.22em] mb-2">Bienvenido a tu turno</p>
              <h2 className="text-2xl font-headline text-foreground">Acceso del equipo</h2>
            </div>
            <span className="rounded-xl border border-border/60 p-2.5 text-[#c6b48b]"><IdCard className="h-5 w-5" aria-hidden="true" /></span>
          </div>
          <p className="text-xs text-muted-foreground leading-6 mt-3">Ingresa los últimos 4 dígitos de tu cédula.</p>
          <div className="flex justify-center gap-4 py-7" role="status" aria-label={`${pin.length} de 4 dígitos ingresados`}>
            {[0, 1, 2, 3].map(i => <span key={i} className={cn('w-3 h-3 rounded-full border transition-colors', pin.length > i ? 'bg-primary border-primary' : 'border-[#88724e]/55 bg-background/60')} />)}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(num => <Button key={num} variant="outline" onClick={() => handleKeyPress(num)} className="holiday-pin-key h-14 sm:h-16 text-2xl font-medium rounded-2xl">{num}</Button>)}
            <Button variant="ghost" onClick={clearPin} aria-label="Borrar PIN" className="h-14 sm:h-16 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Delete className="w-6 h-6" aria-hidden="true" /></Button>
            <Button variant="outline" onClick={() => handleKeyPress("0")} className="holiday-pin-key h-14 sm:h-16 text-2xl font-medium rounded-2xl">0</Button>
            <div className="h-14 sm:h-16 flex items-center justify-center" aria-hidden="true"><Lock className="w-4 h-4 text-muted-foreground/40" /></div>
          </div>
          <div className="border-t border-border/50 mt-6 pt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground"><Lock className="h-3 w-3" aria-hidden="true" /> Solo para personal autorizado</div>
        </section>
        <button type="button" onClick={toggle} aria-pressed={enabled} aria-label="Ambiente navideño" className="lg:col-span-2 mx-auto flex items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors rounded-lg px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:-mt-9">
          {enabled ? <Leaf className="w-3.5 h-3.5" aria-hidden="true" /> : <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />}{enabled ? 'Prefiero una vista sin decoración' : 'Activar ambiente navideño'}
        </button>
      </div>
    </main>
  );
}
