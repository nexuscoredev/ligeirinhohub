import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCatalogoLegado, flattenCatalogo } from '@/lib/catalogo/fetchCatalogo';
import { imagemCatalogoUrl } from '@/lib/catalogo/imagemUrl';
import { formatarMoeda } from '@/lib/pedidos/constants';
import {
  produtoArteFromCatalogo,
  skuJaNaArte,
} from '@/lib/marketing/creator/catalogoProduto';
import type { ProdutoCatalogoView } from '@/lib/catalogo/types';
import type { ProdutoArte } from '@/lib/marketing/creator/types';

interface CatalogoProdutoPickerProps {
  produtosSelecionados: ProdutoArte[];
  onAdicionar: (produto: ProdutoArte) => void;
}

export function CatalogoProdutoPicker({
  produtosSelecionados,
  onAdicionar,
}: CatalogoProdutoPickerProps) {
  const [catalogo, setCatalogo] = useState<ProdutoCatalogoView[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const data = await fetchCatalogoLegado();
      setCatalogo(flattenCatalogo(data));
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Catálogo indisponível');
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const categorias = useMemo(() => {
    const map = new Map<string, string>();
    catalogo.forEach((p) => map.set(p.categoria_slug, p.categoria_nome));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));
  }, [catalogo]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return catalogo.filter((p) => {
      if (categoria && p.categoria_slug !== categoria) return false;
      if (!q) return true;
      return (
        p.nome.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoria_nome.toLowerCase().includes(q)
      );
    });
  }, [catalogo, busca, categoria]);

  function adicionar(p: ProdutoCatalogoView) {
    if (skuJaNaArte(produtosSelecionados, p.sku)) return;
    onAdicionar(produtoArteFromCatalogo(p));
  }

  return (
    <div className="mkt-catalogo-picker">
      <div className="mkt-catalogo-picker-topo">
        <strong>Catálogo do Hub</strong>
        <span>{catalogo.length} produtos</span>
      </div>
      <p className="mkt-creator-sub" style={{ marginBottom: '0.75rem' }}>
        Busque no catálogo Ligeirinho — nome, preço e imagem entram na arte automaticamente.
      </p>

      <div className="mkt-catalogo-filtros">
        <label>
          Buscar
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome ou SKU"
          />
        </label>
        <label>
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
      </div>

      {erro ? <p className="erro">{erro}</p> : null}
      {carregando ? <p className="mkt-creator-vazio">Carregando catálogo…</p> : null}

      {!carregando && !erro ? (
        <ul className="mkt-catalogo-lista" aria-label="Produtos do catálogo">
          {filtrados.length === 0 ? (
            <li className="mkt-creator-vazio">Nenhum produto encontrado.</li>
          ) : (
            filtrados.slice(0, 80).map((p) => {
              const jaAdd = skuJaNaArte(produtosSelecionados, p.sku);
              const img = imagemCatalogoUrl(p.imagem_url);
              return (
                <li key={p.sku}>
                  <button
                    type="button"
                    className={`mkt-catalogo-item ${jaAdd ? 'adicionado' : ''}`}
                    onClick={() => adicionar(p)}
                    disabled={jaAdd}
                  >
                    <span className="mkt-catalogo-item-thumb">
                      {img ? <img src={img} alt="" loading="lazy" /> : '🍺'}
                    </span>
                    <span className="mkt-catalogo-item-corpo">
                      <strong>{p.nome}</strong>
                      <span>
                        {p.categoria_nome} · {formatarMoeda(p.preco_base)}
                      </span>
                    </span>
                    <span className="mkt-catalogo-item-acao">{jaAdd ? '✓' : '+'}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
      {filtrados.length > 80 ? (
        <p className="mkt-creator-sub">Refine a busca — mostrando 80 de {filtrados.length}.</p>
      ) : null}
    </div>
  );
}
