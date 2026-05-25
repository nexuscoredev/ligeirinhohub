import { supabase } from '@/lib/supabase';
import type { CategoriaProduto, Produto } from '@/types/pedidos';

export async function listarCategorias() {
  const { data, error } = await supabase
    .from('categorias_produto')
    .select('*')
    .order('ordem_separacao');

  return { categorias: (data ?? []) as CategoriaProduto[], error };
}

export async function salvarProduto(
  payload: {
    id?: string;
    categoria_id: string;
    nome: string;
    sku: string | null;
    preco_base: number;
    ativo: boolean;
    imagem_url?: string | null;
  },
) {
  const row = {
    categoria_id: payload.categoria_id,
    nome: payload.nome.trim(),
    sku: payload.sku?.trim() || null,
    preco_base: payload.preco_base,
    ativo: payload.ativo,
    imagem_url: payload.imagem_url ?? null,
  };

  if (payload.id) {
    const { error } = await supabase
      .from('produtos')
      .update(row as never)
      .eq('id', payload.id);
    return { error };
  }

  const { error } = await supabase.from('produtos').insert(row as never);
  return { error };
}

export async function listarProdutosAdmin() {
  const { data, error } = await supabase
    .from('produtos')
    .select('*, categorias_produto ( nome, ordem_separacao )')
    .order('nome');

  return { produtos: (data ?? []) as Produto[], error };
}
