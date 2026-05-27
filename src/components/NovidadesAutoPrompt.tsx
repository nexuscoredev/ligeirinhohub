import { useEffect, useState } from 'react';
import { NovidadesModal } from '@/components/NovidadesModal';
import {
  deveExibirPromptNovidades,
  marcarNovidadesComoLidas,
  marcarPromptNovidadesExibido,
} from '@/lib/novidades';

/**
 * Notificação automática de novidades.
 * Mostra 1x por atualização por navegador (localStorage).
 */
export function NovidadesAutoPrompt() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!deveExibirPromptNovidades()) return;
    marcarPromptNovidadesExibido();
    // Marca como lida assim que notificar (evita avisar de novo a cada abertura).
    marcarNovidadesComoLidas();

    // Pequeno atraso para não competir com layout/carregamento inicial.
    const t = window.setTimeout(() => setAberto(true), 350);
    return () => window.clearTimeout(t);
  }, []);

  function fechar() {
    setAberto(false);
  }

  return aberto ? <NovidadesModal onFechar={fechar} /> : null;
}

