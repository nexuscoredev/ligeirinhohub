import { useEffect, useMemo, useState } from 'react';
import {
  criarPedido,
  listarClientes,
  listarProdutos,
  type LinhaNovoPedido,
} from '@/lib/pedidos/api';
import { formatarMoeda, ORIGEM_LABEL } from '@/lib/pedidos/constants';
import type { Cliente, PedidoOrigem, PedidoModalidade, Produto } from '@/types/pedidos';

const ORIGENS_CRIAR: PedidoOrigem[] = [
  'whatsapp',
  'cayena',
  'balcao',
  'hub',
  'app',
];

interface CriarPedidoModalProps {
  aberto: boolean;
  usuarioId: string;
  onFechar: () => void;
  onCriado: (numero: number, naFila: boolean) => void;
}

export function CriarPedidoModal({
  aberto,
  usuarioId,
  onFechar,
  onCriado,
}: CriarPedidoModalProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [buscaCliente, setBuscaCliente] = useState('');
  const [origem, setOrigem] = useState<PedidoOrigem>('whatsapp');
  const [modalidade, setModalidade] = useState<PedidoModalidade>('entrega');
  const [comoOrcamento, setComoOrcamento] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');
  const [carrinho, setCarrinho] = useState<LinhaNovoPedido[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    void listarClientes().then(({ clientes: lista }) => setClientes(lista));
    void listarProdutos().then(({ produtos: lista }) => setProdutos(lista));
  }, [aberto]);

  useEffect(() => {
    if (!aberto) {
      setClienteId('');
      setBuscaCliente('');
      setOrigem('whatsapp');
      setModalidade('entrega');
      setComoOrcamento(false);
      setObservacoes('');
      setBuscaProduto('');
      setCarrinho([]);
      setErro(null);
    }
  }, [aberto]);

  const clientesFiltrados = useMemo(() => {
    const q = buscaCliente.trim().toLowerCase();
    if (!q) return clientes.slice(0, 40);
    return clientes
      .filter(
        (c) =>
          c.nome.toLowerCase().includes(q) ||
          (c.nome_fantasia?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, 40);
  }, [clientes, buscaCliente]);

  const produtosFiltrados = useMemo(() => {
    const q = buscaProduto.trim().toLowerCase();
    if (!q) return produtos.slice(0, 50);
    return produtos
      .filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          (p.sku?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, 50);
  }, [produtos, buscaProduto]);

  const total = useMemo(
    () => carrinho.reduce((acc, i) => acc + i.preco_unitario * i.qty, 0),
    [carrinho],
  );

  function adicionarProduto(prod: Produto) {
    if (!prod.sku) {
      setErro(`"${prod.nome}" não tem SKU — sincronize o catálogo em Admin → Produtos.`);
      return;
    }
    setErro(null);
    const ordem = prod.categorias_produto?.ordem_separacao ?? 0;
    setCarrinho((prev) => {
      const idx = prev.findIndex((i) => i.sku === prod.sku);
      if (idx >= 0) {
        return prev.map((i, n) => (n === idx ? { ...i, qty: i.qty + 1 } : i));
      }
      return [
        ...prev,
        {
          sku: prod.sku!,
          nome: prod.nome,
          preco_unitario: Number(prod.preco_base),
          categoria_ordem: ordem,
          qty: 1,
        },
      ];
    });
  }

  function alterarQty(sku: string, delta: number) {
    setCarrinho((prev) =>
      prev
        .map((i) => (i.sku === sku ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    );
  }

  async function enviar() {
    if (!clienteId) {
      setErro('Selecione um cliente.');
      return;
    }
    if (carrinho.length === 0) {
      setErro('Adicione pelo menos um produto.');
      return;
    }
    setEnviando(true);
    setErro(null);
    const { pedido, error } = await criarPedido({
      clienteId,
      origem,
      modalidade,
      itens: carrinho,
      usuarioId,
      comoOrcamento,
      observacoes,
    });
    setEnviando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    if (pedido) {
      onCriado(pedido.numero, !comoOrcamento);
      onFechar();
    }
  }

  if (!aberto) return null;

  return (
    <div
      className="ops-modal-backdrop"
      role="presentation"
      onClick={onFechar}
    >
      <div
        className="ops-modal ops-modal--pedido card"
        role="dialog"
        aria-labelledby="ops-criar-pedido-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="ops-criar-pedido-titulo" className="ops-modal-titulo">
          Criar pedido
        </h3>

        <div className="ops-criar-pedido-grid">
          <div className="ops-criar-pedido-col">
            <label className="ops-field">
              Cliente
              <input
                type="search"
                placeholder="Buscar nome ou fantasia…"
                value={buscaCliente}
                onChange={(e) => setBuscaCliente(e.target.value)}
              />
            </label>
            <select
              className="ops-field-select"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              size={5}
            >
              <option value="">Selecione o cliente</option>
              {clientesFiltrados.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome_fantasia ? `${c.nome_fantasia} (${c.nome})` : c.nome}
                  {c.bloqueado_pedido || c.inadimplente ? ' ⚠' : ''}
                </option>
              ))}
            </select>

            <div className="ops-criar-pedido-meta">
              <label className="ops-field">
                Origem
                <select
                  value={origem}
                  onChange={(e) => setOrigem(e.target.value as PedidoOrigem)}
                >
                  {ORIGENS_CRIAR.map((o) => (
                    <option key={o} value={o}>
                      {ORIGEM_LABEL[o]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ops-field">
                Modalidade
                <select
                  value={modalidade}
                  onChange={(e) =>
                    setModalidade(e.target.value as PedidoModalidade)
                  }
                >
                  <option value="entrega">Entrega</option>
                  <option value="retirada">Retirada</option>
                </select>
              </label>
            </div>

            <label className="ops-field ops-field--check">
              <input
                type="checkbox"
                checked={comoOrcamento}
                onChange={(e) => setComoOrcamento(e.target.checked)}
              />
              Salvar como orçamento (não entra na fila ainda)
            </label>

            <label className="ops-field">
              Observações
              <textarea
                rows={2}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Opcional"
              />
            </label>
          </div>

          <div className="ops-criar-pedido-col">
            <label className="ops-field">
              Produtos
              <input
                type="search"
                placeholder="Buscar produto ou SKU…"
                value={buscaProduto}
                onChange={(e) => setBuscaProduto(e.target.value)}
              />
            </label>
            <ul className="ops-criar-produtos-lista">
              {produtosFiltrados.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="ops-criar-produto-btn"
                    onClick={() => adicionarProduto(p)}
                  >
                    <span>{p.nome}</span>
                    <span>{formatarMoeda(Number(p.preco_base))}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="ops-criar-carrinho">
              <h4 className="ops-criar-carrinho-titulo">Itens do pedido</h4>
              {carrinho.length === 0 ? (
                <p className="ops-criar-vazio">Nenhum item adicionado.</p>
              ) : (
                <ul className="ops-criar-carrinho-lista">
                  {carrinho.map((item) => (
                    <li key={item.sku} className="ops-criar-carrinho-item">
                      <span className="ops-criar-carrinho-nome">{item.nome}</span>
                      <div className="ops-criar-qty">
                        <button
                          type="button"
                          className="ops-criar-qty-btn"
                          aria-label={`Menos ${item.nome}`}
                          onClick={() => alterarQty(item.sku, -1)}
                        >
                          −
                        </button>
                        <span>{item.qty}</span>
                        <button
                          type="button"
                          className="ops-criar-qty-btn"
                          aria-label={`Mais ${item.nome}`}
                          onClick={() => alterarQty(item.sku, 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className="ops-criar-carrinho-valor">
                        {formatarMoeda(item.preco_unitario * item.qty)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="ops-criar-total">
                Total <strong>{formatarMoeda(total)}</strong>
              </p>
            </div>
          </div>
        </div>

        {erro ? (
          <p className="erro" role="alert">
            {erro}
          </p>
        ) : null}

        <div className="ops-modal-acoes">
          <button
            type="button"
            className="btn"
            disabled={enviando}
            onClick={() => void enviar()}
          >
            {enviando
              ? 'Salvando…'
              : comoOrcamento
                ? 'Criar orçamento'
                : 'Criar e enviar à fila'}
          </button>
          <button
            type="button"
            className="btn btn-secundario"
            disabled={enviando}
            onClick={onFechar}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
