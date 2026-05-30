import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { ADMIN_DESCRICAO } from '@/lib/admin/modulos';
import {
  atualizarProdutoCatalogo,
  listarProdutosConfigCatalogo,
  salvarPrecoCatalogoTabela,
} from '@/lib/catalogoDigital/api';
import { listarTabelasPreco } from '@/lib/negociacao/api';
import { formatarMoeda } from '@/lib/pedidos/constants';
import type { ProdutoCatalogoAdmin } from '@/types/catalogoDigital';
import type { TabelaPreco } from '@/types/negociacao';
import { AdminSubnav } from '@/pages/admin/AdminSubnav';
import '@/pages/admin/admin.css';
import '@/pages/catalogo/catalogo.css';

export function CatalogoConfigPage() {
  const [tabelas, setTabelas] = useState<TabelaPreco[]>([]);
  const [tabelaId, setTabelaId] = useState('');
  const [produtos, setProdutos] = useState<ProdutoCatalogoAdmin[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void listarTabelasPreco().then(({ tabelas: lista }) => {
      setTabelas(lista);
      const padrao = lista.find((t) => t.padrao) ?? lista[0];
      if (padrao) setTabelaId(padrao.id);
    });
  }, []);

  const carregar = useCallback(async () => {
    if (!tabelaId) return;
    setCarregando(true);
    setErro(null);
    const { produtos: lista, error } = await listarProdutosConfigCatalogo(tabelaId);
    if (error) setErro(error.message);
    else setProdutos(lista);
    setCarregando(false);
  }, [tabelaId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return produtos;
    return produtos.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        (p.sku?.toLowerCase().includes(q) ?? false) ||
        p.categoria_nome.toLowerCase().includes(q),
    );
  }, [produtos, busca]);

  const visiveis = useMemo(
    () => produtos.filter((p) => p.visivel_catalogo).length,
    [produtos],
  );

  const toggleVisivel = async (p: ProdutoCatalogoAdmin) => {
    setSalvandoId(p.id);
    const { error } = await atualizarProdutoCatalogo(p.id, {
      visivel_catalogo: !p.visivel_catalogo,
    });
    setSalvandoId(null);
    if (error) setErro(error.message);
    else {
      setProdutos((prev) =>
        prev.map((row) =>
          row.id === p.id ? { ...row, visivel_catalogo: !row.visivel_catalogo } : row,
        ),
      );
      setMsg(`Visibilidade atualizada: ${p.nome}`);
    }
  };

  const salvarOrdem = async (p: ProdutoCatalogoAdmin, ordem: number) => {
    const { error } = await atualizarProdutoCatalogo(p.id, { ordem_catalogo: ordem });
    if (error) setErro(error.message);
    else {
      setProdutos((prev) =>
        prev.map((row) => (row.id === p.id ? { ...row, ordem_catalogo: ordem } : row)),
      );
    }
  };

  const salvarPreco = async (p: ProdutoCatalogoAdmin, preco: number) => {
    if (!tabelaId) return;
    setSalvandoId(p.id);
    const { error } = await salvarPrecoCatalogoTabela(tabelaId, p.id, preco);
    setSalvandoId(null);
    if (error) setErro(error.message);
    else {
      setProdutos((prev) =>
        prev.map((row) => (row.id === p.id ? { ...row, preco_tabela: preco } : row)),
      );
      setMsg(`Preço salvo: ${p.nome}`);
    }
  };

  return (
    <PageShell
      className="hub-page--denso"
      tag="Painel administrativo"
      titulo={
        <>
          Configurar <span>catálogo</span>
        </>
      }
      subtitulo={ADMIN_DESCRICAO}
    >
      <AdminSubnav />

      {erro ? (
        <p className="cat-erro" role="alert">
          {erro}
        </p>
      ) : null}
      {msg ? (
        <p style={{ opacity: 0.8, fontSize: '0.85rem' }} role="status">
          {msg}
        </p>
      ) : null}

      <div className="cat-config-filtros">
        <label>
          Tabela de preço
          <select value={tabelaId} onChange={(e) => setTabelaId(e.target.value)}>
            {tabelas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} ({t.codigo})
              </option>
            ))}
          </select>
        </label>
        <label>
          Buscar produto
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome, SKU ou categoria"
          />
        </label>
      </div>

      <div className="cat-kpis" aria-busy={carregando}>
        <div className="cat-kpi">
          <strong>{produtos.length}</strong>
          <span>produtos ativos</span>
        </div>
        <div className="cat-kpi">
          <strong>{visiveis}</strong>
          <span>visíveis no catálogo</span>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="cat-config-tabela">
          <thead>
            <tr>
              <th>Visível</th>
              <th>Ordem</th>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Preço base</th>
              <th>Preço tabela</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={p.visivel_catalogo}
                    disabled={salvandoId === p.id}
                    onChange={() => void toggleVisivel(p)}
                    aria-label={`Visível: ${p.nome}`}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={p.ordem_catalogo}
                    onChange={(e) =>
                      setProdutos((prev) =>
                        prev.map((row) =>
                          row.id === p.id
                            ? { ...row, ordem_catalogo: Number(e.target.value) || 0 }
                            : row,
                        ),
                      )
                    }
                    onBlur={(e) => void salvarOrdem(p, Number(e.target.value) || 0)}
                  />
                </td>
                <td>
                  <strong>{p.nome}</strong>
                  {p.sku ? <div style={{ opacity: 0.65, fontSize: '0.72rem' }}>{p.sku}</div> : null}
                </td>
                <td>{p.categoria_nome}</td>
                <td>{formatarMoeda(p.preco_base)}</td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={p.preco_tabela ?? p.preco_base}
                    onChange={(e) =>
                      setProdutos((prev) =>
                        prev.map((row) =>
                          row.id === p.id
                            ? { ...row, preco_tabela: Number(e.target.value) || 0 }
                            : row,
                        ),
                      )
                    }
                    onBlur={(e) =>
                      void salvarPreco(p, Number(e.target.value) || p.preco_base)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
