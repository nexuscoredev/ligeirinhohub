import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppPageHeader } from '@/components/AppPageHeader';
import { usePerfil } from '@/contexts/PerfilContext';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { formatarMoeda } from '@/lib/pedidos/constants';
import {
  abrirCaixa,
  apurarTurno,
  buscarTurnoAberto,
  fecharCaixa,
  registrarMovimento,
} from '@/lib/pdv/caixa';
import { emitirNfce, type ResultadoFiscal } from '@/lib/pdv/fiscal';
import { listarProdutosPdv, registrarVendaPdv, type LinhaCarrinhoBalcao } from '@/lib/pdv/api';
import { useAtalhos, type AtalhoPdv } from '@/lib/pdv/useAtalhos';
import { abrirGaveta, cancelarOperacaoTef } from '@/lib/pdv/tef';
import type { CaixaTurno, LinhaVenda, ProdutoPdv } from '@/lib/pdv/types';
import type { PagamentoSplitLinha } from '@/types/pedidos';
import { PdvAjuda } from './components/PdvAjuda';
import { PdvBarraTotais } from './components/PdvBarraTotais';
import {
  PdvAbrirCaixaModal,
  PdvFecharCaixaModal,
  PdvMovimentoModal,
} from './components/PdvCaixaModais';
import { PdvCodigoInput } from './components/PdvCodigoInput';
import { PdvConsultaProdutos } from './components/PdvConsultaProdutos';
import { PdvCupom } from './components/PdvCupom';
import { PdvFuncoesMenu, type FuncaoPdv } from './components/PdvFuncoesMenu';
import { PdvItensGrid } from './components/PdvItensGrid';
import { PdvNotasEmitidas } from './components/PdvNotasEmitidas';
import { PdvOperacoesMenu, type OperacaoPdv } from './components/PdvOperacoesMenu';
import { PdvPagamentoModal } from './components/PdvPagamentoModal';
import { PdvResumoDiario } from './components/PdvResumoDiario';
import { PdvStatusBar } from './components/PdvStatusBar';
import './pdv.css';

type Overlay =
  | { tipo: 'operacoes' }
  | { tipo: 'funcoes' }
  | { tipo: 'consulta' }
  | { tipo: 'ajuda' }
  | { tipo: 'notas' }
  | { tipo: 'pagamento'; modo: 'dinheiro' | 'outras' }
  | { tipo: 'resumo'; modo: 'leitura_x' | 'resumo_diario' }
  | { tipo: 'abrir_caixa' }
  | { tipo: 'sangria' }
  | { tipo: 'suprimento' }
  | { tipo: 'fechar_caixa'; valorApurado: number }
  | {
      tipo: 'cupom';
      numero: number;
      linhas: LinhaVenda[];
      total: number;
      pagamento: PagamentoSplitLinha[];
      troco: number;
      fiscal: ResultadoFiscal | null;
    }
  | null;

const CAIXA_NUMERO = Number(import.meta.env.VITE_PDV_CAIXA_NUMERO ?? '1') || 1;

export function PdvPage() {
  const app = appPorId('pdv');
  const { usuario, sair } = usePerfil();

  const [produtos, setProdutos] = useState<ProdutoPdv[]>([]);
  const [linhas, setLinhas] = useState<LinhaVenda[]>([]);
  const [seq, setSeq] = useState(1);
  const [ultimaSeq, setUltimaSeq] = useState<number | null>(null);
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [precoAtacado, setPrecoAtacado] = useState(false);
  const [cpfConsumidor, setCpfConsumidor] = useState<string | null>(null);
  const [turno, setTurno] = useState<CaixaTurno | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'erro' | 'ok' | 'info'; texto: string } | null>(
    null,
  );

  const codigoRef = useRef<HTMLInputElement>(null);

  // Índice de produtos por código de barras e SKU.
  const indexProdutos = useMemo(() => {
    const map = new Map<string, ProdutoPdv>();
    for (const p of produtos) {
      if (p.codigo_barras) map.set(p.codigo_barras.trim().toLowerCase(), p);
      if (p.sku) map.set(p.sku.trim().toLowerCase(), p);
    }
    return map;
  }, [produtos]);

  const total = useMemo(
    () => linhas.reduce((acc, l) => acc + l.preco_unitario * l.qty, 0),
    [linhas],
  );
  const ultimaLinha = useMemo(
    () => linhas.find((l) => l.seq === ultimaSeq) ?? linhas[linhas.length - 1] ?? null,
    [linhas, ultimaSeq],
  );

  const caixaAberto = Boolean(turno);

  const focarCodigo = useCallback(() => {
    window.setTimeout(() => codigoRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    void listarProdutosPdv().then(({ produtos: lista, error }) => {
      if (error) setMensagem({ tipo: 'erro', texto: error.message });
      setProdutos(lista);
    });
  }, []);

  useEffect(() => {
    if (!usuario) return;
    void buscarTurnoAberto(usuario.id).then(({ turno: t }) => setTurno(t));
  }, [usuario]);

  const precoDe = useCallback(
    (p: ProdutoPdv) =>
      precoAtacado && p.preco_atacado != null ? p.preco_atacado : p.preco_base,
    [precoAtacado],
  );

  const adicionarProduto = useCallback(
    (p: ProdutoPdv, qty: number) => {
      if (!caixaAberto) {
        setMensagem({ tipo: 'erro', texto: 'Abra o caixa antes de iniciar uma venda.' });
        return;
      }
      const preco = precoDe(p);
      setLinhas((prev) => {
        const idx = prev.findIndex((l) => l.sku === p.sku);
        if (idx >= 0) {
          const alvo = prev[idx];
          setUltimaSeq(alvo.seq);
          setSelecionada(alvo.seq);
          return prev.map((l, n) =>
            n === idx ? { ...l, qty: l.qty + qty, preco_unitario: preco } : l,
          );
        }
        const novaSeq = seq;
        setSeq((s) => s + 1);
        setUltimaSeq(novaSeq);
        setSelecionada(novaSeq);
        return [
          ...prev,
          {
            seq: novaSeq,
            sku: p.sku,
            codigo: p.codigo_barras ?? p.sku,
            produto_id: p.id,
            descricao: p.nome,
            unidade: p.unidade,
            preco_unitario: preco,
            categoria_ordem: p.categoria_ordem,
            qty,
          },
        ];
      });
      setMensagem(null);
    },
    [caixaAberto, precoDe, seq],
  );

  const adicionarPorCodigo = useCallback(
    (codigo: string, qty: number) => {
      const p = indexProdutos.get(codigo.trim().toLowerCase());
      if (!p) {
        setMensagem({ tipo: 'erro', texto: `Código "${codigo}" não encontrado no catálogo.` });
        return;
      }
      adicionarProduto(p, qty);
    },
    [indexProdutos, adicionarProduto],
  );

  function cancelarItemSelecionado() {
    const alvo = selecionada ?? ultimaSeq;
    if (alvo == null) {
      setMensagem({ tipo: 'info', texto: 'Nenhum item selecionado para cancelar.' });
      return;
    }
    setLinhas((prev) => prev.filter((l) => l.seq !== alvo));
    setSelecionada(null);
    setMensagem({ tipo: 'info', texto: `Item ${String(alvo).padStart(3, '0')} cancelado.` });
  }

  function cancelarVenda() {
    setLinhas([]);
    setSelecionada(null);
    setUltimaSeq(null);
    setCpfConsumidor(null);
    setMensagem({ tipo: 'info', texto: 'Venda cancelada.' });
  }

  function togglePrecoAtacado() {
    setPrecoAtacado((ativo) => {
      const novo = !ativo;
      // Recalcula linhas existentes com o novo modo de preço.
      setLinhas((prev) =>
        prev.map((l) => {
          const p = produtos.find((x) => x.sku === l.sku);
          if (!p) return l;
          const preco = novo && p.preco_atacado != null ? p.preco_atacado : p.preco_base;
          return { ...l, preco_unitario: preco };
        }),
      );
      setMensagem({
        tipo: 'info',
        texto: novo ? 'Preço de atacado ativado.' : 'Preço de varejo ativado.',
      });
      return novo;
    });
  }

  function informarCpf() {
    const atual = cpfConsumidor ?? '';
    const v = window.prompt('CPF do consumidor (somente números):', atual);
    if (v === null) return;
    const limpo = v.replace(/\D/g, '');
    if (limpo && limpo.length !== 11) {
      setMensagem({ tipo: 'erro', texto: 'CPF inválido — informe 11 dígitos.' });
      return;
    }
    setCpfConsumidor(limpo || null);
    setMensagem({
      tipo: 'info',
      texto: limpo ? `CPF ${limpo} vinculado à venda.` : 'CPF removido da venda.',
    });
  }

  function abrirPagamento(modo: 'dinheiro' | 'outras') {
    if (!caixaAberto) {
      setMensagem({ tipo: 'erro', texto: 'Abra o caixa antes de finalizar uma venda.' });
      return;
    }
    if (linhas.length === 0) {
      setMensagem({ tipo: 'erro', texto: 'Adicione itens antes de finalizar.' });
      return;
    }
    setOverlay({ tipo: 'pagamento', modo });
  }

  async function confirmarPagamento(split: PagamentoSplitLinha[], emitir: boolean) {
    if (!usuario || !turno) return;
    setEnviando(true);
    setMensagem(null);

    const itensVenda: LinhaCarrinhoBalcao[] = linhas.map((l) => ({
      sku: l.sku,
      nome: l.descricao,
      preco_unitario: l.preco_unitario,
      categoria_ordem: l.categoria_ordem,
      qty: l.qty,
    }));

    const { pedido, error } = await registrarVendaPdv({
      itens: itensVenda,
      pagamento: split,
      usuarioId: usuario.id,
      caixaTurnoId: turno.id,
      cpfConsumidor,
    });

    if (error || !pedido) {
      setEnviando(false);
      setMensagem({ tipo: 'erro', texto: error?.message ?? 'Falha ao registrar venda.' });
      return;
    }

    let fiscal: ResultadoFiscal | null = null;
    if (emitir) {
      const r = await emitirNfce(pedido.id);
      fiscal = r.resultado;
    }

    const somaPaga = split.reduce((acc, l) => acc + l.valor, 0);
    const troco = somaPaga > Number(pedido.valor_pedido)
      ? Math.round((somaPaga - Number(pedido.valor_pedido)) * 100) / 100
      : 0;

    const linhasVenda = linhas;
    const totalVenda = total;

    setEnviando(false);
    setOverlay({
      tipo: 'cupom',
      numero: pedido.numero,
      linhas: linhasVenda,
      total: totalVenda,
      pagamento: split,
      troco,
      fiscal,
    });

    // Limpa a venda atual.
    setLinhas([]);
    setSelecionada(null);
    setUltimaSeq(null);
    setCpfConsumidor(null);
    setMensagem({
      tipo: 'ok',
      texto:
        fiscal && fiscal.status !== 'autorizada'
          ? `Venda #${pedido.numero} registrada. NFC-e: ${fiscal.mensagem ?? fiscal.status}.`
          : `Venda #${pedido.numero} concluída.`,
    });
  }

  async function abrirCaixaHandler(valorAbertura: number) {
    if (!usuario) return;
    setEnviando(true);
    const { turno: t, error } = await abrirCaixa(usuario.id, CAIXA_NUMERO, valorAbertura);
    setEnviando(false);
    if (error || !t) {
      setMensagem({ tipo: 'erro', texto: error?.message ?? 'Falha ao abrir o caixa.' });
      return;
    }
    setTurno(t);
    setOverlay(null);
    setMensagem({ tipo: 'ok', texto: 'Caixa aberto.' });
    focarCodigo();
  }

  async function registrarMovimentoHandler(
    tipo: 'sangria' | 'suprimento',
    valor: number,
    motivo: string,
  ) {
    if (!usuario || !turno) return;
    setEnviando(true);
    const { error } = await registrarMovimento(turno.id, tipo, valor, motivo, usuario.id);
    setEnviando(false);
    if (error) {
      setMensagem({ tipo: 'erro', texto: error.message });
      return;
    }
    setOverlay(null);
    setMensagem({
      tipo: 'ok',
      texto: `${tipo === 'sangria' ? 'Sangria' : 'Suprimento'} de ${formatarMoeda(valor)} registrado.`,
    });
    focarCodigo();
  }

  async function abrirFecharCaixa() {
    if (!turno) return;
    const { apuracao } = await apurarTurno(turno.id);
    setOverlay({ tipo: 'fechar_caixa', valorApurado: apuracao.saldoDinheiro });
  }

  async function fecharCaixaHandler(valorInformado: number, observacoes: string) {
    if (!usuario || !turno) return;
    setEnviando(true);
    const { apuracao } = await apurarTurno(turno.id);
    const { error } = await fecharCaixa(
      turno.id,
      valorInformado,
      apuracao.saldoDinheiro,
      observacoes,
      usuario.id,
    );
    setEnviando(false);
    if (error) {
      setMensagem({ tipo: 'erro', texto: error.message });
      return;
    }
    setTurno(null);
    setOverlay(null);
    setMensagem({ tipo: 'ok', texto: 'Caixa fechado.' });
  }

  function executarOperacao(acao: OperacaoPdv) {
    switch (acao) {
      case 'cancelar_itens':
        setOverlay(null);
        cancelarItemSelecionado();
        break;
      case 'cancelar_venda':
        setOverlay(null);
        cancelarVenda();
        break;
      case 'retiradas':
        setOverlay({ tipo: 'sangria' });
        break;
      case 'entradas':
        setOverlay({ tipo: 'suprimento' });
        break;
      case 'funcoes':
        setOverlay({ tipo: 'funcoes' });
        break;
      case 'leitura_x':
        if (turno) setOverlay({ tipo: 'resumo', modo: 'leitura_x' });
        else setMensagem({ tipo: 'erro', texto: 'Abra o caixa para a Leitura X.' });
        break;
      case 'resumo_diario':
        if (turno) setOverlay({ tipo: 'resumo', modo: 'resumo_diario' });
        else setMensagem({ tipo: 'erro', texto: 'Abra o caixa para o Resumo Diário.' });
        break;
      case 'notas_emitidas':
      case 'ver_cupons':
        setOverlay({ tipo: 'notas' });
        break;
      case 'tabela_precos':
        setOverlay({ tipo: 'consulta' });
        break;
      case 'sair':
        void sair();
        break;
      default:
        setOverlay(null);
        setMensagem({ tipo: 'info', texto: 'Operação ainda não disponível neste PDV.' });
    }
  }

  async function executarFuncao(acao: FuncaoPdv) {
    switch (acao) {
      case 'abrir_gaveta': {
        const r = await abrirGaveta();
        setOverlay(null);
        setMensagem({ tipo: r.ok ? 'ok' : 'info', texto: r.mensagem });
        break;
      }
      case 'preco_atacado':
        setOverlay(null);
        togglePrecoAtacado();
        break;
      case 'cancelar_tef': {
        const r = await cancelarOperacaoTef();
        setOverlay(null);
        setMensagem({ tipo: r.ok ? 'ok' : 'erro', texto: r.mensagem });
        break;
      }
      default:
        setOverlay(null);
        setMensagem({ tipo: 'info', texto: 'Função ainda não disponível neste PDV.' });
    }
  }

  const onAtalho = useCallback(
    (atalho: AtalhoPdv) => {
      switch (atalho) {
        case 'esc':
          setOverlay(null);
          focarCodigo();
          break;
        case 'ajuda':
          setOverlay({ tipo: 'ajuda' });
          break;
        case 'consulta':
          setOverlay({ tipo: 'consulta' });
          break;
        case 'operacoes':
          setOverlay({ tipo: 'operacoes' });
          break;
        case 'notas':
          setOverlay({ tipo: 'notas' });
          break;
        case 'finalizar_dinheiro':
          abrirPagamento('dinheiro');
          break;
        case 'finalizar_outras':
          abrirPagamento('outras');
          break;
        case 'cpf':
          informarCpf();
          break;
        case 'pausar':
        case 'pausar_entrega':
          setMensagem({ tipo: 'info', texto: 'Pausar venda/entrega ainda não disponível.' });
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focarCodigo, caixaAberto, linhas.length, cpfConsumidor],
  );

  useAtalhos({ onAtalho });

  if (!app || !usuario) return null;
  const item = itemAppPorRota(app, '/pdv');

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Frente de caixa"
      subtitulo="Venda no balcão com leitor, atalhos e NFC-e."
    >
      <div className="pdv-shell">
        {!caixaAberto ? (
          <div className="pdv-caixa-fechado">
            <p>O caixa está fechado. Abra o caixa para iniciar as vendas.</p>
            <button
              type="button"
              className="pdv-btn-primario"
              onClick={() => setOverlay({ tipo: 'abrir_caixa' })}
            >
              Abrir caixa
            </button>
          </div>
        ) : null}

        {mensagem ? (
          <p className={`pdv-mensagem pdv-mensagem--${mensagem.tipo}`} role="status">
            {mensagem.texto}
          </p>
        ) : null}

        <div className="pdv-toolbar">
          <button
            type="button"
            className="pdv-toolbar-btn"
            onClick={() => setOverlay({ tipo: 'operacoes' })}
          >
            Operações <kbd>F5</kbd>
          </button>
          <button
            type="button"
            className="pdv-toolbar-btn"
            onClick={() => setOverlay({ tipo: 'consulta' })}
          >
            Consulta <kbd>F2</kbd>
          </button>
          <button
            type="button"
            className="pdv-toolbar-btn"
            onClick={() => setOverlay({ tipo: 'notas' })}
          >
            Notas <kbd>F11</kbd>
          </button>
          <button
            type="button"
            className="pdv-toolbar-btn"
            onClick={() => setOverlay({ tipo: 'ajuda' })}
          >
            Ajuda <kbd>F1</kbd>
          </button>
          {precoAtacado ? <span className="pdv-tag-atacado">ATACADO</span> : null}
          {cpfConsumidor ? (
            <span className="pdv-tag-cpf">CPF {cpfConsumidor}</span>
          ) : null}
          <div className="pdv-toolbar-spacer" />
          {caixaAberto ? (
            <button type="button" className="pdv-toolbar-btn" onClick={() => void abrirFecharCaixa()}>
              Fechar caixa
            </button>
          ) : null}
        </div>

        <PdvItensGrid linhas={linhas} selecionada={selecionada} onSelecionar={setSelecionada} />

        <PdvBarraTotais ultimaLinha={ultimaLinha} total={total} />

        <PdvCodigoInput
          ref={codigoRef}
          disabled={!caixaAberto}
          onAdicionar={adicionarPorCodigo}
          onConsulta={() => setOverlay({ tipo: 'consulta' })}
        />

        <div className="pdv-finalizar">
          <button
            type="button"
            className="pdv-btn-primario"
            disabled={!caixaAberto || linhas.length === 0}
            onClick={() => abrirPagamento('dinheiro')}
          >
            Finalizar — Dinheiro <kbd>F3</kbd>
          </button>
          <button
            type="button"
            className="pdv-btn-secundario"
            disabled={!caixaAberto || linhas.length === 0}
            onClick={() => abrirPagamento('outras')}
          >
            Outras formas <kbd>F4</kbd>
          </button>
        </div>

        <PdvStatusBar
          caixaNumero={turno?.caixa_numero ?? CAIXA_NUMERO}
          operador={usuario.nome}
          caixaAberto={caixaAberto}
        />
      </div>

      {overlay?.tipo === 'operacoes' ? (
        <PdvOperacoesMenu onSelecionar={executarOperacao} onFechar={() => setOverlay(null)} />
      ) : null}
      {overlay?.tipo === 'funcoes' ? (
        <PdvFuncoesMenu
          precoAtacadoAtivo={precoAtacado}
          onSelecionar={(a) => void executarFuncao(a)}
          onFechar={() => setOverlay(null)}
        />
      ) : null}
      {overlay?.tipo === 'consulta' ? (
        <PdvConsultaProdutos
          produtos={produtos}
          precoAtacado={precoAtacado}
          onSelecionar={(p) => {
            adicionarProduto(p, 1);
            setOverlay(null);
            focarCodigo();
          }}
          onFechar={() => setOverlay(null)}
        />
      ) : null}
      {overlay?.tipo === 'ajuda' ? <PdvAjuda onFechar={() => setOverlay(null)} /> : null}
      {overlay?.tipo === 'notas' ? <PdvNotasEmitidas onFechar={() => setOverlay(null)} /> : null}
      {overlay?.tipo === 'pagamento' ? (
        <PdvPagamentoModal
          total={total}
          modo={overlay.modo}
          cpfConsumidor={cpfConsumidor}
          enviando={enviando}
          onConfirmar={(split, emitir) => void confirmarPagamento(split, emitir)}
          onFechar={() => setOverlay(null)}
        />
      ) : null}
      {overlay?.tipo === 'resumo' && turno ? (
        <PdvResumoDiario turno={turno} modo={overlay.modo} onFechar={() => setOverlay(null)} />
      ) : null}
      {overlay?.tipo === 'abrir_caixa' ? (
        <PdvAbrirCaixaModal
          enviando={enviando}
          onAbrir={(v) => void abrirCaixaHandler(v)}
          onFechar={() => setOverlay(null)}
        />
      ) : null}
      {overlay?.tipo === 'sangria' ? (
        <PdvMovimentoModal
          tipo="sangria"
          enviando={enviando}
          onRegistrar={(v, m) => void registrarMovimentoHandler('sangria', v, m)}
          onFechar={() => setOverlay(null)}
        />
      ) : null}
      {overlay?.tipo === 'suprimento' ? (
        <PdvMovimentoModal
          tipo="suprimento"
          enviando={enviando}
          onRegistrar={(v, m) => void registrarMovimentoHandler('suprimento', v, m)}
          onFechar={() => setOverlay(null)}
        />
      ) : null}
      {overlay?.tipo === 'fechar_caixa' ? (
        <PdvFecharCaixaModal
          valorApurado={overlay.valorApurado}
          enviando={enviando}
          onFecharCaixa={(v, o) => void fecharCaixaHandler(v, o)}
          onFechar={() => setOverlay(null)}
        />
      ) : null}
      {overlay?.tipo === 'cupom' ? (
        <PdvCupom
          numero={overlay.numero}
          linhas={overlay.linhas}
          total={overlay.total}
          pagamento={overlay.pagamento}
          troco={overlay.troco}
          fiscal={overlay.fiscal}
          onFechar={() => {
            setOverlay(null);
            focarCodigo();
          }}
        />
      ) : null}
    </AppPageHeader>
  );
}
