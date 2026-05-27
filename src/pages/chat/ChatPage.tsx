import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { usePerfil } from '@/contexts/PerfilContext';
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
import { supabase } from '@/lib/supabase';
import './chat.css';

function formatarHora(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function ChatPage() {
  const { usuario } = usePerfil();
  const [threads, setThreads] = useState<ChatThreadItem[]>([]);
  const [usuarios, setUsuarios] = useState<Array<{ id: string; nome: string; cargo: string; email: string }>>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<ChatMessage[]>([]);
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [novoPara, setNovoPara] = useState('');
  const fimRef = useRef<HTMLDivElement>(null);

  const usuarioId = usuario?.id ?? '';

  const threadAtual = useMemo(
    () => threads.find((t) => t.thread_id === threadId) ?? null,
    [threads, threadId],
  );

  const carregarThreads = useCallback(async () => {
    if (!usuarioId) return;
    setCarregando(true);
    const [tRes, uRes] = await Promise.all([
      listarThreads(usuarioId),
      listarUsuariosChat(),
    ]);
    if (tRes.error) setErro(tRes.error.message);
    else setErro(null);
    setThreads(tRes.threads);
    setUsuarios(uRes.usuarios.filter((u) => u.id !== usuarioId));
    setCarregando(false);
  }, [usuarioId]);

  const carregarMensagens = useCallback(
    async (id: string) => {
      const res = await listarMensagens(id);
      if (res.error) setErro(res.error.message);
      else setErro(null);
      setMensagens(res.mensagens);
      if (usuarioId) void marcarLido(id, usuarioId);
      queueMicrotask(() => fimRef.current?.scrollIntoView({ block: 'end' }));
    },
    [usuarioId],
  );

  useEffect(() => {
    void carregarThreads();
  }, [carregarThreads]);

  useEffect(() => {
    if (!threadId) return;
    void carregarMensagens(threadId);
  }, [threadId, carregarMensagens]);

  useEffect(() => {
    if (!threadId) return;
    const channel = supabase
      .channel(`chat-messages-${threadId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `thread_id=eq.${threadId}` },
        () => void carregarMensagens(threadId),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [threadId, carregarMensagens]);

  async function iniciarNovaConversa() {
    if (!usuarioId || !novoPara) return;
    const { threadId: novoId, error } = await criarOuAbrirThreadDM(usuarioId, novoPara);
    if (error || !novoId) {
      setErro(error?.message ?? 'Não foi possível iniciar a conversa.');
      return;
    }
    setNovoPara('');
    await carregarThreads();
    setThreadId(novoId);
  }

  async function enviar() {
    if (!usuarioId || !threadId) return;
    const body = texto.trim();
    if (!body) return;
    setTexto('');
    const { error } = await enviarMensagem({ threadId, senderId: usuarioId, body });
    if (error) setErro(error.message);
  }

  if (!usuario) return null;

  return (
    <PageShell
      className="hub-page--denso"
      tag="Hub"
      titulo="Chat"
      subtitulo="Converse com o time — mensagens em tempo real."
    >
      {erro ? <p className="erro">{erro}</p> : null}

      <div className="chat-layout card">
        <aside className="chat-lista" aria-label="Conversas">
          <div className="chat-novo">
            <label>
              Nova conversa
              <select value={novoPara} onChange={(e) => setNovoPara(e.target.value)}>
                <option value="">Selecione…</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} — {u.cargo}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn btn-secundario" disabled={!novoPara} onClick={() => void iniciarNovaConversa()}>
              Abrir
            </button>
          </div>

          {carregando ? (
            <p className="chat-vazio">Carregando…</p>
          ) : threads.length === 0 ? (
            <p className="chat-vazio">Nenhuma conversa ainda.</p>
          ) : (
            <ul className="chat-threads">
              {threads.map((t) => (
                <li key={t.thread_id}>
                  <button
                    type="button"
                    className={`chat-thread${t.thread_id === threadId ? ' ativo' : ''}`}
                    onClick={() => setThreadId(t.thread_id)}
                  >
                    <div className="chat-thread__topo">
                      <strong className="chat-thread__nome">{t.peer?.nome ?? 'Conversa'}</strong>
                      {t.last_message ? (
                        <span className="chat-thread__hora">{formatarHora(t.last_message.created_at)}</span>
                      ) : null}
                    </div>
                    <div className="chat-thread__linha">
                      <span className="chat-thread__preview">
                        {t.last_message?.body ?? '—'}
                      </span>
                      {t.unread ? <span className="chat-thread__badge" aria-label="Não lida" /> : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="chat-conversa" aria-label="Mensagens">
          {!threadId ? (
            <div className="chat-vazio-centro">
              <p>Selecione uma conversa ou abra uma nova.</p>
            </div>
          ) : (
            <>
              <header className="chat-topo">
                <div>
                  <strong>{threadAtual?.peer?.nome ?? 'Conversa'}</strong>
                  <span className="chat-topo__sub">{threadAtual?.peer?.cargo ?? ''}</span>
                </div>
              </header>

              <div className="chat-mensagens" role="log" aria-live="polite">
                {mensagens.map((m) => {
                  const minha = m.sender_id === usuarioId;
                  return (
                    <div key={m.id} className={`chat-msg${minha ? ' minha' : ''}`}>
                      <div className="chat-bolha">
                        <p>{m.body}</p>
                        <span className="chat-msg__hora">{formatarHora(m.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={fimRef} />
              </div>

              <form
                className="chat-composer"
                onSubmit={(e) => {
                  e.preventDefault();
                  void enviar();
                }}
              >
                <input
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Digite sua mensagem…"
                />
                <button type="submit" className="btn" disabled={!texto.trim()}>
                  Enviar
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </PageShell>
  );
}

