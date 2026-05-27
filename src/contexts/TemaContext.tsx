import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { aplicarTema, lerTemaSalvo, type Tema } from '@/lib/tema';

interface TemaContextValue {
  tema: Tema;
  isDark: boolean;
  definirTema: (tema: Tema) => void;
  alternarTema: () => void;
}

const TemaContext = createContext<TemaContextValue | null>(null);

export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(() => lerTemaSalvo());

  useEffect(() => {
    aplicarTema(tema);
  }, [tema]);

  const definirTema = useCallback((proximo: Tema) => {
    setTema(proximo);
  }, []);

  const alternarTema = useCallback(() => {
    setTema((atual) => (atual === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      tema,
      isDark: tema === 'dark',
      definirTema,
      alternarTema,
    }),
    [tema, definirTema, alternarTema],
  );

  return <TemaContext.Provider value={value}>{children}</TemaContext.Provider>;
}

export function useTema() {
  const ctx = useContext(TemaContext);
  if (!ctx) {
    throw new Error('useTema deve ser usado dentro de TemaProvider');
  }
  return ctx;
}
