import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isHubAdmin } from '@/lib/admin/usuariosApi';
import {
  criarOuAbrirThreadDM,
  enviarMensagem,
  listarMensagens,
  listarThreads,
  listarUsuariosChat,
  marcarLido,
  type ChatMessage,
  type ChatThreadItem,
} from '@/lib/chat/api';
import {
  criarTicket,
  enviarMensagemTicket,
  listarMensagensTicket,
  listarTickets,
  resolverTicket,
  type SuporteMensagem,
  type SuporteTicket,
} from '@/lib/suporte/api';
import { supabase } from '@/lib/supabase';
import type { Usuario } from '@/types/database';
import { useChatWidgetSize } from '@/components/chat/useChatWidgetSize';
import './chat-widget.css';

type Aba = 'conversas' | 'pessoas' | 'solicitacoes';

function formatarHora(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function ChatWidget({
  usuario,
  inicial = 'conversas',
  onFechar,
}: {
  usuario: Pick<Usuario, 'id' | 'nome' | 'cargo'>;
  inicial?: Aba;
  onFechar: () => void;
}) {
  const isAdmin = isHubAdmin(usuario.cargo);
  const [aba, setAba] = useState<Aba>(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const {
    tamanho,
    mobile,
    iniciarArraste,
    moverArraste,
    finalizarArraste,
    resetarTamanho,
  } = useChatWidgetSize();

  // Chat DM
  const [threads, setThreads] = useState<ChatThreadItem[]>([]);
  const [usuarios, setUsuarios] = useState<Array<{ id: string; nome: string; cargo: string; email: string }>>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<ChatMessage[]>([]);
  const [texto, setTexto] = useState('');
  const fimRef = useRef<HTMLDivElement>(null);

  // Suporte
  const [tickets, setTickets] = useState<SuporteTicket[]>([]);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [mensagensTicket, setMensagensTicket] = useState<SuporteMensagem[]>([]);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoBody, setNovoBody] = useState('');
  const [textoTicket, setTextoTicket] = useState('');
  const fimTicketRef = useRef<HTMLDivElement>(null);

  const threadAtual = useMemo(
    () => threads.find((t) => t.thread_id === threadId) ?? null,
    [threads, threadId],
  );
  const ticketAtual = useMemo(
    () => tickets.find((t) => t.id === ticketId) ?? null,
    [tickets, ticketId],
  );

  const carregarThreads = useCallback(async () => {
    const [tRes, uRes] = await Promise.all([
      listarThreads(usuario.id),
      listarUsuariosChat(),
    ]);
    if (tRes.error) setErro(tRes.error.message);
    else setErro(null);
    setThreads(tRes.threads);
    setUsuarios(uRes.usuarios.filter((u) => u.id !== usuario.id));
  }, [usuario.id]);

  const carregarMensagens = useCallback(async () => {
    if (!threadId) return;
    const res = await listarMensagens(threadId);
    if (res.error) setErro(res.error.message);
    else setErro(null);
    setMensagens(res.mensagens);
    void marcarLido(threadId, usuario.id);
    queueMicrotask(() => fimRef.current?.scrollIntoView({ block: 'end' }));
  }, [threadId, usuario.id]);

  const carregarTickets = useCallback(async () => {
    const res = await listarTickets();
    if (res.error) setErro(res.error.message);
    else setErro(null);
    setTickets(res.tickets);
  }, []);

  const carregarMensagensTicket = useCallback(async () => {
    if (!ticketId) return;
    const res = await listarMensagensTicket(ticketId);
    if (res.error) setErro(res.error.message);
    else setErro(null);
    setMensagensTicket(res.mensagens);
    queueMicrotask(() => fimTicketRef.current?.scrollIntoView({ block: 'end' }));
  }, [ticketId]);

  useEffect(() => {
    void carregarThreads();
    void carregarTickets();
  }, [carregarThreads, carregarTickets]);

  useEffect(() => {
    void carregarMensagens();
  }, [carregarMensagens]);

  useEffect(() => {
    void carregarMensagensTicket();
  }, [carregarMensagensTicket]);

  useEffect(() => {
    if (!threadId) return;
    const channel = supabase
      .channel(`chat-widget-${threadId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `thread_id=eq.${threadId}` },
        () => void carregarMensagens(),
      )
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, [threadId, carregarMensagens]);

  useEffect(() => {
    if (!ticketId) return;
    const channel = supabase
      .channel(`suporte-widget-${ticketId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'suporte_mensagens', filter: `ticket_id=eq.${ticketId}` },
        () => void carregarMensagensTicket(),
      )
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, [ticketId, carregarMensagensTicket]);

  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') onFechar();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onFechar]);

  async function abrirDM(peerId: string) {
    const { threadId: novoId, error } = await criarOuAbrirThreadDM(usuario.id, peerId);
    if (error || !novoId) {
      setErro(error?.message ?? 'Não foi possível abrir conversa.');
      return;
    }
    await carregarThreads();
    setThreadId(novoId);
    setAba('conversas');
  }

  async function enviarDM() {
    if (!threadId) return;
    const body = texto.trim();
    if (!body) return;
    setTexto('');
    const { error } = await enviarMensagem({ threadId, senderId: usuario.id, body });
    if (error) setErro(error.message);
  }

  async function criarSolicitacao() {
    const res = await criarTicket({ criadoPor: usuario.id, titulo: novoTitulo, body: novoBody });
    if (res.error) {
      setErro(res.error.message);
      return;
    }
    setNovoTitulo('');
    setNovoBody('');
    await carregarTickets();
    if (res.ticket?.id) {
      setTicketId(res.ticket.id);
    }
  }

  async function enviarMsgTicket() {
    if (!ticketId) return;
    const body = textoTicket.trim();
    if (!body) return;
    setTextoTicket('');
    const { error } = await enviarMensagemTicket({ ticketId, senderId: usuario.id, body });
    if (error) setErro(error.message);
    else void carregarTickets();
  }

  async function resolverAtual() {
    if (!ticketId || !isAdmin) return;
    const { error } = await resolverTicket({ ticketId, resolvidoPor: usuario.id });
    if (error) setErro(error.message);
    else {
      void carregarTickets();
      void carregarMensagensTicket();
    }
  }

  return (
    <div className="cw-backdrop" role="presentation" onClick={onFechar}>
      <div
        className="cw-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={
          mobile
            ? undefined
            : { width: tamanho.w, height: tamanho.h, maxWidth: 'none', maxHeight: 'none' }
        }
      >
        {!mobile ? (
          <>
            <button
              type="button"
              className="cw-resize cw-resize--n"
              aria-label="Redimensionar altura do chat"
              onPointerDown={(e) => iniciarArraste(e, 'n')}
              onPointerMove={moverArraste}
              onPointerUp={finalizarArraste}
              onPointerCancel={finalizarArraste}
            />
            <button
              type="button"
              className="cw-resize cw-resize--w"
              aria-label="Redimensionar largura do chat"
              onPointerDown={(e) => iniciarArraste(e, 'w')}
              onPointerMove={moverArraste}
              onPointerUp={finalizarArraste}
              onPointerCancel={finalizarArraste}
            />
            <button
              type="button"
              className="cw-resize cw-resize--nw"
              aria-label="Redimensionar chat. Duplo clique para tamanho padrão."
              onPointerDown={(e) => iniciarArraste(e, 'nw')}
              onPointerMove={moverArraste}
              onPointerUp={finalizarArraste}
              onPointerCancel={finalizarArraste}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                resetarTamanho();
              }}
            />
          </>
        ) : null}

        <header className="cw-header">
          <div className="cw-title">
            <strong>Chat interno</strong>
            <span>{usuario.nome}</span>
          </div>
          <button type="button" className="cw-close" onClick={onFechar} aria-label="Fechar chat">
            ✕
          </button>
        </header>

        <div className="cw-body">
          <aside className="cw-left">
            <div className="cw-tabs" role="tablist" aria-label="Navegação do chat">
              <button type="button" role="tab" aria-selected={aba === 'conversas'} className={aba === 'conversas' ? 'ativo' : ''} onClick={() => setAba('conversas')}>
                Conversas
              </button>
              <button type="button" role="tab" aria-selected={aba === 'pessoas'} className={aba === 'pessoas' ? 'ativo' : ''} onClick={() => setAba('pessoas')}>
                Pessoas
              </button>
              <button type="button" role="tab" aria-selected={aba === 'solicitacoes'} className={aba === 'solicitacoes' ? 'ativo' : ''} onClick={() => setAba('solicitacoes')}>
                Solicitações
              </button>
            </div>

            {aba === 'conversas' ? (
              <ul className="cw-lista" aria-label="Conversas">
                {threads.length === 0 ? <li className="cw-vazio">Sem conversas.</li> : null}
                {threads.map((t) => (
                  <li key={t.thread_id}>
                    <button type="button" className={`cw-item${t.thread_id === threadId ? ' ativo' : ''}`} onClick={() => setThreadId(t.thread_id)}>
                      <div className="cw-item-top">
                        <strong>{t.peer?.nome ?? 'Conversa'}</strong>
                        {t.last_message ? <span>{formatarHora(t.last_message.created_at)}</span> : null}
                      </div>
                      <div className="cw-item-bot">
                        <span className="cw-item-preview">{t.last_message?.body ?? '—'}</span>
                        {t.unread ? <span className="cw-dot" aria-hidden /> : null}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {aba === 'pessoas' ? (
              <ul className="cw-lista" aria-label="Pessoas">
                {usuarios.map((u) => (
                  <li key={u.id}>
                    <button type="button" className="cw-item" onClick={() => void abrirDM(u.id)}>
                      <div className="cw-item-top">
                        <strong>{u.nome}</strong>
                        <span>{u.cargo}</span>
                      </div>
                      <div className="cw-item-bot">
                        <span className="cw-item-preview">{u.email}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {aba === 'solicitacoes' ? (
              <div className="cw-solic">
                <div className="cw-solic-form">
                  <label>
                    Título
                    <input value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} placeholder="Ex.: Ajuste no fluxo de pedidos" />
                  </label>
                  <label>
                    Descrição
                    <textarea value={novoBody} onChange={(e) => setNovoBody(e.target.value)} rows={3} placeholder="Explique o que precisa ser ajustado…" />
                  </label>
                  <button type="button" className="btn" disabled={!novoTitulo.trim() || !novoBody.trim()} onClick={() => void criarSolicitacao()}>
                    Enviar solicitação
                  </button>
                </div>

                <p className="cw-solic-sub">Clique em uma solicitação para ver o histórico.</p>
                <ul className="cw-lista" aria-label="Solicitações">
                  {tickets.length === 0 ? <li className="cw-vazio">Nenhuma solicitação.</li> : null}
                  {tickets.map((t) => (
                    <li key={t.id}>
                      <button type="button" className={`cw-item${t.id === ticketId ? ' ativo' : ''}`} onClick={() => setTicketId(t.id)}>
                        <div className="cw-item-top">
                          <strong>{t.titulo}</strong>
                          <span className={`cw-status ${t.status}`}>{t.status === 'aberto' ? 'Aberto' : 'Resolvido'}</span>
                        </div>
                        <div className="cw-item-bot">
                          <span className="cw-item-preview">
                            {t.usuarios?.nome ?? '—'} · {new Date(t.updated_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>

          <section className="cw-right" aria-label="Conteúdo">
            {erro ? <p className="erro" style={{ margin: 0 }}>{erro}</p> : null}

            {aba !== 'solicitacoes' ? (
              !threadId ? (
                <div className="cw-vazio-centro">Selecione uma conversa.</div>
              ) : (
                <>
                  <div className="cw-topo">
                    <strong>{threadAtual?.peer?.nome ?? 'Conversa'}</strong>
                    <span>{threadAtual?.peer?.cargo ?? ''}</span>
                  </div>

                  <div className="cw-msgs" role="log" aria-live="polite">
                    {mensagens.map((m) => {
                      const minha = m.sender_id === usuario.id;
                      return (
                        <div key={m.id} className={`cw-msg${minha ? ' minha' : ''}`}>
                          <div className="cw-bolha">
                            <p>{m.body}</p>
                            <span>{formatarHora(m.created_at)}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={fimRef} />
                  </div>

                  <form
                    className="cw-composer"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void enviarDM();
                    }}
                  >
                    <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva uma mensagem…" />
                    <button type="submit" className="btn" disabled={!texto.trim()}>
                      Enviar
                    </button>
                  </form>
                </>
              )
            ) : (
              !ticketId ? (
                <div className="cw-vazio-centro">Selecione uma solicitação.</div>
              ) : (
                <>
                  <div className="cw-topo">
                    <strong>{ticketAtual?.titulo ?? 'Solicitação'}</strong>
                    <span>{ticketAtual?.status === 'aberto' ? 'Aberto' : 'Resolvido'}</span>
                    {isAdmin && ticketAtual?.status === 'aberto' ? (
                      <button type="button" className="btn btn-secundario" onClick={() => void resolverAtual()}>
                        Marcar como resolvido
                      </button>
                    ) : null}
                  </div>

                  <div className="cw-msgs" role="log" aria-live="polite">
                    {mensagensTicket.map((m) => {
                      const minha = m.sender_id === usuario.id;
                      return (
                        <div key={m.id} className={`cw-msg${minha ? ' minha' : ''}`}>
                          <div className="cw-bolha">
                            <p>{m.body}</p>
                            <span>{formatarHora(m.created_at)}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={fimTicketRef} />
                  </div>

                  <form
                    className="cw-composer"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void enviarMsgTicket();
                    }}
                  >
                    <input value={textoTicket} onChange={(e) => setTextoTicket(e.target.value)} placeholder="Responder…" />
                    <button type="submit" className="btn" disabled={!textoTicket.trim()}>
                      Enviar
                    </button>
                  </form>
                </>
              )
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

