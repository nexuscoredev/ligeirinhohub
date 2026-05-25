import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const MINUTOS = 30;
const MS = MINUTOS * 60 * 1000;

/** Logout após inatividade (reunião Denis: ~30 min) */
export function useSessionTimeout(ativo: boolean) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ativo) return;

    const reiniciar = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void supabase.auth.signOut();
      }, MS);
    };

    reiniciar();
    const eventos = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;
    for (const ev of eventos) {
      window.addEventListener(ev, reiniciar, { passive: true });
    }

    return () => {
      if (timer.current) clearTimeout(timer.current);
      for (const ev of eventos) {
        window.removeEventListener(ev, reiniciar);
      }
    };
  }, [ativo]);
}
