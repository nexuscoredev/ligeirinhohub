import { supabase } from '@/lib/supabase';
import type { Usuario } from '@/types/database';

export type SuporteStatus = 'aberto' | 'resolvido';

export interface SuporteTicket {
  id: string;
  criado_por: string;
  titulo: string;
  status: SuporteStatus;
  resolvido_em: string | null;
  resolvido_por: string | null;
  created_at: string;
  updated_at: string;
  usuarios?: Pick<Usuario, 'nome' | 'email' | 'cargo'> | null;
}

export interface SuporteMensagem {
  id: string;
  ticket_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export async function listarTickets() {
  const { data, error } = await supabase
    .from('suporte_tickets')
    .select('*, usuarios:criado_por ( nome, email, cargo )')
    .order('updated_at', { ascending: false })
    .limit(60);
  return { tickets: (data ?? []) as SuporteTicket[], error };
}

export async function criarTicket(input: { criadoPor: string; titulo: string; body: string }) {
  const titulo = input.titulo.trim();
  const body = input.body.trim();
  if (!titulo || !body) return { ticket: null as SuporteTicket | null, error: new Error('Informe título e descrição.') };

  const { data: ticket, error: e1 } = await supabase
    .from('suporte_tickets')
    .insert({ criado_por: input.criadoPor, titulo } as never)
    .select('*')
    .single();
  if (e1 || !ticket) return { ticket: null, error: e1 ?? new Error('Falha ao criar solicitação.') };

  const ticketId = (ticket as { id: string }).id;
  const { error: e2 } = await supabase.from('suporte_mensagens').insert({
    ticket_id: ticketId,
    sender_id: input.criadoPor,
    body,
  } as never);
  if (e2) return { ticket: null, error: e2 };

  // touch updated_at
  await supabase.from('suporte_tickets').update({ updated_at: new Date().toISOString() } as never).eq('id', ticketId);
  return { ticket: ticket as SuporteTicket, error: null };
}

export async function listarMensagensTicket(ticketId: string) {
  const { data, error } = await supabase
    .from('suporte_mensagens')
    .select('id, ticket_id, sender_id, body, created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
    .limit(200);
  return { mensagens: (data ?? []) as SuporteMensagem[], error };
}

export async function enviarMensagemTicket(input: { ticketId: string; senderId: string; body: string }) {
  const body = input.body.trim();
  if (!body) return { error: null as Error | null };
  const { error } = await supabase.from('suporte_mensagens').insert({
    ticket_id: input.ticketId,
    sender_id: input.senderId,
    body,
  } as never);
  if (!error) {
    await supabase
      .from('suporte_tickets')
      .update({ updated_at: new Date().toISOString() } as never)
      .eq('id', input.ticketId);
  }
  return { error };
}

export async function resolverTicket(input: { ticketId: string; resolvidoPor: string }) {
  const { error } = await supabase
    .from('suporte_tickets')
    .update({
      status: 'resolvido',
      resolvido_por: input.resolvidoPor,
      resolvido_em: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', input.ticketId);
  return { error };
}

