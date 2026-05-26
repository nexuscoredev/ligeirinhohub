import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { estadoInicialCriador } from '@/lib/marketing/creator/defaults';
import { creatorReducer } from '@/lib/marketing/creator/reducer';
import type { CreatorAction, MarketingCreatorState } from '@/lib/marketing/creator/types';

interface CreatorContextValue {
  estado: MarketingCreatorState;
  dispatch: Dispatch<CreatorAction>;
  avancar: () => void;
  voltar: () => void;
  irPara: (passo: number) => void;
}

const CreatorContext = createContext<CreatorContextValue | null>(null);

const ULTIMO_PASSO = 8;

export function MarketingCreatorProvider({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(creatorReducer, undefined, estadoInicialCriador);

  const irPara = useCallback((passo: number) => {
    dispatch({ type: 'SET_PASSO', passo: Math.max(1, Math.min(ULTIMO_PASSO, passo)) });
  }, []);

  const avancar = useCallback(() => {
    dispatch({ type: 'SET_PASSO', passo: Math.min(ULTIMO_PASSO, estado.passo + 1) });
  }, [estado.passo]);

  const voltar = useCallback(() => {
    dispatch({ type: 'SET_PASSO', passo: Math.max(1, estado.passo - 1) });
  }, [estado.passo]);

  const value = useMemo(
    () => ({ estado, dispatch, avancar, voltar, irPara }),
    [estado, avancar, voltar, irPara],
  );

  return <CreatorContext.Provider value={value}>{children}</CreatorContext.Provider>;
}

export function useMarketingCreator() {
  const ctx = useContext(CreatorContext);
  if (!ctx) {
    throw new Error('useMarketingCreator deve estar dentro de MarketingCreatorProvider');
  }
  return ctx;
}
