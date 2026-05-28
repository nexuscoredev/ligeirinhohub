import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HubAvatar } from '@/components/HubAvatar';
import { HubLogo } from '@/components/HubLogo';
import { isHubAdmin } from '@/lib/admin/usuariosApi';
import {
  criarOuAbrirThreadDM,
  enviarMensagem,
  listarMensagens,
  listarThreads,
  listarUsuariosChat,
  marcarLido,
  resumoInboxChat,
  type ChatMessage,
  type ChatThreadItem,
  type UsuarioChatResumo,
} from '@/lib/chat/api';
import {
  blocosMensagensComDia,
  formatarHoraChat,
  previewTexto,
} from '@/lib/chat/format';
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
type PainelMobile = 'lista' | 'detalhe';

function filtrarPorBusca<T>(itens: T[], busca: string, getTexto: (item: T) => string): T[] {
  const q = busca.trim().toLowerCase();
  if (!q) return itens;
  return itens.filter((item) => getTexto(item).toLowerCase().includes(q));
}

export function ChatWidget({
  usuario,
  inicial = 'conversas',
  onFechar,
  onInboxChange,
}: {
  usuario: Pick<Usuario, 'id' | 'nome' | 'cargo'>;
  inicial?: Aba;
  onFechar: () => void;
  onInboxChange?: (resumo: { conversasNaoLidas: number; ticketsAbertos: number }) => void;
}) {
  const isAdmin = isHubAdmin(usuario.cargo);
  const [aba, setAba] = useState<Aba>(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [mobilePainel, setMobilePainel] = useState<PainelMobile>('lista');
  const [mostrarNovaSolic, setMostrarNovaSolic] = useState(false);
  const [inbox, setInbox] = useState({ conversasNaoLidas: 0, ticketsAbertos: 0 });
  const { mobile, iniciarArraste, resetarTamanho, estiloModal } = useChatWidgetSize();

  const [threads, setThreads] = useState<ChatThreadItem[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioChatResumo[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<ChatMessage[]>([]);
  const [texto, setTexto] = useState('');
  const [enviandoDm, setEnviandoDm] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);
  const inputDmRef = useRef<HTMLTextAreaElement>(null);

  const [tickets, setTickets] = useState<SuporteTicket[]>([]);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [mensagensTicket, setMensagensTicket] = useState<SuporteMensagem[]>([]);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoBody, setNovoBody] = useState('');
  const [textoTicket, setTextoTicket] = useState('');
  const [enviandoTicket, setEnviandoTicket] = useState(false);
  const fimTicketRef = useRef<HTMLDivElement>(null);
  const inputTicketRef = useRef<HTMLTextAreaElement>(null);

  const threadAtual = useMemo(
    () => threads.find((t) => t.thread_id === threadId) ?? null,
    [threads, threadId],
  );
  const ticketAtual = useMemo(
    () => tickets.find((t) => t.id === ticketId) ?? null,
    [tickets, ticketId],
  );

  const threadsFiltradas = useMemo(
    () =>
      filtrarPorBusca(threads, busca, (t) =>
        [t.peer?.nome, t.peer?.cargo, t.last_message?.body].filter(Boolean).join(' '),
      ),
    [threads, busca],
  );

  const usuariosFiltrados = useMemo(
    () =>
      filtrarPorBusca(usuarios, busca, (u) => [u.nome, u.cargo, u.email].join(' ')),
    [usuarios, busca],
  );

  const ticketsFiltrados = useMemo(
    () =>
      filtrarPorBusca(tickets, busca, (t) =>
        [t.titulo, t.usuarios?.nome, t.status].filter(Boolean).join(' '),
      ),
    [tickets, busca],
  );

  const blocosDm = useMemo(() => blocosMensagensComDia(mensagens), [mensagens]);
  const blocosTicket = useMemo(() => {
    const comoChat: ChatMessage[] = mensagensTicket.map((m) => ({
      id: m.id,
      thread_id: m.ticket_id,
      sender_id: m.sender_id,
      body: m.body,
      created_at: m.created_at,
    }));
    return blocosMensagensComDia(comoChat);
  }, [mensagensTicket]);

  const atualizarInbox = useCallback(async () => {
    const resumo = await resumoInboxChat(usuario.id);
    setInbox(resumo);
    onInboxChange?.(resumo);
  }, [usuario.id, onInboxChange]);

  const carregarThreads = useCallback(async () => {
    const [tRes, uRes] = await Promise.all([
      listarThreads(usuario.id),
      listarUsuariosChat(),
    ]);
    if (tRes.error) setErro(tRes.error.message);
    else setErro(null);
    setThreads(tRes.threads);
    setUsuarios(uRes.usuarios.filter((u) => u.id !== usuario.id));
    void atualizarInbox();
  }, [usuario.id, atualizarInbox]);

  const carregarMensagens = useCallback(async () => {
    if (!threadId) return;
    const res = await listarMensagens(threadId);
    if (res.error) setErro(res.error.message);
    else setErro(null);
    setMensagens(res.mensagens);
    void marcarLido(threadId, usuario.id);
    void atualizarInbox();
    queueMicrotask(() => fimRef.current?.scrollIntoView({ block: 'end' }));
  }, [threadId, usuario.id, atualizarInbox]);

  const carregarTickets = useCallback(async () => {
    const res = await listarTickets();
    if (res.error) setErro(res.error.message);
    else setErro(null);
    setTickets(res.tickets);
    void atualizarInbox();
  }, [atualizarInbox]);

  const carregarMensagensTicket = useCallback(async () => {
    if (!ticketId) return;
    const res = await listarMensagensTicket(ticketId);
    if (res.error) setErro(res.error.message);
    else setErro(null);
    setMensagensTicket(res.mensagens);
    queueMicrotask(() => fimTicketRef.current?.scrollIntoView({ block: 'end' }));
  }, [ticketId]);

  const recarregarTudo = useCallback(async () => {
    await Promise.all([carregarThreads(), carregarTickets()]);
    if (threadId) await carregarMensagens();
    if (ticketId) await carregarMensagensTicket();
  }, [carregarThreads, carregarTickets, carregarMensagens, carregarMensagensTicket, threadId, ticketId]);

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

  useEffect(() => {
    setAba(inicial);
  }, [inicial]);

  function selecionarThread(id: string) {
    setThreadId(id);
    if (mobile) setMobilePainel('detalhe');
    queueMicrotask(() => inputDmRef.current?.focus());
  }

  function selecionarTicket(id: string) {
    setTicketId(id);
    if (mobile) setMobilePainel('detalhe');
    queueMicrotask(() => inputTicketRef.current?.focus());
  }

  async function abrirDM(peerId: string) {
    const { threadId: novoId, error } = await criarOuAbrirThreadDM(usuario.id, peerId);
    if (error || !novoId) {
      setErro(error?.message ?? 'Não foi possível abrir conversa.');
      return;
    }
    await carregarThreads();
    selecionarThread(novoId);
    setAba('conversas');
  }

  async function enviarDM() {
    if (!threadId || enviandoDm) return;
    const body = texto.trim();
    if (!body) return;
    setEnviandoDm(true);
    setTexto('');
    const tempId = `temp-${Date.now()}`;
    const otimista: ChatMessage = {
      id: tempId,
      thread_id: threadId,
      sender_id: usuario.id,
      body,
      created_at: new Date().toISOString(),
    };
    setMensagens((prev) => [...prev, otimista]);
    queueMicrotask(() => fimRef.current?.scrollIntoView({ block: 'end' }));

    const { error } = await enviarMensagem({ threadId, senderId: usuario.id, body });
    setEnviandoDm(false);
    if (error) {
      setErro(error.message);
      setMensagens((prev) => prev.filter((m) => m.id !== tempId));
      setTexto(body);
    } else {
      void carregarMensagens();
      void carregarThreads();
    }
  }

  async function criarSolicitacao() {
    const res = await criarTicket({ criadoPor: usuario.id, titulo: novoTitulo, body: novoBody });
    if (res.error) {
      setErro(res.error.message);
      return;
    }
    setNovoTitulo('');
    setNovoBody('');
    setMostrarNovaSolic(false);
    await carregarTickets();
    if (res.ticket?.id) selecionarTicket(res.ticket.id);
  }

  async function enviarMsgTicket() {
    if (!ticketId || enviandoTicket) return;
    const body = textoTicket.trim();
    if (!body) return;
    setEnviandoTicket(true);
    setTextoTicket('');
    const { error } = await enviarMensagemTicket({ ticketId, senderId: usuario.id, body });
    setEnviandoTicket(false);
    if (error) {
      setErro(error.message);
      setTextoTicket(body);
    } else {
      void carregarMensagensTicket();
      void carregarTickets();
    }
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

  const mostrarLista = !mobile || mobilePainel === 'lista';
  const mostrarDetalhe = !mobile || mobilePainel === 'detalhe';
  const emSolicitacoes = aba === 'solicitacoes';

  return (
    <div className="cw-backdrop cw-backdrop--widget" role="presentation">
      <div
        className="cw-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Chat interno"
        onClick={(e) => e.stopPropagation()}
        style={mobile ? undefined : estiloModal}
      >
        {!mobile ? (
          <>
            <button
              type="button"
              className="cw-resize cw-resize--n"
              aria-label="Redimensionar altura do chat"
              onPointerDown={(e) => iniciarArraste(e, 'n')}
            />
            <button
              type="button"
              className="cw-resize cw-resize--w"
              aria-label="Redimensionar largura do chat"
              onPointerDown={(e) => iniciarArraste(e, 'w')}
            />
            <button
              type="button"
              className="cw-resize cw-resize--nw"
              aria-label="Redimensionar chat. Duplo clique para tamanho padrão."
              onPointerDown={(e) => iniciarArraste(e, 'nw')}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                resetarTamanho();
              }}
            />
          </>
        ) : null}

        <header className="cw-header">
          <HubLogo size="xs" badgeHub className="cw-header-logo" alt="" />
          <div className="cw-title">
            <strong>Chat interno</strong>
            <span>{usuario.nome}</span>
          </div>
          <div className="cw-header-acoes">
            <button
              type="button"
              className="cw-icon-btn"
              onClick={() => void recarregarTudo()}
              aria-label="Atualizar conversas"
              title="Atualizar"
            >
              ↻
            </button>
            <button type="button" className="cw-close" onClick={onFechar} aria-label="Fechar chat">
              ✕
            </button>
          </div>
        </header>

        <div className={`cw-body${mobile ? ' cw-body--mobile' : ''}`}>
          {mostrarLista ? (
            <aside className="cw-left">
              <div className="cw-tabs" role="tablist" aria-label="Navegação do chat">
                <button
                  type="button"
                  role="tab"
                  aria-selected={aba === 'conversas'}
                  className={aba === 'conversas' ? 'ativo' : ''}
                  onClick={() => {
                    setAba('conversas');
                    setMobilePainel('lista');
                  }}
                >
                  Conversas
                  {inbox.conversasNaoLidas > 0 ? (
                    <span className="cw-tab-badge">{inbox.conversasNaoLidas}</span>
                  ) : null}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={aba === 'pessoas'}
                  className={aba === 'pessoas' ? 'ativo' : ''}
                  onClick={() => {
                    setAba('pessoas');
                    setMobilePainel('lista');
                  }}
                >
                  Pessoas
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={aba === 'solicitacoes'}
                  className={aba === 'solicitacoes' ? 'ativo' : ''}
                  onClick={() => {
                    setAba('solicitacoes');
                    setMobilePainel('lista');
                  }}
                >
                  Solicitações
                  {inbox.ticketsAbertos > 0 ? (
                    <span className="cw-tab-badge">{inbox.ticketsAbertos}</span>
                  ) : null}
                </button>
              </div>

              <label className="cw-busca">
                <span className="visually-hidden">Buscar</span>
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder={
                    aba === 'pessoas'
                      ? 'Buscar pessoa…'
                      : aba === 'solicitacoes'
                        ? 'Buscar solicitação…'
                        : 'Buscar conversa…'
                  }
                />
              </label>

              {aba === 'conversas' ? (
                <ul className="cw-lista" aria-label="Conversas">
                  {threadsFiltradas.length === 0 ? (
                    <li className="cw-vazio">{busca ? 'Nenhum resultado.' : 'Sem conversas.'}</li>
                  ) : null}
                  {threadsFiltradas.map((t) => (
                    <li key={t.thread_id}>
                      <button
                        type="button"
                        className={`cw-item${t.thread_id === threadId ? ' ativo' : ''}`}
                        onClick={() => selecionarThread(t.thread_id)}
                      >
                        <HubAvatar
                          nome={t.peer?.nome ?? '?'}
                          avatarUrl={t.peer?.avatar_url}
                          size="xs"
                          className="cw-item-avatar"
                        />
                        <div className="cw-item-corpo">
                          <div className="cw-item-top">
                            <strong>{t.peer?.nome ?? 'Conversa'}</strong>
                            {t.last_message ? (
                              <span>{formatarHoraChat(t.last_message.created_at)}</span>
                            ) : null}
                          </div>
                          <div className="cw-item-bot">
                            <span className="cw-item-preview">
                              {t.last_message
                                ? previewTexto(
                                    t.last_message.sender_id === usuario.id
                                      ? `Você: ${t.last_message.body}`
                                      : t.last_message.body,
                                  )
                                : '—'}
                            </span>
                            {t.unread ? <span className="cw-dot" aria-label="Não lida" /> : null}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {aba === 'pessoas' ? (
                <ul className="cw-lista" aria-label="Pessoas">
                  {usuariosFiltrados.length === 0 ? (
                    <li className="cw-vazio">{busca ? 'Nenhum resultado.' : 'Ninguém disponível.'}</li>
                  ) : null}
                  {usuariosFiltrados.map((u) => (
                    <li key={u.id}>
                      <button type="button" className="cw-item" onClick={() => void abrirDM(u.id)}>
                        <HubAvatar nome={u.nome} avatarUrl={u.avatar_url} size="xs" className="cw-item-avatar" />
                        <div className="cw-item-corpo">
                          <div className="cw-item-top">
                            <strong>{u.nome}</strong>
                            <span>{u.cargo}</span>
                          </div>
                          <div className="cw-item-bot">
                            <span className="cw-item-preview">{u.email}</span>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {aba === 'solicitacoes' ? (
                <div className="cw-solic">
                  <button
                    type="button"
                    className="cw-solic-toggle"
                    aria-expanded={mostrarNovaSolic}
                    onClick={() => setMostrarNovaSolic((v) => !v)}
                  >
                    {mostrarNovaSolic ? '− Ocultar formulário' : '+ Nova solicitação'}
                  </button>
                  {mostrarNovaSolic ? (
                    <div className="cw-solic-form">
                      <label>
                        Título
                        <input
                          value={novoTitulo}
                          onChange={(e) => setNovoTitulo(e.target.value)}
                          placeholder="Ex.: Ajuste no fluxo de pedidos"
                        />
                      </label>
                      <label>
                        Descrição
                        <textarea
                          value={novoBody}
                          onChange={(e) => setNovoBody(e.target.value)}
                          rows={3}
                          placeholder="Explique o que precisa ser ajustado…"
                        />
                      </label>
                      <button
                        type="button"
                        className="btn"
                        disabled={!novoTitulo.trim() || !novoBody.trim()}
                        onClick={() => void criarSolicitacao()}
                      >
                        Enviar solicitação
                      </button>
                    </div>
                  ) : null}

                  <ul className="cw-lista" aria-label="Solicitações">
                    {ticketsFiltrados.length === 0 ? (
                      <li className="cw-vazio">{busca ? 'Nenhum resultado.' : 'Nenhuma solicitação.'}</li>
                    ) : null}
                    {ticketsFiltrados.map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          className={`cw-item${t.id === ticketId ? ' ativo' : ''}`}
                          onClick={() => selecionarTicket(t.id)}
                        >
                          <span className="cw-item-icone-solic" aria-hidden>
                            {t.status === 'aberto' ? '📩' : '✓'}
                          </span>
                          <div className="cw-item-corpo">
                            <div className="cw-item-top">
                              <strong>{t.titulo}</strong>
                              <span className={`cw-status ${t.status}`}>
                                {t.status === 'aberto' ? 'Aberto' : 'Resolvido'}
                              </span>
                            </div>
                            <div className="cw-item-bot">
                              <span className="cw-item-preview">
                                {t.usuarios?.nome ?? '—'} ·{' '}
                                {new Date(t.updated_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </aside>
          ) : null}

          {mostrarDetalhe ? (
            <section className="cw-right" aria-label="Conteúdo da conversa">
              {erro ? (
                <p className="erro cw-erro-flutuante" role="alert">
                  {erro}
                </p>
              ) : null}

              {mobile ? (
                <button
                  type="button"
                  className="cw-voltar-lista"
                  onClick={() => setMobilePainel('lista')}
                >
                  ← Voltar
                </button>
              ) : null}

              {!emSolicitacoes ? (
                !threadId ? (
                  <div className="cw-vazio-centro">
                    <p>Selecione uma conversa ou escolha alguém em Pessoas.</p>
                  </div>
                ) : (
                  <>
                    <div className="cw-topo">
                      <HubAvatar
                        nome={threadAtual?.peer?.nome ?? '?'}
                        avatarUrl={threadAtual?.peer?.avatar_url}
                        size="sm"
                      />
                      <div className="cw-topo-texto">
                        <strong>{threadAtual?.peer?.nome ?? 'Conversa'}</strong>
                        <span>{threadAtual?.peer?.cargo ?? ''}</span>
                      </div>
                    </div>

                    <div className="cw-msgs" role="log" aria-live="polite">
                      {blocosDm.map((bloco) =>
                        bloco.tipo === 'dia' ? (
                          <div key={bloco.chave} className="cw-dia">
                            <span>{bloco.rotulo}</span>
                          </div>
                        ) : (
                          <div
                            key={bloco.mensagem.id}
                            className={`cw-msg${bloco.mensagem.sender_id === usuario.id ? ' minha' : ''}`}
                          >
                            <div className="cw-bolha">
                              <p>{bloco.mensagem.body}</p>
                              <span>{formatarHoraChat(bloco.mensagem.created_at)}</span>
                            </div>
                          </div>
                        ),
                      )}
                      <div ref={fimRef} />
                    </div>

                    <div className="cw-composer-wrap">
                      <form
                        className="cw-composer"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void enviarDM();
                        }}
                      >
                        <textarea
                          ref={inputDmRef}
                          rows={1}
                          value={texto}
                          onChange={(e) => setTexto(e.target.value)}
                          placeholder="Escreva uma mensagem…"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              void enviarDM();
                            }
                          }}
                        />
                        <button
                          type="submit"
                          className="cw-enviar"
                          disabled={!texto.trim() || enviandoDm}
                          aria-label="Enviar mensagem"
                        >
                          {enviandoDm ? '…' : '↑'}
                        </button>
                      </form>
                      <p className="cw-composer-dica">Enter envia · Shift+Enter quebra linha</p>
                    </div>
                  </>
                )
              ) : !ticketId ? (
                <div className="cw-vazio-centro">
                  <p>Selecione uma solicitação na lista.</p>
                </div>
              ) : (
                <>
                  <div className="cw-topo cw-topo--ticket">
                    <div className="cw-topo-texto">
                      <strong>{ticketAtual?.titulo ?? 'Solicitação'}</strong>
                      <span className={`cw-status ${ticketAtual?.status ?? 'aberto'}`}>
                        {ticketAtual?.status === 'aberto' ? 'Aberto' : 'Resolvido'}
                      </span>
                    </div>
                    {isAdmin && ticketAtual?.status === 'aberto' ? (
                      <button
                        type="button"
                        className="btn btn-secundario cw-btn-resolver"
                        onClick={() => void resolverAtual()}
                      >
                        Resolver
                      </button>
                    ) : null}
                  </div>

                  <div className="cw-msgs" role="log" aria-live="polite">
                    {blocosTicket.map((bloco) => {
                      if (bloco.tipo === 'dia') {
                        return (
                          <div key={bloco.chave} className="cw-dia">
                            <span>{bloco.rotulo}</span>
                          </div>
                        );
                      }
                      const m = mensagensTicket.find((x) => x.id === bloco.mensagem.id);
                      const minha = bloco.mensagem.sender_id === usuario.id;
                      return (
                        <div
                          key={bloco.mensagem.id}
                          className={`cw-msg${minha ? ' minha' : ''}`}
                        >
                          {!minha && m?.usuarios?.nome ? (
                            <span className="cw-msg-autor">{m.usuarios.nome}</span>
                          ) : null}
                          <div className="cw-bolha">
                            <p>{bloco.mensagem.body}</p>
                            <span>{formatarHoraChat(bloco.mensagem.created_at)}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={fimTicketRef} />
                  </div>

                  <div className="cw-composer-wrap">
                    <form
                      className="cw-composer"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void enviarMsgTicket();
                      }}
                    >
                      <textarea
                        ref={inputTicketRef}
                        rows={1}
                        value={textoTicket}
                        onChange={(e) => setTextoTicket(e.target.value)}
                        placeholder="Responder…"
                        disabled={ticketAtual?.status === 'resolvido'}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            void enviarMsgTicket();
                          }
                        }}
                      />
                      <button
                        type="submit"
                        className="cw-enviar"
                        disabled={
                          !textoTicket.trim() ||
                          enviandoTicket ||
                          ticketAtual?.status === 'resolvido'
                        }
                        aria-label="Enviar resposta"
                      >
                        {enviandoTicket ? '…' : '↑'}
                      </button>
                    </form>
                    {ticketAtual?.status === 'resolvido' ? (
                      <p className="cw-composer-dica">Esta solicitação já foi resolvida.</p>
                    ) : (
                      <p className="cw-composer-dica">Enter envia · Shift+Enter quebra linha</p>
                    )}
                  </div>
                </>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
