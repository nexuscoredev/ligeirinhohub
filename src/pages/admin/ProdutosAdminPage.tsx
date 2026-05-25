import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { usePerfil } from '@/contexts/PerfilContext';
import { fetchCatalogoLegado, flattenCatalogo } from '@/lib/catalogo/fetchCatalogo';
import { syncCatalogoParaSupabase } from '@/lib/catalogo/syncParaSupabase';
import { isHubAdmin } from '@/lib/admin/usuariosApi';
import { imagemCatalogoUrl } from '@/lib/catalogo/imagemUrl';
import { formatarMoeda } from '@/lib/pedidos/constants';
import type { ProdutoCatalogoView } from '@/lib/catalogo/types';
import { AdminSubnav } from '@/pages/admin/AdminSubnav';
import './admin.css';

export function ProdutosAdminPage() {
  const { usuario } = usePerfil();
  const [produtos, setProdutos] = useState<ProdutoCatalogoView[]>([]);
  const [totalCatalogo, setTotalCatalogo] = useState(0);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [sincronizando, setSincronizando] = useState(false);

  const podeSync = usuario ? isHubAdmin(usuario.cargo) : false;

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const catalogo = await fetchCatalogoLegado();
      setProdutos(flattenCatalogo(catalogo));
      setTotalCatalogo(catalogo.totalProducts);
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar catálogo');
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const categorias = useMemo(() => {
    const map = new Map<string, string>();
    produtos.forEach((p) => map.set(p.categoria_slug, p.categoria_nome));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));
  }, [produtos]);

  const filtrados = produtos.filter((p) => {
    if (categoria && p.categoria_slug !== categoria) return false;
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    return (
      p.nome.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.categoria_nome.toLowerCase().includes(q)
    );
  });

  async function sincronizar() {
    if (!podeSync || sincronizando) return;
    setSincronizando(true);
    setSyncMsg('Iniciando…');
    setErro(null);
    const res = await syncCatalogoParaSupabase(setSyncMsg);
    setSincronizando(false);
    if (res.erros.length) {
      setErro(res.erros.join(' · '));
    } else {
      setSyncMsg(
        `Sync OK: ${res.categorias} categorias · ${res.produtosInseridos + res.produtosAtualizados} produtos (${res.produtosInseridos} novos, ${res.produtosAtualizados} atualizados)`,
      );
    }
  }

  return (
    <PageShell
      className="hub-page--denso"
      tag="Painel administrativo"
      titulo="Produtos"
      subtitulo={`Catálogo do site Ligeirinho Bebidas — ${totalCatalogo} itens.`}
    >
      <AdminSubnav />

      <p className="card" style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>
        Lista lida de <code>/data/catalogo.json</code> (mesma fonte de{' '}
        <a href="https://ligeirinhobebidas.vercel.app/pedidos.html" target="_blank" rel="noreferrer">
          pedidos.html
        </a>
        ). Uma requisição em cache — não consulta o Supabase a cada abertura.
      </p>

      {erro ? <p className="erro">{erro}</p> : null}
      {syncMsg ? (
        <p className="card" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
          {syncMsg}
        </p>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <label className="admin-busca" style={{ marginBottom: 0, flex: 1, minWidth: 180 }}>
          Buscar
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome ou SKU"
          />
        </label>
        <label style={{ minWidth: 160 }}>
          Categoria
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Todas</option>
            {categorias.map(([slug, nome]) => (
              <option key={slug} value={slug}>
                {nome}
              </option>
            ))}
          </select>
        </label>
        {podeSync ? (
          <button
            type="button"
            className="btn"
            style={{ alignSelf: 'flex-end' }}
            disabled={sincronizando}
            onClick={() => void sincronizar()}
          >
            {sincronizando ? 'Sincronizando…' : 'Sync Supabase (lotes)'}
          </button>
        ) : null}
      </div>

      {carregando ? (
        <p style={{ color: 'var(--hub-muted)' }}>Carregando catálogo…</p>
      ) : (
        <>
          <p style={{ fontSize: '0.8rem', color: 'var(--hub-muted)', marginBottom: '0.75rem' }}>
            Mostrando {filtrados.length} de {produtos.length} produtos
          </p>
          <div className="admin-tabela-wrap">
            <table className="admin-tabela">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>SKU</th>
                  <th>Preço</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.slice(0, 200).map((p) => (
                  <tr key={p.sku}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {imagemCatalogoUrl(p.imagem_url) ? (
                          <img
                            src={imagemCatalogoUrl(p.imagem_url)!}
                            alt=""
                            width={36}
                            height={36}
                            style={{ objectFit: 'contain', borderRadius: 6 }}
                            loading="lazy"
                          />
                        ) : null}
                        {p.nome}
                      </div>
                    </td>
                    <td>{p.categoria_nome}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--hub-muted)' }}>{p.sku}</td>
                    <td>{formatarMoeda(p.preco_base)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtrados.length > 200 ? (
            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--hub-muted)' }}>
              Refine a busca para ver mais — exibindo os primeiros 200 resultados.
            </p>
          ) : null}
        </>
      )}

      {podeSync ? (
        <p className="card" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
          <strong>Sync Supabase:</strong> grava em lotes de 25 (~8 requisições para 181 produtos).
          Use antes de operação/separação para vincular pedidos aos UUIDs do banco.
        </p>
      ) : null}
    </PageShell>
  );
}
