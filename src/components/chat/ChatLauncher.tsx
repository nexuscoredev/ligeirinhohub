import { useEffect, useState } from 'react';
import { HubLogo } from '@/components/HubLogo';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { HUB_EVENTO_ABRIR_CHAT } from '@/lib/admin/visaoEstrategica';
import { resumoInboxChat } from '@/lib/chat/api';
import { temNovidadesNaoLidas } from '@/lib/novidades';
import type { Usuario } from '@/types/database';
import './chat-launcher.css';

type Aba = 'conversas' | 'pessoas' | 'solicitacoes';

export function ChatLauncher({ usuario }: { usuario: Pick<Usuario, 'id' | 'nome' | 'cargo'> }) {
  const [aberto, setAberto] = useState(false);
  const [abaInicial, setAbaInicial] = useState<Aba>('conversas');
  const [inbox, setInbox] = useState({ conversasNaoLidas: 0, ticketsAbertos: 0 });

  const totalInbox = inbox.conversasNaoLidas + inbox.ticketsAbertos;
  const dotNovidades = temNovidadesNaoLidas();

  useEffect(() => {
    let ativo = true;
    const atualizar = () => {
      void resumoInboxChat(usuario.id).then((r) => {
        if (ativo) setInbox(r);
      });
    };
    atualizar();
    const timer = window.setInterval(atualizar, 45_000);
    return () => {
      ativo = false;
      window.clearInterval(timer);
    };
  }, [usuario.id]);

  useEffect(() => {
    function onAbrirChat(e: Event) {
      const detail = (e as CustomEvent<{ aba?: Aba }>).detail;
      setAbaInicial(detail?.aba ?? 'solicitacoes');
      setAberto(true);
    }
    window.addEventListener(HUB_EVENTO_ABRIR_CHAT, onAbrirChat);
    return () => window.removeEventListener(HUB_EVENTO_ABRIR_CHAT, onAbrirChat);
  }, []);

  function abrir(aba: Aba) {
    setAbaInicial(aba);
    setAberto(true);
  }

  useEffect(() => {
    if (!aberto) return;
    document.body.classList.add('chat-widget-aberto');
    return () => document.body.classList.remove('chat-widget-aberto');
  }, [aberto]);

  return (
    <>
      <button
        type="button"
        className={`chat-fab${aberto ? ' chat-fab--oculto' : ''}`}
        onClick={() => abrir('conversas')}
        aria-hidden={aberto}
        tabIndex={aberto ? -1 : 0}
        aria-haspopup="dialog"
        aria-label="Abrir chat interno"
        title="Chat interno"
      >
        <HubLogo size="xs" alt="Ligeirinho" />
        {totalInbox > 0 ? (
          <span className="chat-fab-badge" aria-label={`${totalInbox} pendências`}>
            {totalInbox > 9 ? '9+' : totalInbox}
          </span>
        ) : dotNovidades ? (
          <span className="chat-fab-dot" aria-hidden />
        ) : null}
      </button>

      {aberto ? (
        <ChatWidget
          usuario={usuario}
          inicial={abaInicial}
          onFechar={() => setAberto(false)}
          onInboxChange={setInbox}
        />
      ) : null}
    </>
  );
}

