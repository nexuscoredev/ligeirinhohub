import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppPageHeader } from '@/components/AppPageHeader';
import { usePerfil } from '@/contexts/PerfilContext';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { listarProdutos } from '@/lib/pedidos/api';
import {
  FORMA_PAGAMENTO_LABEL,
  FORMAS_PAGAMENTO,
  formatarMoeda,
  ORIGEM_LABEL,
  STATUS_LABEL,
} from '@/lib/pedidos/constants';
import {
  buscarPedidoPorNumero,
  confirmarRecebimento,
  criarVendaBalcao,
  parsePagamentoSplit,
  somaPagamentoSplit,
  validarPagamentoSplit,
  type LinhaCarrinhoBalcao,
} from '@/lib/pdv/api';
import type {
  PagamentoSplit,
  PagamentoSplitLinha,
  Pedido,
  PedidoItem,
  Produto,
} from '@/types/pedidos';
import './pdv.css';

type ModoPdv = 'receber' | 'balcao';

function splitInicial(): PagamentoSplit {
  return FORMAS_PAGAMENTO.map((forma) => ({ forma, valor: 0 }));
}

function PagamentoSplitTabela({
  split,
  editavel,
  onChange,
}: {
  split: PagamentoSplit;
  editavel: boolean;
  onChange?: (next: PagamentoSplit) => void;
}) {
  return (
    <table className="pdv-pagamento-tabela">
      <thead>
        <tr>
          <th>Forma</th>
          <th>Valor</th>
        </tr>
      </thead>
      <tbody>
        {split.map((linha) => (
          <tr key={linha.forma}>
            <td>{FORMA_PAGAMENTO_LABEL[linha.forma]}</td>
            <td>
              {editavel && onChange ? (
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  inputMode="decimal"
                  value={linha.valor || ''}
                  onChange={(e) => {
                    const valor = e.target.value === '' ? 0 : Number(e.target.value);
                    onChange(
                      split.map((l) =>
                        l.forma === linha.forma ? { ...l, valor } : l,
                      ),
                    );
                  }}
                />
              ) : (
                formatarMoeda(linha.valor)
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ReceberPedidoPanel({ usuarioId }: { usuarioId: string }) {
  const [numeroInput, setNumeroInput] = useState('');
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [itens, setItens] = useState<PedidoItem[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const split = useMemo(
    () => parsePagamentoSplit(pedido?.pagamento_split) ?? [],
    [pedido?.pagamento_split],
  );

  const bloqueioTotem = pedido?.origem === 'totem';
  const jaRecebido = Boolean(pedido?.pagamento_recebido_em);
  const semSplit = pedido && split.length === 0;

  const buscar = useCallback(async () => {
    const numero = Number(numeroInput.replace(/\D/g, ''));
    if (!numero || numero < 1) {
      setErro('Informe um número de pedido válido.');
      return;
    }
    setCarregando(true);
    setErro(null);
    setSucesso(null);
    setPedido(null);
    setItens([]);
    const { pedido: p, itens: lista, error } = await buscarPedidoPorNumero(numero);
    setCarregando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setPedido(p);
    setItens(lista);
  }, [numeroInput]);

  async function confirmar() {
    if (!pedido) return;
    setConfirmando(true);
    setErro(null);
    setSucesso(null);
    const { error } = await confirmarRecebimento(pedido.id, usuarioId);
    setConfirmando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setSucesso(`Recebimento do pedido #${pedido.numero} confirmado.`);
    const { pedido: atualizado, itens: lista } = await buscarPedidoPorNumero(pedido.numero);
    setPedido(atualizado);
    setItens(lista);
    setNumeroInput('');
    inputRef.current?.focus();
  }

  return (
    <section aria-labelledby="pdv-receber-titulo">
      <h2 id="pdv-receber-titulo" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        Receber pedido
      </h2>
      <div className="pdv-card">
        <label htmlFor="pdv-numero-pedido">
          <span style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>
            Número do pedido
          </span>
          <div className="pdv-busca-pedido">
            <input
              ref={inputRef}
              id="pdv-numero-pedido"
              className="pdv-input-numero"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              placeholder="Ex.: 42"
              value={numeroInput}
              onChange={(e) => setNumeroInput(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void buscar();
              }}
            />
            <button
              type="button"
              className="pdv-btn-primario"
              onClick={() => void buscar()}
              disabled={carregando}
            >
              {carregando ? 'Buscando…' : 'Buscar'}
            </button>
          </div>
        </label>
      </div>

      {erro ? <p className="pdv-erro" role="alert">{erro}</p> : null}
      {sucesso ? <p className="pdv-sucesso" role="status">{sucesso}</p> : null}

      {pedido ? (
        <div className="pdv-card">
          <div className="pdv-pedido-header">
            <span className="pdv-pedido-numero">#{pedido.numero}</span>
            <span className="pdv-badge-origem">{ORIGEM_LABEL[pedido.origem]}</span>
            <span style={{ color: 'var(--hub-muted)', fontSize: '0.85rem' }}>
              {STATUS_LABEL[pedido.status]}
            </span>
          </div>
          <p style={{ margin: '0 0 0.5rem' }}>
            <strong>{pedido.clientes?.nome_fantasia ?? pedido.clientes?.nome}</strong>
          </p>

          {jaRecebido ? (
            <p className="pdv-aviso" role="status">
              Pagamento já confirmado em{' '}
              {new Date(pedido.pagamento_recebido_em!).toLocaleString('pt-BR')}.
            </p>
          ) : null}

          {semSplit ? (
            <p className="pdv-aviso" role="status">
              Este pedido não tem formas de pagamento registradas. Confira com o cliente antes de
              receber.
            </p>
          ) : null}

          {bloqueioTotem ? (
            <p className="pdv-aviso pdv-aviso--info" role="note">
              Pagamento definido no totem — para alterar, o cliente deve refazer no totem.
            </p>
          ) : null}

          <ul className="pdv-itens-lista">
            {itens.map((item) => (
              <li key={item.id}>
                <span>
                  {item.nome_snapshot} × {Number(item.qty_pedida)}
                </span>
                <span>
                  {formatarMoeda(Number(item.qty_pedida) * Number(item.preco_unitario))}
                </span>
              </li>
            ))}
          </ul>
          <div className="pdv-total-linha">
            <span>Total</span>
            <span>{formatarMoeda(Number(pedido.valor_pedido))}</span>
          </div>

          <h3 style={{ margin: '1rem 0 0.5rem', fontSize: '0.95rem' }}>Pagamento</h3>
          {split.length > 0 ? (
            <PagamentoSplitTabela split={split} editavel={false} />
          ) : (
            <p style={{ color: 'var(--hub-muted)', fontSize: '0.85rem' }}>Nenhum split informado.</p>
          )}
          {split.length > 0 ? (
            <p style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--hub-muted)' }}>
              Soma: {formatarMoeda(somaPagamentoSplit(split))}
            </p>
          ) : null}

          {!jaRecebido ? (
            <button
              type="button"
              className="pdv-btn-primario"
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={confirmando}
              onClick={() => void confirmar()}
            >
              {confirmando ? 'Confirmando…' : 'Confirmar recebimento'}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function VendaBalcaoPanel({ usuarioId }: { usuarioId: string }) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [carrinho, setCarrinho] = useState<LinhaCarrinhoBalcao[]>([]);
  const [split, setSplit] = useState<PagamentoSplit>(splitInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    void listarProdutos().then(({ produtos: lista }) => setProdutos(lista));
  }, []);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return produtos.slice(0, 80);
    return produtos
      .filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          (p.sku?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, 80);
  }, [produtos, busca]);

  const total = useMemo(
    () => carrinho.reduce((acc, i) => acc + i.preco_unitario * i.qty, 0),
    [carrinho],
  );

  const validacaoSplit = useMemo(
    () => validarPagamentoSplit(split, total),
    [split, total],
  );

  function adicionar(prod: Produto) {
    if (!prod.sku) {
      setErro(`"${prod.nome}" não tem SKU — sincronize o catálogo.`);
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

  async function finalizar() {
    if (carrinho.length === 0) {
      setErro('Adicione itens ao carrinho.');
      return;
    }
    if (!validacaoSplit.ok) {
      setErro(validacaoSplit.mensagem ?? 'Pagamento inválido.');
      return;
    }
    setEnviando(true);
    setErro(null);
    setSucesso(null);
    const linhas = split.filter((l) => Number(l.valor) > 0) as PagamentoSplitLinha[];
    const { pedido, error } = await criarVendaBalcao(carrinho, linhas, usuarioId);
    setEnviando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setSucesso(
      pedido
        ? `Pedido #${pedido.numero} criado — segue para separação.`
        : 'Venda registrada.',
    );
    setCarrinho([]);
    setSplit(splitInicial());
    setBusca('');
  }

  return (
    <section aria-labelledby="pdv-balcao-titulo">
      <h2 id="pdv-balcao-titulo" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        Venda balcão
      </h2>
      {erro ? <p className="pdv-erro" role="alert">{erro}</p> : null}
      {sucesso ? <p className="pdv-sucesso" role="status">{sucesso}</p> : null}

      <div className="pdv-layout-balcao">
        <div>
          <div className="pdv-card">
            <input
              className="pdv-busca-produto"
              type="search"
              placeholder="Buscar produto ou SKU…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <div className="pdv-grid-produtos">
              {filtrados.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="pdv-produto-btn"
                  onClick={() => adicionar(p)}
                >
                  <strong>{p.nome}</strong>
                  <span>{formatarMoeda(Number(p.preco_base))}</span>
                  {p.sku ? <span style={{ opacity: 0.6 }}>{p.sku}</span> : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="pdv-card">
            <h3 style={{ margin: '0 0 0.65rem', fontSize: '1rem' }}>Carrinho</h3>
            {carrinho.length === 0 ? (
              <p style={{ color: 'var(--hub-muted)', margin: 0 }}>Nenhum item.</p>
            ) : (
              <ul className="pdv-carrinho">
                {carrinho.map((item) => (
                  <li key={item.sku} className="pdv-carrinho-item">
                    <span>
                      {item.nome}
                      <br />
                      <small style={{ color: 'var(--hub-muted)' }}>
                        {formatarMoeda(item.preco_unitario)} / un
                      </small>
                    </span>
                    <div className="pdv-qty-controls">
                      <button
                        type="button"
                        className="pdv-qty-btn"
                        aria-label={`Menos ${item.nome}`}
                        onClick={() => alterarQty(item.sku, -1)}
                      >
                        −
                      </button>
                      <span className="pdv-qty-valor">{item.qty}</span>
                      <button
                        type="button"
                        className="pdv-qty-btn"
                        aria-label={`Mais ${item.nome}`}
                        onClick={() => alterarQty(item.sku, 1)}
                      >
                        +
                      </button>
                    </div>
                    <span>{formatarMoeda(item.preco_unitario * item.qty)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="pdv-total-linha">
              <span>Total</span>
              <span>{formatarMoeda(total)}</span>
            </div>
          </div>

          <div className="pdv-card">
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Pagamento</h3>
            <PagamentoSplitTabela split={split} editavel onChange={setSplit} />
            <p
              style={{
                marginTop: '0.35rem',
                fontSize: '0.85rem',
                color: validacaoSplit.ok ? 'var(--hub-muted)' : '#ff6b6b',
              }}
            >
              Soma: {formatarMoeda(validacaoSplit.soma)}
              {!validacaoSplit.ok && validacaoSplit.mensagem
                ? ` — ${validacaoSplit.mensagem}`
                : null}
            </p>
            <button
              type="button"
              className="pdv-btn-primario"
              style={{ width: '100%', marginTop: '0.85rem' }}
              disabled={enviando || carrinho.length === 0 || !validacaoSplit.ok}
              onClick={() => void finalizar()}
            >
              {enviando ? 'Registrando…' : 'Finalizar venda balcão'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PdvPage() {
  const app = appPorId('pdv');
  const { usuario } = usePerfil();
  const [modo, setModo] = useState<ModoPdv>('receber');

  if (!app || !usuario) return null;

  const item = itemAppPorRota(app, '/pdv');

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Painel do caixa"
      subtitulo="Receber pedidos do totem ou vender no balcão."
    >
      <div className="pdv-tabs" role="tablist" aria-label="Modo do caixa">
        <button
          type="button"
          role="tab"
          aria-selected={modo === 'receber'}
          className={`pdv-tab${modo === 'receber' ? ' ativo' : ''}`}
          onClick={() => setModo('receber')}
        >
          Receber pedido
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={modo === 'balcao'}
          className={`pdv-tab${modo === 'balcao' ? ' ativo' : ''}`}
          onClick={() => setModo('balcao')}
        >
          Venda balcão
        </button>
      </div>

      {modo === 'receber' ? (
        <ReceberPedidoPanel usuarioId={usuario.id} />
      ) : (
        <VendaBalcaoPanel usuarioId={usuario.id} />
      )}
    </AppPageHeader>
  );
}
