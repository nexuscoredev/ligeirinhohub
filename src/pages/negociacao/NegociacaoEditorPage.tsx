import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppPageHeader } from '@/components/AppPageHeader';
import { usePerfil } from '@/contexts/PerfilContext';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { listarProdutosLoja } from '@/lib/catalogo/listarProdutosLoja';
import type { ProdutoCatalogoView } from '@/lib/catalogo/types';
import {
  adicionarItemNegociacaoPorSku,
  atualizarNegociacao,
  buscarNegociacao,
  criarNegociacao,
  finalizarNegociacao,
  listarOperacoesFiscais,
  listarTabelasPreco,
  listarVendedores,
  removerItemNegociacao,
} from '@/lib/negociacao/api';
import { listarClientes as listarClientesPedidos } from '@/lib/pedidos/api';
import { formatarMoeda } from '@/lib/pedidos/constants';
import {
  TIPO_DOCUMENTO_LABEL,
  TIPOS_DOCUMENTO,
  totalNegociacao,
  type GfTipoDocumento,
  type NegociacaoCabecalho,
  type NegociacaoItem,
} from '@/types/negociacao';
import type { Cliente } from '@/types/pedidos';
import './negociacao.css';

export function NegociacaoEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = usePerfil();
  const isNova = !id || id === 'nova';

  const app = appPorId('operacional');
  const item = app ? itemAppPorRota(app, '/negociacao') : null;

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [operacoes, setOperacoes] = useState<Awaited<ReturnType<typeof listarOperacoesFiscais>>['operacoes']>([]);
  const [tabelas, setTabelas] = useState<Awaited<ReturnType<typeof listarTabelasPreco>>['tabelas']>([]);
  const [vendedores, setVendedores] = useState<{ id: string; nome: string; nome_fantasia: string | null }[]>([]);
  const [produtos, setProdutos] = useState<ProdutoCatalogoView[]>([]);

  const [negociacao, setNegociacao] = useState<NegociacaoCabecalho | null>(null);
  const [itens, setItens] = useState<NegociacaoItem[]>([]);

  const [clienteId, setClienteId] = useState('');
  const [operacaoId, setOperacaoId] = useState('');
  const [vendedorId, setVendedorId] = useState('');
  const [tabelaId, setTabelaId] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<GfTipoDocumento>('orcamento');
  const [desconto, setDesconto] = useState(0);
  const [frete, setFrete] = useState(0);
  const [observacoes, setObservacoes] = useState('');

  const [buscaProduto, setBuscaProduto] = useState('');
  const [qtyNova, setQtyNova] = useState(1);
  const [produtoSku, setProdutoSku] = useState('');

  const [carregando, setCarregando] = useState(!isNova);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const pedidoId = negociacao?.id;
  const editavel = negociacao ? ['orcamento', 'aguardando_separacao'].includes(negociacao.status) : isNova;

  useEffect(() => {
    void Promise.all([
      listarClientesPedidos().then(({ clientes: c }) => setClientes(c)),
      listarOperacoesFiscais().then(({ operacoes: o }) => {
        setOperacoes(o);
        if (o[0] && !operacaoId) setOperacaoId(o[0].id);
      }),
      listarTabelasPreco().then(({ tabelas: t }) => {
        setTabelas(t);
        const padrao = t.find((x) => x.padrao) ?? t[0];
        if (padrao && !tabelaId) setTabelaId(padrao.id);
      }),
      listarVendedores().then(({ vendedores: v }) => setVendedores(v as typeof vendedores)),
      listarProdutosLoja().then(({ produtos: p }) => setProdutos(p)),
    ]);
  }, []);

  const carregarNegociacao = useCallback(async () => {
    if (!id || id === 'nova') return;
    setCarregando(true);
    const { negociacao: cab, itens: linhas, error } = await buscarNegociacao(id);
    if (error || !cab) {
      setErro(error?.message ?? 'Negociação não encontrada.');
      setCarregando(false);
      return;
    }
    setNegociacao(cab);
    setItens(linhas);
    setClienteId(cab.cliente_id);
    setOperacaoId(cab.operacao_fiscal_id ?? '');
    setVendedorId(cab.vendedor_id ?? '');
    setTabelaId(cab.tabela_preco_id ?? '');
    setTipoDocumento(cab.tipo_documento ?? 'orcamento');
    setDesconto(cab.desconto_total);
    setFrete(cab.frete_valor);
    setObservacoes(cab.observacoes ?? '');
    setErro(null);
    setCarregando(false);
  }, [id]);

  useEffect(() => {
    void carregarNegociacao();
  }, [carregarNegociacao]);

  const produtosFiltrados = useMemo(() => {
    const q = buscaProduto.trim().toLowerCase();
    if (!q) return produtos.slice(0, 40);
    return produtos
      .filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [produtos, buscaProduto]);

  const total = useMemo(
    () => totalNegociacao(itens, desconto, frete),
    [itens, desconto, frete],
  );

  async function iniciarNegociacao(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario || !clienteId || !operacaoId) return;
    setSalvando(true);
    setErro(null);
    const { negociacao: criada, error } = await criarNegociacao({
      clienteId,
      operacaoFiscalId: operacaoId,
      vendedorId: vendedorId || null,
      tabelaPrecoId: tabelaId || null,
      tipoDocumento,
      observacoes,
      usuarioId: usuario.id,
    });
    setSalvando(false);
    if (error || !criada) {
      setErro(error?.message ?? 'Erro ao criar negociação.');
      return;
    }
    navigate(`/negociacao/${criada.id}`, { replace: true });
  }

  async function gravarCabecalho() {
    if (!pedidoId) return;
    setSalvando(true);
    setMsg(null);
    const { error } = await atualizarNegociacao(pedidoId, {
      operacaoFiscalId: operacaoId,
      vendedorId: vendedorId || null,
      tabelaPrecoId: tabelaId || null,
      tipoDocumento,
      descontoTotal: desconto,
      freteValor: frete,
      observacoes: observacoes || null,
    });
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setMsg('Negociação gravada.');
    void carregarNegociacao();
  }

  async function incluirItem() {
    const { ensureProdutosPorSkus } = await import('@/lib/catalogo/ensureProdutos');
    if (!pedidoId || !produtoSku || qtyNova <= 0) return;
    setSalvando(true);
    const prep = await ensureProdutosPorSkus([produtoSku]);
    if (prep.error) {
      setErro(prep.error.message);
      setSalvando(false);
      return;
    }
    const { error } = await adicionarItemNegociacaoPorSku({
      pedidoId,
      sku: produtoSku,
      qty: qtyNova,
      tabelaPrecoId: tabelaId || null,
    });
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setProdutoSku('');
    setQtyNova(1);
    void carregarNegociacao();
  }

  async function excluirItem(itemId: string) {
    if (!pedidoId) return;
    const { error } = await removerItemNegociacao(itemId, pedidoId);
    if (error) setErro(error.message);
    else void carregarNegociacao();
  }

  async function finalizar() {
    if (!pedidoId || !usuario) return;
    setSalvando(true);
    await gravarCabecalho();
    const { error } = await finalizarNegociacao(pedidoId, usuario.id);
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setMsg('Negociação finalizada.');
    void carregarNegociacao();
  }

  if (!app || !item) return null;

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo={isNova ? 'Nova negociação' : `Negociação #${negociacao?.numero ?? '…'}`}
      subtitulo="Operação, cliente, vendedor, tabela de preço e itens."
    >
      <div className="neg-topo-acoes">
        <Link to="/negociacao" className="neg-btn-secundario">
          ← Lista
        </Link>
      </div>

      {erro ? (
        <p className="neg-erro" role="alert">
          {erro}
        </p>
      ) : null}
      {msg ? (
        <p className="neg-ok" role="status">
          {msg}
        </p>
      ) : null}

      {carregando ? <p className="neg-loading">Carregando…</p> : null}

      {isNova && !carregando ? (
        <form className="card neg-form-cab" onSubmit={(e) => void iniciarNegociacao(e)}>
          <h2>Cabeçalho</h2>
          <div className="neg-form-grid">
            <label>
              Operação
              <select value={operacaoId} onChange={(e) => setOperacaoId(e.target.value)} required>
                {operacoes.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.descricao}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Cliente
              <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
                <option value="">Selecione…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome_fantasia ?? c.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Vendedor
              <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
                <option value="">—</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome_fantasia ?? v.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tabela de preço
              <select value={tabelaId} onChange={(e) => setTabelaId(e.target.value)}>
                {tabelas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo documento
              <select
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value as GfTipoDocumento)}
              >
                {TIPOS_DOCUMENTO.map((t) => (
                  <option key={t} value={t}>
                    {TIPO_DOCUMENTO_LABEL[t]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="neg-field-full">
            Observações
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
            />
          </label>
          <button type="submit" className="neg-btn-primario" disabled={salvando}>
            Criar e adicionar itens
          </button>
        </form>
      ) : null}

      {!isNova && !carregando && negociacao ? (
        <>
          <div className="card neg-form-cab">
            <h2>Cabeçalho</h2>
            <div className="neg-form-grid">
              <label>
                Operação
                <select
                  value={operacaoId}
                  onChange={(e) => setOperacaoId(e.target.value)}
                  disabled={!editavel}
                >
                  {operacoes.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.descricao}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Cliente
                <input
                  value={negociacao.clientes?.nome_fantasia ?? negociacao.clientes?.nome ?? ''}
                  disabled
                />
              </label>
              <label>
                Vendedor
                <select
                  value={vendedorId}
                  onChange={(e) => setVendedorId(e.target.value)}
                  disabled={!editavel}
                >
                  <option value="">—</option>
                  {vendedores.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nome_fantasia ?? v.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tabela de preço
                <select
                  value={tabelaId}
                  onChange={(e) => setTabelaId(e.target.value)}
                  disabled={!editavel}
                >
                  {tabelas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tipo documento
                <select
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value as GfTipoDocumento)}
                  disabled={!editavel}
                >
                  {TIPOS_DOCUMENTO.map((t) => (
                    <option key={t} value={t}>
                      {TIPO_DOCUMENTO_LABEL[t]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Desconto (R$)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={desconto}
                  onChange={(e) => setDesconto(Number(e.target.value) || 0)}
                  disabled={!editavel}
                />
              </label>
              <label>
                Frete (R$)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={frete}
                  onChange={(e) => setFrete(Number(e.target.value) || 0)}
                  disabled={!editavel}
                />
              </label>
            </div>
            {editavel ? (
              <div className="neg-acoes-topo">
                <button
                  type="button"
                  className="neg-btn-secundario"
                  onClick={() => void gravarCabecalho()}
                  disabled={salvando}
                >
                  Gravar
                </button>
                <button
                  type="button"
                  className="neg-btn-finalizar"
                  onClick={() => void finalizar()}
                  disabled={salvando}
                >
                  Finalizar
                </button>
              </div>
            ) : null}
          </div>

          <div className="card neg-itens">
            <h2>Itens</h2>
            {editavel ? (
              <div className="neg-add-item">
                <input
                  placeholder="Buscar produto…"
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                />
                <select value={produtoSku} onChange={(e) => setProdutoSku(e.target.value)}>
                  <option value="">Produto…</option>
                  {produtosFiltrados.map((p) => (
                    <option key={p.sku} value={p.sku}>
                      {p.sku} — {p.nome}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0.001}
                  step={1}
                  value={qtyNova}
                  onChange={(e) => setQtyNova(Number(e.target.value) || 1)}
                  aria-label="Quantidade"
                />
                <button
                  type="button"
                  className="neg-btn-primario"
                  onClick={() => void incluirItem()}
                  disabled={!produtoSku || salvando}
                >
                  Incluir
                </button>
              </div>
            ) : null}

            <table className="neg-tabela">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th>Qtd</th>
                  <th>Unit.</th>
                  <th>Total</th>
                  {editavel ? <th /> : null}
                </tr>
              </thead>
              <tbody>
                {itens.length === 0 ? (
                  <tr>
                    <td colSpan={editavel ? 6 : 5} className="neg-vazio">
                      Nenhum item adicionado
                    </td>
                  </tr>
                ) : (
                  itens.map((i) => (
                    <tr key={i.id}>
                      <td>{i.produtos?.sku ?? '—'}</td>
                      <td>{i.nome_snapshot}</td>
                      <td>{i.qty_pedida}</td>
                      <td>{formatarMoeda(i.preco_unitario)}</td>
                      <td>{formatarMoeda(i.qty_pedida * i.preco_unitario)}</td>
                      {editavel ? (
                        <td>
                          <button
                            type="button"
                            className="neg-btn-link"
                            onClick={() => void excluirItem(i.id)}
                          >
                            Remover
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <footer className="neg-totais">
              <span>Subtotal itens: {formatarMoeda(negociacao.valor_pedido)}</span>
              <strong>Total geral: {formatarMoeda(total)}</strong>
            </footer>
          </div>
        </>
      ) : null}
    </AppPageHeader>
  );
}
