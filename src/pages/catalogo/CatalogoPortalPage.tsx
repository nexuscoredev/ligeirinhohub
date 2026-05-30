import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppPageHeader } from '@/components/AppPageHeader';
import { usePerfil } from '@/contexts/PerfilContext';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { imagemCatalogoUrl } from '@/lib/catalogo/imagemUrl';
import {
  agruparCatalogoPorCategoria,
  criarPedidoCatalogoDigital,
  listarCatalogoDigital,
  resolverCodigoTabelaCliente,
} from '@/lib/catalogoDigital/api';
import { listarClientes } from '@/lib/pedidos/api';
import { formatarMoeda } from '@/lib/pedidos/constants';
import type { CarrinhoCatalogoItem, ProdutoCatalogoDigital } from '@/types/catalogoDigital';
import type { Cliente } from '@/types/pedidos';
import './catalogo.css';

function totalCarrinho(itens: CarrinhoCatalogoItem[]) {
  return itens.reduce((s, i) => s + i.preco * i.qty, 0);
}

export function CatalogoPortalPage() {
  const app = appPorId('catalogo');
  const item = app ? itemAppPorRota(app, '/catalogo') : null;
  const { usuario } = usePerfil();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [produtos, setProdutos] = useState<ProdutoCatalogoDigital[]>([]);
  const [catAtiva, setCatAtiva] = useState<string | null>(null);
  const [carrinho, setCarrinho] = useState<CarrinhoCatalogoItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<number | null>(null);
  const [comoOrcamento, setComoOrcamento] = useState(false);
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    void listarClientes().then(({ clientes: lista }) => setClientes(lista));
  }, []);

  const cliente = useMemo(
    () => clientes.find((c) => c.id === clienteId) ?? null,
    [clientes, clienteId],
  );

  const carregarCatalogo = useCallback(async () => {
    if (!cliente) {
      setProdutos([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro(null);
    const codigoTabela = await resolverCodigoTabelaCliente(cliente.tabela_preco);
    const { produtos: lista, error } = await listarCatalogoDigital(codigoTabela);
    if (error) setErro(error.message);
    else {
      setProdutos(lista);
      const grupos = agruparCatalogoPorCategoria(lista);
      setCatAtiva(grupos[0]?.slug ?? null);
    }
    setCarregando(false);
  }, [cliente]);

  useEffect(() => {
    void carregarCatalogo();
  }, [carregarCatalogo]);

  const categorias = useMemo(() => agruparCatalogoPorCategoria(produtos), [produtos]);
  const catSelecionada = useMemo(
    () => categorias.find((c) => c.slug === catAtiva) ?? categorias[0],
    [categorias, catAtiva],
  );

  const adicionar = (p: ProdutoCatalogoDigital) => {
    if (!p.sku) {
      setErro('Produto sem SKU — regularize em Admin → Produtos.');
      return;
    }
    setCarrinho((prev) => {
      const existente = prev.find((i) => i.produto_id === p.produto_id);
      if (existente) {
        return prev.map((i) =>
          i.produto_id === p.produto_id ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          produto_id: p.produto_id,
          sku: p.sku!,
          nome: p.nome,
          preco: p.preco,
          qty: 1,
          categoria_ordem: p.categoria_ordem,
          imagem_url: p.imagem_url,
        },
      ];
    });
  };

  const atualizarQty = (produtoId: string, qty: number) => {
    if (qty <= 0) {
      setCarrinho((prev) => prev.filter((i) => i.produto_id !== produtoId));
      return;
    }
    setCarrinho((prev) =>
      prev.map((i) => (i.produto_id === produtoId ? { ...i, qty } : i)),
    );
  };

  const enviarPedido = async () => {
    if (!usuario?.id || !clienteId) {
      setErro('Selecione um cliente.');
      return;
    }
    if (!carrinho.length) {
      setErro('Adicione itens ao pedido.');
      return;
    }

    setEnviando(true);
    setErro(null);
    const { pedido, error } = await criarPedidoCatalogoDigital({
      clienteId,
      itens: carrinho,
      usuarioId: usuario.id,
      observacoes,
      comoOrcamento,
    });
    setEnviando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setSucesso(pedido?.numero ?? null);
    setCarrinho([]);
    setObservacoes('');
  };

  if (!app || !item) return null;

  if (sucesso != null) {
    return (
      <AppPageHeader
        app={app}
        item={item}
        titulo="Pedido enviado"
        subtitulo="Entrega de pedidos via catálogo digital B2B."
      >
        <div className="cat-sucesso">
          <p>
            Pedido <strong>#{sucesso}</strong> registrado com sucesso.
          </p>
          <button type="button" className="btn" onClick={() => setSucesso(null)}>
            Novo pedido
          </button>
        </div>
      </AppPageHeader>
    );
  }

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Entrega de pedidos"
      subtitulo="Portal B2B — catálogo digital com tabela de preço do cliente."
    >
      <div className="cat-page">
        {erro ? (
          <p className="cat-erro" role="alert">
            {erro}
          </p>
        ) : null}

        <div className="cat-topo">
          <label>
            Cliente
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Selecione…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome_fantasia || c.nome}
                  {c.tabela_preco ? ` · ${c.tabela_preco}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            Observações
            <input
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Opcional"
            />
          </label>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.35rem' }}>
            <input
              type="checkbox"
              checked={comoOrcamento}
              onChange={(e) => setComoOrcamento(e.target.checked)}
            />
            Salvar como orçamento
          </label>
        </div>

        {!clienteId ? (
          <p style={{ opacity: 0.75 }}>Selecione um cliente para carregar o catálogo digital.</p>
        ) : (
          <div className="cat-layout" aria-busy={carregando}>
            <section aria-label="Catálogo de produtos">
              <div className="cat-kpis">
                <div className="cat-kpi">
                  <strong>{produtos.length}</strong>
                  <span>produtos visíveis</span>
                </div>
                <div className="cat-kpi">
                  <strong>{cliente?.tabela_preco ?? 'padrao'}</strong>
                  <span>tabela de preço</span>
                </div>
              </div>

              <div className="cat-categorias">
                {categorias.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    className={`cat-cat-btn${catAtiva === c.slug ? ' ativo' : ''}`}
                    onClick={() => setCatAtiva(c.slug)}
                  >
                    {c.nome}
                  </button>
                ))}
              </div>

              <div className="cat-produtos">
                {(catSelecionada?.produtos ?? []).map((p) => (
                  <article key={p.produto_id} className="cat-produto">
                    {p.imagem_url ? (
                      <img
                        src={imagemCatalogoUrl(p.imagem_url) ?? p.imagem_url}
                        alt=""
                        className="cat-produto-thumb"
                      />
                    ) : (
                      <div className="cat-produto-thumb" aria-hidden />
                    )}
                    <strong>{p.nome}</strong>
                    <span>{formatarMoeda(p.preco)}</span>
                    <button type="button" className="btn btn-secundario" onClick={() => adicionar(p)}>
                      Adicionar
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <aside className="cat-carrinho" aria-label="Carrinho">
              <h3>Carrinho ({carrinho.length})</h3>
              {carrinho.length === 0 ? (
                <p style={{ opacity: 0.7, fontSize: '0.82rem' }}>Nenhum item ainda.</p>
              ) : (
                <ul className="cat-carrinho-lista">
                  {carrinho.map((i) => (
                    <li key={i.produto_id} className="cat-carrinho-item">
                      <span>{i.nome}</span>
                      <input
                        type="number"
                        min={1}
                        value={i.qty}
                        onChange={(e) =>
                          atualizarQty(i.produto_id, Number(e.target.value) || 0)
                        }
                      />
                      <strong>{formatarMoeda(i.preco * i.qty)}</strong>
                    </li>
                  ))}
                </ul>
              )}
              <div className="cat-carrinho-total">
                <span>Total</span>
                <strong>{formatarMoeda(totalCarrinho(carrinho))}</strong>
              </div>
              <button
                type="button"
                className="btn"
                disabled={enviando || !carrinho.length}
                onClick={() => void enviarPedido()}
              >
                {enviando ? 'Enviando…' : 'Confirmar pedido de entrega'}
              </button>
            </aside>
          </div>
        )}
      </div>
    </AppPageHeader>
  );
}
