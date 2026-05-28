import { supabase } from '@/lib/supabase';
import type { Usuario } from '@/types/database';

export type UsuarioChatResumo = Pick<
  Usuario,
  'id' | 'nome' | 'cargo' | 'email' | 'avatar_url'
>;

export interface ChatThreadItem {
  thread_id: string;
  updated_at: string;
  peer?: UsuarioChatResumo | null;
  last_message?: { body: string; created_at: string; sender_id: string } | null;
  unread?: boolean;
}

export interface ResumoInboxChat {
  conversasNaoLidas: number;
  ticketsAbertos: number;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export async function listarUsuariosChat() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nome, cargo, email, avatar_url')
    .eq('ativo', true)
    .order('nome');
  return { usuarios: (data ?? []) as UsuarioChatResumo[], error };
}

export async function resumoInboxChat(usuarioId: string): Promise<ResumoInboxChat> {
  const [threadsRes, ticketsRes] = await Promise.all([
    listarThreads(usuarioId),
    supabase
      .from('suporte_tickets')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'aberto'),
  ]);
  return {
    conversasNaoLidas: threadsRes.threads.filter((t) => t.unread).length,
    ticketsAbertos: ticketsRes.count ?? 0,
  };
}

export async function listarThreads(usuarioId: string) {
  const { data: parts, error } = await supabase
    .from('chat_participants')
    .select('thread_id, joined_at, last_read_at, chat_threads ( updated_at )')
    .eq('user_id', usuarioId)
    .order('chat_threads(updated_at)', { ascending: false });

  if (error) return { threads: [] as ChatThreadItem[], error };

  const threadIds = (parts ?? []).map((p) => (p as { thread_id: string }).thread_id);
  if (!threadIds.length) return { threads: [] as ChatThreadItem[], error: null };

  // peers
  const { data: peers, error: ePeers } = await supabase
    .from('chat_participants')
    .select('thread_id, usuarios:user_id ( id, nome, cargo, email, avatar_url )')
    .in('thread_id', threadIds)
    .neq('user_id', usuarioId);

  if (ePeers) return { threads: [] as ChatThreadItem[], error: ePeers };

  const peerPorThread = new Map<string, UsuarioChatResumo | null>();
  (peers ?? []).forEach((row) => {
    const r = row as { thread_id: string; usuarios?: UsuarioChatResumo | null };
    peerPorThread.set(r.thread_id, r.usuarios ?? null);
  });

  // last messages
  const { data: msgs, error: eMsgs } = await supabase
    .from('chat_messages')
    .select('id, thread_id, body, created_at, sender_id')
    .in('thread_id', threadIds)
    .order('created_at', { ascending: false })
    .limit(Math.min(threadIds.length * 3, 200));

  if (eMsgs) return { threads: [] as ChatThreadItem[], error: eMsgs };

  const lastMsgPorThread = new Map<string, { body: string; created_at: string; sender_id: string }>();
  (msgs ?? []).forEach((m) => {
    const row = m as { thread_id: string; body: string; created_at: string; sender_id: string };
    if (!lastMsgPorThread.has(row.thread_id)) {
      lastMsgPorThread.set(row.thread_id, { body: row.body, created_at: row.created_at, sender_id: row.sender_id });
    }
  });

  const threads: ChatThreadItem[] = (parts ?? []).map((p) => {
    const row = p as {
      thread_id: string;
      last_read_at: string | null;
      chat_threads?: { updated_at: string } | null;
    };
    const last = lastMsgPorThread.get(row.thread_id) ?? null;
    const unread = Boolean(last && (!row.last_read_at || last.created_at > row.last_read_at));
    return {
      thread_id: row.thread_id,
      updated_at: row.chat_threads?.updated_at ?? new Date(0).toISOString(),
      peer: peerPorThread.get(row.thread_id) ?? null,
      last_message: last,
      unread,
    };
  });

  threads.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return { threads, error: null };
}

export async function criarOuAbrirThreadDM(_usuarioId: string, peerId: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) {
    return { threadId: null as string | null, error: new Error('Sessão inválida.') };
  }

  const { data, error } = await supabase.rpc('create_or_get_chat_dm', {
    p_peer_id: peerId,
  } as never);

  if (error) return { threadId: null, error };
  const threadId = typeof data === 'string' ? data : null;
  if (!threadId) {
    return { threadId: null, error: new Error('Não foi possível abrir a conversa.') };
  }
  return { threadId, error: null };
}

export async function listarMensagens(threadId: string) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, thread_id, sender_id, body, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(200);
  return { mensagens: (data ?? []) as ChatMessage[], error };
}

export async function enviarMensagem(input: { threadId: string; senderId: string; body: string }) {
  const body = input.body.trim();
  if (!body) return { error: null as Error | null };

  const { error } = await supabase.from('chat_messages').insert({
    thread_id: input.threadId,
    sender_id: input.senderId,
    body,
  } as never);
  return { error };
}

export async function marcarLido(threadId: string, userId: string) {
  const { error } = await supabase
    .from('chat_participants')
    .update({ last_read_at: new Date().toISOString() } as never)
    .eq('thread_id', threadId)
    .eq('user_id', userId);
  return { error };
}

