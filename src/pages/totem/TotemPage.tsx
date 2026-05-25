import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppPageHeader } from '@/components/AppPageHeader';
import { usePerfil } from '@/contexts/PerfilContext';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { fetchCatalogoLegado } from '@/lib/catalogo/fetchCatalogo';
import { imagemCatalogoUrl } from '@/lib/catalogo/imagemUrl';
import type { ProdutoCatalogoLegado } from '@/lib/catalogo/types';
import { formatarMoeda } from '@/lib/pedidos/constants';
import {
  criarPedidoTotem,
  FORMAS_PAGAMENTO_TOTEM,
  type FormaPagamentoTotem,
  type PagamentoSplitItem,
} from '@/lib/totem/api';
import { categoriasTotem } from '@/lib/totem/filtrarUnidade';
import './totem.css';

type PassoTotem = 'catalogo' | 'revisao' | 'pagamento' | 'sucesso';

interface CarrinhoItem {
  sku: string;
  nome: string;
  preco: number;
  qty: number;
  imagem: string | null;
  adultOnly?: boolean;
  categoria_ordem: number;
}

interface LinhaPagamento {
  id: string;
  forma: FormaPagamentoTotem;
  valor: string;
}

const PASSOS: { id: PassoTotem; label: string }[] = [
  { id: 'catalogo', label: 'Catálogo' },
  { id: 'revisao', label: 'Revisão' },
  { id: 'pagamento', label: 'Pagamento' },
  { id: 'sucesso', label: 'Concluído' },
];

function novoId() {
  return crypto.randomUUID();
}

function totalCarrinho(itens: CarrinhoItem[]) {
  return itens.reduce((acc, i) => acc + i.preco * i.qty, 0);
}

function centavos(v: number) {
  return Math.round(v * 100);
}

export function TotemPage() {
  const app = appPorId('totem');
  const { usuario } = usePerfil();
  const [passo, setPasso] = useState<PassoTotem>('catalogo');
  const [carregandoCat, setCarregandoCat] = useState(true);
  const [erroCat, setErroCat] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<
    ReturnType<typeof categoriasTotem>
  >([]);
  const [catAtiva, setCatAtiva] = useState<string | null>(null);
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
  const [linhasPag, setLinhasPag] = useState<LinhaPagamento[]>([
    { id: novoId(), forma: 'pix', valor: '' },
  ]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [numeroPedido, setNumeroPedido] = useState<number | null>(null);

  useEffect(() => {
    void fetchCatalogoLegado()
      .then((cat) => {
        const grupos = categoriasTotem(cat);
        setCategorias(grupos);
        setCatAtiva(grupos[0]?.slug ?? null);
        setErroCat(null);
      })
      .catch((e: Error) => setErroCat(e.message))
      .finally(() => setCarregandoCat(false));
  }, []);

  const catSelecionada = useMemo(
    () => categorias.find((c) => c.slug === catAtiva) ?? categorias[0],
    [categorias, catAtiva],
  );

  const total = useMemo(() => totalCarrinho(carrinho), [carrinho]);
  const qtdItens = useMemo(
    () => carrinho.reduce((acc, i) => acc + i.qty, 0),
    [carrinho],
  );

  const adicionar = useCallback(
    (p: ProdutoCatalogoLegado, categoria_ordem: number) => {
      setCarrinho((prev) => {
        const existente = prev.find((i) => i.sku === p.id);
        if (existente) {
          return prev.map((i) =>
            i.sku === p.id ? { ...i, qty: i.qty + 1 } : i,
          );
        }
        return [
          ...prev,
          {
            sku: p.id,
            nome: p.name,
            preco: p.price,
            qty: 1,
            imagem: p.image,
            adultOnly: p.adultOnly,
            categoria_ordem,
          },
        ];
      });
    },
    [],
  );

  const alterarQty = useCallback((sku: string, delta: number) => {
    setCarrinho((prev) =>
      prev
        .map((i) => (i.sku === sku ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    );
  }, []);

  const somaPagamento = useMemo(() => {
    return linhasPag.reduce((acc, l) => {
      const v = parseFloat(l.valor.replace(',', '.'));
      return acc + (Number.isFinite(v) ? v : 0);
    }, 0);
  }, [linhasPag]);

  const pagamentoValido =
    linhasPag.length > 0 &&
    linhasPag.every((l) => parseFloat(l.valor.replace(',', '.')) > 0) &&
    centavos(somaPagamento) === centavos(total);

  const reiniciar = () => {
    setCarrinho([]);
    setLinhasPag([{ id: novoId(), forma: 'pix', valor: '' }]);
    setNumeroPedido(null);
    setErro(null);
    setPasso('catalogo');
  };

  async function finalizarPedido() {
    if (!usuario || !pagamentoValido || carrinho.length === 0) return;

    setEnviando(true);
    setErro(null);

    const pagamentoSplit: PagamentoSplitItem[] = linhasPag.map((l) => ({
      forma: l.forma,
      valor: parseFloat(l.valor.replace(',', '.')),
    }));

    const { pedido, error } = await criarPedidoTotem({
      itens: carrinho.map((i) => ({
        sku: i.sku,
        nome: i.nome,
        preco_unitario: i.preco,
        qty: i.qty,
        categoria_ordem: i.categoria_ordem,
      })),
      pagamentoSplit,
      usuarioId: usuario.id,
    });

    setEnviando(false);

    if (error || !pedido) {
      setErro(error?.message ?? 'Erro ao criar pedido.');
      return;
    }

    setNumeroPedido(pedido.numero);
    setPasso('sucesso');
  }

  if (!app) return null;

  const item = itemAppPorRota(app, '/totem');
  const passoIdx = PASSOS.findIndex((p) => p.id === passo);

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Autoatendimento"
      subtitulo="Venda por unidade — defina o pagamento e retire no caixa."
    >
      <div className="totem-shell">
        <nav className="totem-steps" aria-label="Etapas do pedido">
          {PASSOS.map((s, idx) => (
            <span
              key={s.id}
              className={`totem-step${idx === passoIdx ? ' ativo' : ''}${idx < passoIdx ? ' concluido' : ''}`}
            >
              {idx + 1}. {s.label}
            </span>
          ))}
        </nav>

        {erro ? <p className="totem-erro" role="alert">{erro}</p> : null}

        {passo === 'catalogo' ? (
          <>
            {carregandoCat ? (
              <p className="totem-carregando">Carregando catálogo…</p>
            ) : erroCat ? (
              <p className="totem-erro">{erroCat}</p>
            ) : (
              <>
                <div className="totem-cats" role="tablist" aria-label="Categorias">
                  {categorias.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      role="tab"
                      aria-selected={cat.slug === catAtiva}
                      className={`totem-cat-btn${cat.slug === catAtiva ? ' ativo' : ''}`}
                      onClick={() => setCatAtiva(cat.slug)}
                    >
                      {cat.nome}
                    </button>
                  ))}
                </div>

                <div className="totem-grid" role="list">
                  {catSelecionada?.produtos.map((p) => {
                    const img = imagemCatalogoUrl(p.image);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className="totem-prod"
                        onClick={() =>
                          adicionar(p, catSelecionada?.ordem ?? 0)
                        }
                      >
                        <div className="totem-prod-img">
                          {img ? (
                            <img src={img} alt="" loading="lazy" />
                          ) : (
                            <span aria-hidden>🍺</span>
                          )}
                        </div>
                        {p.adultOnly ? (
                          <span className="totem-badge-18">+18</span>
                        ) : null}
                        <p className="totem-prod-nome">{p.name}</p>
                        <span className="totem-prod-preco">
                          {formatarMoeda(p.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="totem-cart-bar">
                  <div className="totem-cart-info">
                    <strong>{formatarMoeda(total)}</strong>
                    <span>
                      {qtdItens === 0
                        ? 'Toque nos produtos para adicionar'
                        : `${qtdItens} item(ns) no carrinho`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="totem-btn totem-btn-primario"
                    disabled={carrinho.length === 0}
                    onClick={() => setPasso('revisao')}
                  >
                    Revisar
                  </button>
                </div>
              </>
            )}
          </>
        ) : null}

        {passo === 'revisao' ? (
          <>
            <ul className="totem-revisao-lista">
              {carrinho.map((i) => (
                <li key={i.sku} className="totem-revisao-item">
                  <strong>{i.nome}</strong>
                  <div className="totem-qty">
                    <button
                      type="button"
                      aria-label="Diminuir quantidade"
                      onClick={() => alterarQty(i.sku, -1)}
                    >
                      −
                    </button>
                    <span>{i.qty}</span>
                    <button
                      type="button"
                      aria-label="Aumentar quantidade"
                      onClick={() => alterarQty(i.sku, 1)}
                    >
                      +
                    </button>
                  </div>
                  <span>{formatarMoeda(i.preco * i.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="totem-total-box">
              <span>Total</span>
              <span>{formatarMoeda(total)}</span>
            </div>
            <div className="totem-toolbar">
              <button
                type="button"
                className="totem-btn totem-btn-secundario"
                onClick={() => setPasso('catalogo')}
              >
                Voltar
              </button>
              <button
                type="button"
                className="totem-btn totem-btn-primario"
                disabled={carrinho.length === 0}
                onClick={() => {
                  setLinhasPag([
                    { id: novoId(), forma: 'pix', valor: total.toFixed(2) },
                  ]);
                  setPasso('pagamento');
                }}
              >
                Pagamento
              </button>
            </div>
          </>
        ) : null}

        {passo === 'pagamento' ? (
          <>
            <p style={{ margin: '0 0 0.5rem', color: 'var(--hub-muted)' }}>
              Informe como vai pagar (soma deve ser {formatarMoeda(total)}).
            </p>
            <div className="totem-pagamento-rows">
              {linhasPag.map((linha) => (
                <div key={linha.id} className="totem-pagamento-row">
                  <select
                    value={linha.forma}
                    onChange={(e) =>
                      setLinhasPag((prev) =>
                        prev.map((l) =>
                          l.id === linha.id
                            ? { ...l, forma: e.target.value as FormaPagamentoTotem }
                            : l,
                        ),
                      )
                    }
                    aria-label="Forma de pagamento"
                  >
                    {FORMAS_PAGAMENTO_TOTEM.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={linha.valor}
                    onChange={(e) =>
                      setLinhasPag((prev) =>
                        prev.map((l) =>
                          l.id === linha.id ? { ...l, valor: e.target.value } : l,
                        ),
                      )
                    }
                    aria-label="Valor"
                  />
                  <button
                    type="button"
                    aria-label="Remover linha"
                    disabled={linhasPag.length <= 1}
                    onClick={() =>
                      setLinhasPag((prev) => prev.filter((l) => l.id !== linha.id))
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="totem-btn totem-btn-secundario"
              style={{ marginTop: '0.5rem' }}
              onClick={() =>
                setLinhasPag((prev) => [
                  ...prev,
                  { id: novoId(), forma: 'dinheiro', valor: '' },
                ])
              }
            >
              + Outra forma
            </button>
            <p
              className={`totem-pagamento-resumo${
                pagamentoValido ? ' ok' : centavos(somaPagamento) > centavos(total) ? ' erro' : ''
              }`}
            >
              Informado: {formatarMoeda(somaPagamento)} — Falta:{' '}
              {formatarMoeda(Math.max(0, total - somaPagamento))}
            </p>
            <div className="totem-toolbar">
              <button
                type="button"
                className="totem-btn totem-btn-secundario"
                onClick={() => setPasso('revisao')}
              >
                Voltar
              </button>
              <button
                type="button"
                className="totem-btn totem-btn-primario"
                disabled={!pagamentoValido || enviando}
                onClick={() => void finalizarPedido()}
              >
                {enviando ? 'Enviando…' : 'Confirmar pedido'}
              </button>
            </div>
          </>
        ) : null}

        {passo === 'sucesso' && numeroPedido != null ? (
          <div className="totem-sucesso">
            <p>Pedido registrado!</p>
            <div className="totem-sucesso-numero" aria-live="polite">
              #{numeroPedido}
            </div>
            <p>
              Apresente este número no caixa. O atendente vai localizar seu pedido e
              conferir o pagamento que você definiu — não será alterado no caixa.
            </p>
            <button
              type="button"
              className="totem-btn totem-btn-primario"
              onClick={reiniciar}
            >
              Novo pedido
            </button>
          </div>
        ) : null}
      </div>
    </AppPageHeader>
  );
}
