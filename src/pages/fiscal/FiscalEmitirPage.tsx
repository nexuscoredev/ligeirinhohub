import { useCallback, useEffect, useState } from 'react';
import { AppPageHeader } from '@/components/AppPageHeader';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { emitirNfePedido, listarPedidosParaEmissaoNfe } from '@/lib/fiscal/api';
import { formatarMoeda } from '@/lib/pedidos/constants';
import { NOTA_STATUS_LABEL } from '@/types/fiscal';
import './fiscal.css';

interface PedidoEmissao {
  id: string;
  numero: number;
  valor_pedido: number;
  status: string;
  tipo_documento: string | null;
  clientes: { nome: string; nome_fantasia: string | null } | null;
  operacoes_fiscais: { descricao: string } | null;
}

export function FiscalEmitirPage() {
  const app = appPorId('fiscal');
  const item = app ? itemAppPorRota(app, '/fiscal/emitir') : null;

  const [pedidos, setPedidos] = useState<PedidoEmissao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [emitindoId, setEmitindoId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { pedidos: lista, error } = await listarPedidosParaEmissaoNfe();
    if (error) {
      setErro(error.message);
    } else {
      setPedidos(lista as PedidoEmissao[]);
      setErro(null);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function emitir(pedidoId: string) {
    setEmitindoId(pedidoId);
    setMsg(null);
    setErro(null);

    const { nota, error } = await emitirNfePedido(pedidoId);
    setEmitindoId(null);

    if (error) {
      setErro(error.message);
      return;
    }

    if (nota?.status === 'autorizada') {
      setMsg(
        `NF-e autorizada — série ${nota.serie}, nº ${nota.numero}${nota.chave_acesso ? ` (${nota.chave_acesso.slice(-8)})` : ''}.`,
      );
    } else {
      setErro(nota?.motivo_rejeicao ?? `Emissão concluída com status: ${nota?.status ?? 'desconhecido'}.`);
    }

    void carregar();
  }

  if (!app || !item) return null;

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Emitir NF-e"
      subtitulo="Pedidos com tipo documento NF-e (negociações finalizadas)."
    >
      {erro ? (
        <p className="fisc-erro" role="alert">
          {erro}
        </p>
      ) : null}
      {msg ? <p className="fisc-msg">{msg}</p> : null}

      <p style={{ fontSize: '0.82rem', color: 'var(--hub-muted)', marginBottom: '1rem' }}>
        Requer Edge Function <code>nfe-emitir</code> deployada e série NF-e ativa em{' '}
        <a href="/fiscal/series">Séries fiscais</a>.
      </p>

      {carregando ? <p className="fisc-loading">Carregando…</p> : null}

      {!carregando ? (
        <div className="fisc-lista-wrap card">
          <table className="fisc-tabela">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Operação</th>
                <th>Status</th>
                <th className="fisc-col-num">Valor</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pedidos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="fisc-vazio">
                    Nenhum pedido NF-e pendente. Finalize uma negociação com tipo documento
                    NF-e.
                  </td>
                </tr>
              ) : (
                pedidos.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.numero}</td>
                    <td>{p.clientes?.nome_fantasia ?? p.clientes?.nome ?? '—'}</td>
                    <td>{p.operacoes_fiscais?.descricao ?? '—'}</td>
                    <td>{p.status}</td>
                    <td className="fisc-col-num">{formatarMoeda(p.valor_pedido)}</td>
                    <td>
                      <button
                        type="button"
                        className="fisc-btn-primario"
                        disabled={emitindoId === p.id}
                        onClick={() => void emitir(p.id)}
                      >
                        {emitindoId === p.id ? 'Emitindo…' : 'Emitir NF-e'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="fisc-origem" style={{ marginTop: '1rem' }}>
        Status possíveis após emissão:{' '}
        {Object.values(NOTA_STATUS_LABEL).join(', ')}.
      </p>
    </AppPageHeader>
  );
}
