import { supabase } from '@/lib/supabase';
import type { GfTipoPessoa, Pessoa } from '@/types/cadastrosGf';

const PESSOA_SELECT =
  'id, tipos, nome, nome_fantasia, cpf_cnpj, email, telefone, tabela_preco, dia_vencimento_semana, bloqueado_pedido, inadimplente, limite_credito, observacoes, ativo';

export async function listarPessoas(filtroTipo?: GfTipoPessoa) {
  let query = supabase.from('pessoas').select(PESSOA_SELECT).order('nome');

  if (filtroTipo) {
    query = query.contains('tipos', [filtroTipo]);
  }

  const { data, error } = await query;
  return { pessoas: (data ?? []) as Pessoa[], error };
}

async function sincronizarCliente(pessoa: Pessoa) {
  if (!pessoa.tipos.includes('cliente')) return { error: null };

  const row = {
    pessoa_id: pessoa.id,
    nome: pessoa.nome,
    nome_fantasia: pessoa.nome_fantasia,
    tabela_preco: pessoa.tabela_preco,
    dia_vencimento_semana: pessoa.dia_vencimento_semana,
    bloqueado_pedido: pessoa.bloqueado_pedido,
    inadimplente: pessoa.inadimplente,
    observacoes: pessoa.observacoes,
    ativo: pessoa.ativo,
  };

  const { data: existente } = await supabase
    .from('clientes')
    .select('id')
    .eq('pessoa_id', pessoa.id)
    .maybeSingle();

  const clienteId = (existente as { id: string } | null)?.id;

  if (clienteId) {
    const { error } = await supabase.from('clientes').update(row as never).eq('id', clienteId);
    return { error };
  }

  const { error } = await supabase.from('clientes').insert(row as never);
  return { error };
}

export async function salvarPessoa(payload: {
  id?: string;
  tipos: GfTipoPessoa[];
  nome: string;
  nome_fantasia?: string | null;
  cpf_cnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  tabela_preco?: string;
  dia_vencimento_semana?: number | null;
  bloqueado_pedido?: boolean;
  inadimplente?: boolean;
  limite_credito?: number | null;
  observacoes?: string | null;
  ativo?: boolean;
}) {
  const tipos = payload.tipos.length ? payload.tipos : (['cliente'] as GfTipoPessoa[]);
  const row = {
    tipos,
    nome: payload.nome.trim(),
    nome_fantasia: payload.nome_fantasia?.trim() || null,
    cpf_cnpj: payload.cpf_cnpj?.trim() || null,
    email: payload.email?.trim() || null,
    telefone: payload.telefone?.trim() || null,
    tabela_preco: payload.tabela_preco?.trim() || 'padrao',
    dia_vencimento_semana: payload.dia_vencimento_semana ?? null,
    bloqueado_pedido: Boolean(payload.bloqueado_pedido),
    inadimplente: Boolean(payload.inadimplente),
    limite_credito: payload.limite_credito ?? null,
    observacoes: payload.observacoes?.trim() || null,
    ativo: payload.ativo ?? true,
  };

  if (payload.id) {
    const { data, error } = await supabase
      .from('pessoas')
      .update(row as never)
      .eq('id', payload.id)
      .select(PESSOA_SELECT)
      .single();

    if (error) return { pessoa: null, error };
    const pessoa = data as Pessoa;
    const sync = await sincronizarCliente(pessoa);
    return { pessoa, error: sync.error };
  }

  const { data, error } = await supabase
    .from('pessoas')
    .insert(row as never)
    .select(PESSOA_SELECT)
    .single();

  if (error) return { pessoa: null, error };
  const pessoa = data as Pessoa;
  const sync = await sincronizarCliente(pessoa);
  return { pessoa, error: sync.error };
}
