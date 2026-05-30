import type { SupabaseClient } from '@supabase/supabase-js';
import { registrarLote, registrarMapa, resolverMapa } from './client.js';
import type {
  ExportGf,
  ModoMigracao,
  ResultadoEtapa,
} from '../types.js';
import type { NomeEtapa } from './load.js';

function res(etapa: string, ok: number, erros: string[]): ResultadoEtapa {
  return { etapa, ok, erros };
}

async function upsertPorLegacy(
  supabase: SupabaseClient,
  tabela: string,
  entidade: string,
  row: Record<string, unknown>,
  legacyId: string,
  apply: boolean,
): Promise<{ hubId: string | null; erro?: string }> {
  const existente = await resolverMapa(supabase, entidade, legacyId);
  if (existente) return { hubId: existente };

  if (!apply) return { hubId: `dry-run-${legacyId}` };

  const { data, error } = await supabase
    .from(tabela)
    .upsert({ ...row, legacy_gf_id: legacyId } as never, {
      onConflict: 'legacy_gf_id',
      ignoreDuplicates: false,
    })
    .select('id')
    .single();

  if (error) return { hubId: null, erro: error.message };
  const hubId = (data as { id: string }).id;
  await registrarMapa(supabase, entidade, legacyId, hubId, true);
  return { hubId };
}

export async function executarEtapa(
  supabase: SupabaseClient,
  nome: NomeEtapa,
  exportData: ExportGf,
  modo: ModoMigracao,
): Promise<ResultadoEtapa> {
  const apply = modo === 'apply';
  const erros: string[] = [];
  let ok = 0;

  switch (nome) {
    case 'empresa_config': {
      for (const row of exportData.empresa_config ?? []) {
        if (!row.legacy_gf_id || !row.razao_social) {
          erros.push('empresa: legacy_gf_id e razao_social obrigatórios');
          continue;
        }
        const payload = {
          razao_social: row.razao_social,
          nome_fantasia: row.nome_fantasia ?? null,
          cnpj: row.cnpj?.replace(/\D/g, '') || null,
          inscricao_estadual: row.inscricao_estadual ?? null,
          regime_tributario: row.regime_tributario ?? 'simples',
          endereco: row.endereco ?? {},
          certificado_fiscal_ref: row.certificado_fiscal_ref ?? null,
          ativo: true,
        };
        if (apply) {
          const { error } = await supabase.from('empresa_config').upsert(
            { ...payload, legacy_gf_id: row.legacy_gf_id } as never,
            { onConflict: 'legacy_gf_id' },
          );
          if (error) erros.push(`empresa ${row.legacy_gf_id}: ${error.message}`);
          else ok += 1;
        } else ok += 1;
      }
      break;
    }

    case 'cadastros_base': {
      const tabelas: Array<{
        key: keyof ExportGf;
        table: string;
        entity: string;
        map: (r: never) => Record<string, unknown>;
      }> = [
        {
          key: 'formas_pagamento',
          table: 'formas_pagamento',
          entity: 'forma_pagamento',
          map: (r) => r,
        },
        {
          key: 'tipos_conta',
          table: 'tipos_conta',
          entity: 'tipo_conta',
          map: (r) => r,
        },
        { key: 'motivos', table: 'motivos', entity: 'motivo', map: (r) => r },
        {
          key: 'operacoes_fiscais',
          table: 'operacoes_fiscais',
          entity: 'operacao_fiscal',
          map: (r) => r,
        },
      ];

      for (const t of tabelas) {
        const rows = (exportData[t.key] as Array<{ legacy_gf_id: string }> | undefined) ?? [];
        for (const row of rows) {
          if (!row.legacy_gf_id) {
            erros.push(`${t.entity}: legacy_gf_id ausente`);
            continue;
          }
          const { erro } = await upsertPorLegacy(
            supabase,
            t.table,
            t.entity,
            t.map(row as never),
            row.legacy_gf_id,
            apply,
          );
          if (erro) erros.push(`${t.entity} ${row.legacy_gf_id}: ${erro}`);
          else ok += 1;
        }
      }
      break;
    }

    case 'familias_categorias': {
      for (const row of exportData.familias_produto ?? []) {
        if (!row.legacy_gf_id) continue;
        const { erro } = await upsertPorLegacy(
          supabase,
          'familias_produto',
          'familia_produto',
          { nome: row.nome, ordem: row.ordem ?? 0, ativo: row.ativo ?? true },
          row.legacy_gf_id,
          apply,
        );
        if (erro) erros.push(`familia ${row.legacy_gf_id}: ${erro}`);
        else ok += 1;
      }
      for (const row of exportData.categorias_produto ?? []) {
        if (!row.legacy_gf_id) continue;
        if (apply) {
          const { error } = await supabase.from('categorias_produto').upsert(
            {
              nome: row.nome,
              slug: row.slug,
              ordem_separacao: row.ordem_separacao ?? 0,
            } as never,
            { onConflict: 'slug' },
          );
          if (error) erros.push(`categoria ${row.slug}: ${error.message}`);
          else {
            ok += 1;
            const { data } = await supabase
              .from('categorias_produto')
              .select('id')
              .eq('slug', row.slug)
              .single();
            if (data) {
              await registrarMapa(
                supabase,
                'categoria_produto',
                row.legacy_gf_id,
                (data as { id: string }).id,
                true,
              );
            }
          }
        } else ok += 1;
      }
      break;
    }

    case 'produtos': {
      for (const row of exportData.produtos ?? []) {
        if (!row.legacy_gf_id || !row.categoria_legacy_gf_id) {
          erros.push(`produto: legacy e categoria_legacy obrigatórios`);
          continue;
        }
        const catId = apply
          ? await resolverMapa(supabase, 'categoria_produto', row.categoria_legacy_gf_id)
          : `dry-cat-${row.categoria_legacy_gf_id}`;
        if (!catId) {
          erros.push(`produto ${row.legacy_gf_id}: categoria não mapeada`);
          continue;
        }
        const payload = {
          categoria_id: catId,
          nome: row.nome,
          sku: row.sku ?? null,
          preco_base: row.preco_base ?? 0,
          imagem_url: row.imagem_url ?? null,
          ncm: row.ncm ?? null,
          ean: row.ean ?? null,
          ativo: row.ativo ?? true,
        };
        const { erro, hubId } = await upsertPorLegacy(
          supabase,
          'produtos',
          'produto',
          payload,
          row.legacy_gf_id,
          apply,
        );
        if (erro) erros.push(`produto ${row.legacy_gf_id}: ${erro}`);
        else if (hubId) ok += 1;
      }
      break;
    }

    case 'pessoas': {
      for (const row of exportData.pessoas ?? []) {
        if (!row.legacy_gf_id || !row.nome) continue;
        const payload = {
          tipos: row.tipos ?? ['cliente'],
          nome: row.nome,
          nome_fantasia: row.nome_fantasia ?? null,
          cpf_cnpj: row.cpf_cnpj?.replace(/\D/g, '') || null,
          email: row.email ?? null,
          telefone: row.telefone ?? null,
          tabela_preco: row.tabela_preco ?? 'padrao',
          ativo: row.ativo ?? true,
        };
        const { erro } = await upsertPorLegacy(
          supabase,
          'pessoas',
          'pessoa',
          payload,
          row.legacy_gf_id,
          apply,
        );
        if (erro) erros.push(`pessoa ${row.legacy_gf_id}: ${erro}`);
        else ok += 1;
      }
      break;
    }

    case 'tabelas_preco': {
      for (const row of exportData.tabelas_preco ?? []) {
        if (!row.legacy_gf_id) continue;
        const { erro } = await upsertPorLegacy(
          supabase,
          'tabelas_preco',
          'tabela_preco',
          {
            codigo: row.codigo,
            nome: row.nome,
            padrao: row.padrao ?? false,
            ativo: row.ativo ?? true,
          },
          row.legacy_gf_id,
          apply,
        );
        if (erro) erros.push(`tabela ${row.legacy_gf_id}: ${erro}`);
        else ok += 1;
      }
      for (const item of exportData.tabelas_preco_itens ?? []) {
        if (apply) {
          const tabelaId = await resolverMapa(
            supabase,
            'tabela_preco',
            item.tabela_legacy_gf_id,
          );
          const produtoId = await resolverMapa(
            supabase,
            'produto',
            item.produto_legacy_gf_id,
          );
          if (!tabelaId || !produtoId) {
            erros.push(
              `item preço: mapa ausente t=${item.tabela_legacy_gf_id} p=${item.produto_legacy_gf_id}`,
            );
            continue;
          }
          const { error } = await supabase.from('tabelas_preco_itens').upsert(
            {
              tabela_preco_id: tabelaId,
              produto_id: produtoId,
              preco: item.preco,
            } as never,
            { onConflict: 'tabela_preco_id,produto_id' },
          );
          if (error) erros.push(`item preço: ${error.message}`);
          else ok += 1;
        } else ok += 1;
      }
      break;
    }

    case 'fiscal_estoque': {
      for (const row of exportData.series_fiscais ?? []) {
        if (!row.legacy_gf_id) continue;
        const { erro } = await upsertPorLegacy(
          supabase,
          'series_fiscais',
          'serie_fiscal',
          {
            modelo: row.modelo,
            serie: row.serie,
            numero_atual: row.numero_atual ?? 0,
            ambiente: row.ambiente ?? 'homologacao',
            ativo: row.ativo ?? true,
          },
          row.legacy_gf_id,
          apply,
        );
        if (erro) erros.push(`serie ${row.legacy_gf_id}: ${erro}`);
        else ok += 1;
      }
      for (const saldo of exportData.estoque_saldos ?? []) {
        if (!apply) {
          ok += 1;
          continue;
        }
        const produtoId = await resolverMapa(supabase, 'produto', saldo.produto_legacy_gf_id);
        if (!produtoId) {
          erros.push(`saldo: produto ${saldo.produto_legacy_gf_id} não mapeado`);
          continue;
        }
        let depositoId: string | null = null;
        if (saldo.deposito_legacy_gf_id) {
          depositoId = await resolverMapa(
            supabase,
            'estoque_deposito',
            saldo.deposito_legacy_gf_id,
          );
        }
        if (!depositoId) {
          const { data: dep } = await supabase
            .from('estoque_depositos')
            .select('id')
            .eq('codigo', 'DEP01')
            .maybeSingle();
          depositoId = (dep as { id: string } | null)?.id ?? null;
        }
        if (!depositoId) {
          erros.push('saldo: depósito DEP01 não encontrado');
          continue;
        }
        const { error } = await supabase.from('estoque_saldos').upsert(
          {
            deposito_id: depositoId,
            produto_id: produtoId,
            quantidade: saldo.quantidade,
          } as never,
          { onConflict: 'deposito_id,produto_id' },
        );
        if (error) erros.push(`saldo: ${error.message}`);
        else ok += 1;
      }
      break;
    }

    case 'operacional_financeiro': {
      for (const nf of exportData.notas_fiscais ?? []) {
        if (!nf.legacy_gf_id) continue;
        if (apply) {
          const { error } = await supabase.from('notas_fiscais').upsert(
            {
              legacy_gf_id: nf.legacy_gf_id,
              modelo: nf.modelo ?? '55',
              serie: nf.serie,
              numero: nf.numero,
              status: nf.status ?? 'autorizada',
              valor_total: nf.valor_total ?? 0,
              chave_acesso: nf.chave_acesso ?? null,
            } as never,
            { onConflict: 'legacy_gf_id' },
          );
          if (error) erros.push(`NF ${nf.legacy_gf_id}: ${error.message}`);
          else ok += 1;
        } else ok += 1;
      }
      for (const conta of exportData.contas_abertas ?? []) {
        if (!conta.legacy_gf_id) continue;
        let pessoaId: string | null = null;
        if (conta.pessoa_legacy_gf_id) {
          pessoaId = apply
            ? await resolverMapa(supabase, 'pessoa', conta.pessoa_legacy_gf_id)
            : 'dry-pessoa';
        }
        if (apply) {
          const { error } = await supabase.from('contas_financeiras').upsert(
            {
              legacy_gf_id: conta.legacy_gf_id,
              natureza: conta.natureza,
              descricao: conta.descricao,
              valor_original: conta.valor_saldo,
              valor_saldo: conta.valor_saldo,
              data_vencimento: conta.data_vencimento,
              data_emissao: conta.data_vencimento,
              pessoa_id: pessoaId,
              status: 'aberta',
            } as never,
            { onConflict: 'legacy_gf_id' },
          );
          if (error) erros.push(`conta ${conta.legacy_gf_id}: ${error.message}`);
          else ok += 1;
        } else ok += 1;
      }
      for (const ped of exportData.pedidos_abertos ?? []) {
        if (!ped.legacy_gf_id || !ped.cliente_legacy_gf_id) continue;
        if (!apply) {
          ok += 1;
          continue;
        }
        const pessoaId = await resolverMapa(supabase, 'pessoa', ped.cliente_legacy_gf_id);
        if (!pessoaId) {
          erros.push(`pedido ${ped.legacy_gf_id}: cliente não mapeado`);
          continue;
        }
        const { data: cliente } = await supabase
          .from('clientes')
          .select('id')
          .eq('pessoa_id', pessoaId)
          .maybeSingle();
        if (!cliente) {
          erros.push(`pedido ${ped.legacy_gf_id}: clientes compat não encontrado`);
          continue;
        }
        erros.push(
          `pedido ${ped.legacy_gf_id}: importação de pedidos abertos requer revisão manual (stub)`,
        );
      }
      break;
    }
  }

  await registrarLote(supabase, nome, modo, ok, erros);
  return res(nome, ok, erros);
}
