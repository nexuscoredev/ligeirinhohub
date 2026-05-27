import { useEffect, useMemo, useState } from 'react';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { temNovidadesNaoLidas } from '@/lib/novidades';
import type { Usuario } from '@/types/database';
import './chat-launcher.css';

type Aba = 'conversas' | 'pessoas' | 'solicitacoes';

export function ChatLauncher({ usuario }: { usuario: Pick<Usuario, 'id' | 'nome' | 'cargo'> }) {
  const [aberto, setAberto] = useState(false);
  const [abaInicial, setAbaInicial] = useState<Aba>('conversas');
  const [badge, setBadge] = useState(false);

  // Reaproveita o “dot” pra sinalizar algo novo (hoje: novidades não lidas).
  // (No futuro: unread messages/tickets)
  const hasDot = useMemo(() => badge || temNovidadesNaoLidas(), [badge]);

  useEffect(() => {
    function onStorage() {
      setBadge(false);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function abrir(aba: Aba) {
    setAbaInicial(aba);
    setAberto(true);
  }

  return (
    <>
      <button
        type="button"
        className="chat-ajuste-btn"
        onClick={() => abrir('solicitacoes')}
      >
        <span className="chat-ajuste-icone" aria-hidden>
          🛠️
        </span>
        Solicitar ajuste no sistema
        {hasDot ? <span className="chat-ajuste-dot" aria-hidden /> : null}
      </button>

      {aberto ? (
        <ChatWidget
          usuario={usuario}
          inicial={abaInicial}
          onFechar={() => setAberto(false)}
        />
      ) : null}
    </>
  );
}

