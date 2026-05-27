import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppPageHeader } from '@/components/AppPageHeader';
import { PageShell } from '@/components/PageShell';
import { usePerfil } from '@/contexts/PerfilContext';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import {
  buscarPedidoCompleto,
  concluirSeparacao,
  iniciarSeparacao,
  pausarSeparacao,
  retomarSeparacao,
  atualizarQtyItemSeparado,
  atualizarStatusItemSeparado,
  registrarObservacaoSeparacao,
} from '@/lib/pedidos/api';
import { formatarMoeda, STATUS_LABEL } from '@/lib/pedidos/constants';
import {
  statusItemFromRow,
  todosItensComStatusDefinido,
  valorItemSeparado,
} from '@/lib/pedidos/itemStatusSeparacao';
import { agruparItensPorCategoria } from '@/lib/pedidos/ordenarItens';
import { podeSeparar } from '@/lib/pedidos/permissoes';
import type { ItemStatusSeparacao, Pedido, PedidoItem } from '@/types/pedidos';
import { ItemStatusPicker } from '@/pages/operacional/ItemStatusPicker';
import './operacional.css';

export function SeparacaoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = usePerfil();
  const app = appPorId('operacional');

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [itens, setItens] = useState<PedidoItem[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [qtyEdit, setQtyEdit] = useState<Record<string, string>>({});

  const carregar = useCallback(async () => {
    if (!id) return;
    const res = await buscarPedidoCompleto(id);
    if (res.error || !res.pedido) {
      setErro(res.error?.message ?? 'Pedido não encontrado');
      return;
    }
    setPedido(res.pedido);
    setItens(res.itens);
    setErro(null);
  }, [id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (!app || !usuario) return null;

  const usuarioId = usuario.id;
  const item = itemAppPorRota(app, '/operacional');

  const emSeparacao =
    pedido?.status === 'em_separacao' || pedido?.status === 'separacao_pausada';
  const podeOperar = podeSeparar(usuario.cargo) && emSeparacao;
  const grupos = agruparItensPorCategoria(itens);

  const totalSeparado = itens.reduce((s, i) => s + valorItemSeparado(i), 0);

  const itensFaltantes = useMemo(() => {
    return itens
      .map((i) => {
        const separada =
          i.qty_separada === null || i.qty_separada === undefined
            ? null
            : Number(i.qty_separada);
        if (separada === null) return null;
        const pedida = Number(i.qty_pedida);
        const faltou = Math.max(0, pedida - separada);
        if (faltou <= 0) return null;
        return {
          sku: i.produtos?.sku ?? null,
          nome: i.nome_snapshot,
          pedida,
          separada,
          faltou,
        };
      })
      .filter(Boolean) as Array<{
      sku?: string | null;
      nome: string;
      pedida: number;
      separada: number;
      faltou: number;
    }>;
  }, [itens]);

  async function handleIniciar() {
    if (!id) return;
    setSalvando(true);
    const { error } = await iniciarSeparacao(id, usuarioId);
    setSalvando(false);
    if (error) setErro(error.message);
    else void carregar();
  }

  async function handlePausar() {
    if (!id) return;
    setSalvando(true);
    const { error } = await pausarSeparacao(id, usuarioId);
    setSalvando(false);
    if (error) setErro(error.message);
    else void carregar();
  }

  async function handleRetomar() {
    if (!id) return;
    setSalvando(true);
    const { error } = await retomarSeparacao(id, usuarioId);
    setSalvando(false);
    if (error) setErro(error.message);
    else void carregar();
  }

  async function handleStatus(item: PedidoItem, status: ItemStatusSeparacao) {
    if (!id || !podeOperar) return;
    setSalvando(true);
    const { error } = await atualizarStatusItemSeparado(item, status, id);
    setSalvando(false);
    if (error) setErro(error.message);
    else void carregar();
  }

  async function handleQtyBlur(item: PedidoItem) {
    if (!id || !podeOperar) return;
    const raw = qtyEdit[item.id];
    if (raw == null || raw.trim() === '') return;
    const n = Number(raw.replace(',', '.'));
    if (Number.isNaN(n)) {
      setErro('Quantidade separada inválida.');
      return;
    }
    setSalvando(true);
    const { error } = await atualizarQtyItemSeparado(
      { id: item.id, qty_pedida: item.qty_pedida },
      Math.trunc(n),
      id,
    );
    setSalvando(false);
    if (error) setErro(error.message);
    else {
      setErro(null);
      void carregar();
    }
  }

  async function handleSalvarObservacao() {
    if (!id) return;
    if (!observacao.trim()) return;
    setSalvando(true);
    const { error } = await registrarObservacaoSeparacao({
      pedidoId: id,
      usuarioId,
      observacao,
      itens: itensFaltantes.length ? itensFaltantes : undefined,
    });
    setSalvando(false);
    if (error) setErro(error.message);
    else setErro(null);
  }

  async function handleConcluir() {
    if (!id) return;
    if (!todosItensComStatusDefinido(itens)) {
      setErro('Defina o status de todos os itens antes de concluir.');
      return;
    }
    setSalvando(true);
    if (observacao.trim()) {
      await registrarObservacaoSeparacao({
        pedidoId: id,
        usuarioId,
        observacao,
        itens: itensFaltantes.length ? itensFaltantes : undefined,
      });
    }
    const { error } = await concluirSeparacao(id, usuarioId);
    setSalvando(false);
    if (error) setErro(error.message);
    else navigate('/operacional');
  }

  if (!pedido) {
    return (
      <PageShell className="hub-page--denso" titulo="Separação">
        <p>{erro ?? 'Carregando…'}</p>
        <Link to="/operacional">Voltar à fila</Link>
      </PageShell>
    );
  }

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo={`Separar #${pedido.numero}`}
      subtitulo={pedido.clientes?.nome_fantasia ?? pedido.clientes?.nome ?? ''}
    >
      <p className="ops-resumo">
        <span>{STATUS_LABEL[pedido.status]}</span>
        <span>Pedido: {formatarMoeda(Number(pedido.valor_pedido))}</span>
        <span>Separado: {formatarMoeda(totalSeparado)}</span>
        {pedido.separador_id ? (
          <span>Separador: {pedido.usuarios?.nome ?? '—'}</span>
        ) : null}
      </p>

      <div className="ops-sep-toolbar">
        {pedido.status === 'aguardando_separacao' ||
        pedido.status === 'refazer_separacao' ? (
          <button
            type="button"
            className="btn"
            disabled={salvando || !podeSeparar(usuario.cargo)}
            onClick={() => void handleIniciar()}
          >
            Iniciar separação
          </button>
        ) : null}
        {pedido.status === 'em_separacao' ? (
          <button
            type="button"
            className="btn btn-secundario"
            disabled={salvando}
            onClick={() => void handlePausar()}
          >
            Parar separação
          </button>
        ) : null}
        {pedido.status === 'separacao_pausada' ? (
          <button
            type="button"
            className="btn"
            disabled={salvando}
            onClick={() => void handleRetomar()}
          >
            Retomar separação
          </button>
        ) : null}
        {emSeparacao ? (
          <button
            type="button"
            className="btn"
            disabled={salvando}
            onClick={() => void handleConcluir()}
          >
            Concluir separação
          </button>
        ) : null}
        <Link to="/operacional" className="btn btn-secundario">
          Voltar à fila
        </Link>
      </div>

      {erro ? <p className="erro">{erro}</p> : null}

      {emSeparacao ? (
        <section className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>
            Observação da separação
          </h3>
          <p style={{ margin: '0 0 0.65rem', fontSize: '0.8rem', color: 'var(--hub-muted)' }}>
            Registre o que aconteceu (faltas, substituições, divergências). Isso fica salvo no histórico do pedido.
          </p>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
            placeholder="Ex.: Faltou 2x Brahma 350ml, não encontrado no estoque."
            style={{ resize: 'vertical' }}
            disabled={salvando || !podeSeparar(usuario.cargo)}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secundario"
              onClick={() => void handleSalvarObservacao()}
              disabled={salvando || !observacao.trim()}
            >
              Salvar observação
            </button>
            {itensFaltantes.length ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--hub-muted)', alignSelf: 'center' }}>
                {itensFaltantes.length} item(ns) com falta
              </span>
            ) : null}
          </div>
        </section>
      ) : null}

      {grupos.map((g) => (
        <section key={g.categoria} className="ops-grupo">
          <h3 className="ops-grupo-titulo">{g.categoria}</h3>
          {g.itens.map((item) => (
            <div key={item.id} className="ops-item">
              <div className="ops-item-img">
                {item.produtos?.imagem_url ? (
                  <img src={item.produtos.imagem_url} alt="" />
                ) : (
                  <span aria-hidden>🍺</span>
                )}
              </div>
              <div>
                <p className="ops-item-nome">{item.nome_snapshot}</p>
                <p className="ops-item-pedido">
                  Pedido: {item.qty_pedida} · {formatarMoeda(Number(item.preco_unitario))}/un
                </p>
              </div>
              <div className="ops-item-status">
                <span className="ops-qty-pedida">Pedido: {item.qty_pedida}</span>
                <label className="ops-qty-separada">
                  <span>Separado</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={item.qty_pedida}
                    placeholder={String(item.qty_pedida)}
                    value={qtyEdit[item.id] ?? ''}
                    disabled={!podeOperar || salvando}
                    onChange={(e) =>
                      setQtyEdit((m) => ({ ...m, [item.id]: e.target.value }))
                    }
                    onBlur={() => void handleQtyBlur(item)}
                  />
                </label>
                {item.qty_separada != null ? (
                  (() => {
                    const faltou = Math.max(0, Number(item.qty_pedida) - Number(item.qty_separada));
                    return faltou > 0 ? (
                      <span className="ops-qty-faltou">Faltou: {faltou}</span>
                    ) : (
                      <span className="ops-qty-ok">OK</span>
                    );
                  })()
                ) : null}
                <ItemStatusPicker
                  value={statusItemFromRow(item)}
                  disabled={!podeOperar || salvando}
                  onChange={(status) => void handleStatus(item, status)}
                />
              </div>
            </div>
          ))}
        </section>
      ))}
    </AppPageHeader>
  );
}
