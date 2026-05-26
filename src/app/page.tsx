
"use client"

import { usePOSStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ALL_MENU_ITEMS } from '@/components/layout/AppSidebar';

export default function Home() {
  const { user, permisos } = usePOSStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      const userPermisos = permisos[user.rol] || [];
      const firstAllowedItem = ALL_MENU_ITEMS.find(item => userPermisos.includes(item.label));
      router.push(firstAllowedItem ? firstAllowedItem.href : '/dashboard');
    }
  }, [user, router, permisos]);

  return (
    <div className="h-svh w-full bg-background flex items-center justify-center">
      <div className="animate-pulse text-secondary font-headline text-2xl">
        🤠 Redirigiendo...
      </div>
    </div>
  );
}
