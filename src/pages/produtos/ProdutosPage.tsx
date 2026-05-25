import { useEffect, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { listarProdutos } from '@/lib/pedidos/api';
import { formatarMoeda } from '@/lib/pedidos/constants';
import type { Produto } from '@/types/pedidos';

export function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  useEffect(() => {
    void listarProdutos().then(({ produtos: lista }) => setProdutos(lista));
  }, []);

  return (
    <PageShell
      className="hub-page--denso"
      tag="Hub"
      titulo="Produtos"
      subtitulo="Catálogo base — migração do sistema legado em andamento."
    >
      <div className="hub-grid-2">
        {produtos.map((p) => (
          <article key={p.id} className="card" style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="ops-item-img" style={{ flexShrink: 0 }}>
              {p.imagem_url ? (
                <img src={p.imagem_url} alt="" />
              ) : (
                <span aria-hidden>🍺</span>
              )}
            </div>
            <div>
              <strong>{p.nome}</strong>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--hub-muted)' }}>
                {p.categorias_produto?.nome ?? '—'}
                {p.sku ? ` · ${p.sku}` : ''}
              </p>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--hub-gold)' }}>
                {formatarMoeda(Number(p.preco_base))}
              </p>
            </div>
          </article>
        ))}
      </div>
      {produtos.length === 0 ? (
        <p className="card">Nenhum produto — aplique as migrações Supabase ou importe do sistema atual.</p>
      ) : null}
    </PageShell>
  );
}
