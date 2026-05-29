import { useEffect } from 'react';

export type AtalhoPdv =
  | 'ajuda'
  | 'consulta'
  | 'finalizar_dinheiro'
  | 'finalizar_outras'
  | 'operacoes'
  | 'pausar'
  | 'pausar_entrega'
  | 'notas'
  | 'cpf'
  | 'esc';

const MAPA: Record<string, AtalhoPdv> = {
  F1: 'ajuda',
  F2: 'consulta',
  F3: 'finalizar_dinheiro',
  F4: 'finalizar_outras',
  F5: 'operacoes',
  F6: 'pausar',
  F7: 'pausar_entrega',
  F10: 'cpf',
  F11: 'notas',
  Escape: 'esc',
};

export interface UseAtalhosOptions {
  ativo?: boolean;
  onAtalho: (atalho: AtalhoPdv, ev: KeyboardEvent) => void;
}

/**
 * Atalhos de teclado do PDV (estilo Hera): F1 Ajuda, F2 Consulta,
 * F3 Finalizar em dinheiro, F4 Outras formas, F5 Menu operações,
 * F6/F7 Pausar, F10 CPF, F11 Notas emitidas, ESC fecha.
 */
export function useAtalhos({ ativo = true, onAtalho }: UseAtalhosOptions) {
  useEffect(() => {
    if (!ativo) return;
    function handler(ev: KeyboardEvent) {
      const atalho = MAPA[ev.key];
      if (!atalho) return;
      // F-keys disparam mesmo com foco em input; ESC só quando não está digitando texto comum
      ev.preventDefault();
      onAtalho(atalho, ev);
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ativo, onAtalho]);
}
