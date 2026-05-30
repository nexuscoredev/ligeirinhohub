import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppPageHeader } from '@/components/AppPageHeader';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { listarNotasUnificadas, rotuloStatusFiscal } from '@/lib/fiscal/api';
import { formatarMoeda } from '@/lib/pedidos/constants';
import { MODELO_LABEL, type NotaFiscalLinha } from '@/types/fiscal';
import './fiscal.css';

type FiltroOrigem = 'todas' | 'pdv_nfce' | 'nfe';
type FiltroStatus = 'todas' | string;

export function FiscalEmitidasPage() {
  const app = appPorId('fiscal');
  const item = app ? itemAppPorRota(app, '/fiscal/emitidas') : null;

  const [linhas, setLinhas] = useState<NotaFiscalLinha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroOrigem, setFiltroOrigem] = useState<FiltroOrigem>('todas');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todas');

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { linhas: lista, error } = await listarNotasUnificadas();
    if (error) {
      setErro(error.message);
    } else {
      setLinhas(lista);
      setErro(null);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const statusOpcoes = useMemo(() => {
    const set = new Set(linhas.map((l) => l.status));
    return Array.from(set).sort();
  }, [linhas]);

  const filtradas = useMemo(() => {
    return linhas.filter((l) => {
      if (filtroOrigem !== 'todas' && l.origem !== filtroOrigem) return false;
      if (filtroStatus !== 'todas' && l.status !== filtroStatus) return false;
      return true;
    });
  }, [linhas, filtroOrigem, filtroStatus]);

  if (!app || !item) return null;

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Notas emitidas"
      subtitulo="Visão unificada: NFC-e do PDV e NF-e do módulo fiscal."
    >
      <div className="fisc-toolbar">
        <label>
          Origem
          <select
            value={filtroOrigem}
            onChange={(e) => setFiltroOrigem(e.target.value as FiltroOrigem)}
          >
            <option value="todas">Todas</option>
            <option value="pdv_nfce">NFC-e (PDV)</option>
            <option value="nfe">NF-e (HUB)</option>
          </select>
        </label>
        <label>
          Status
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="todas">Todos</option>
            {statusOpcoes.map((s) => (
              <option key={s} value={s}>
                {rotuloStatusFiscal(s)}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="fisc-btn-secundario" onClick={() => void carregar()}>
          Atualizar
        </button>
      </div>

      {erro ? (
        <p className="fisc-erro" role="alert">
          {erro}
        </p>
      ) : null}

      {carregando ? <p className="fisc-loading">Carregando…</p> : null}

      {!carregando ? (
        <div className="fisc-lista-wrap card">
          <table className="fisc-tabela">
            <thead>
              <tr>
                <th>Modelo</th>
                <th>Pedido</th>
                <th>Número</th>
                <th>Cliente</th>
                <th className="fisc-col-num">Valor</th>
                <th>Status</th>
                <th>Emissão</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="fisc-vazio">
                    Nenhuma nota encontrada com estes filtros.
                  </td>
                </tr>
              ) : (
                filtradas.map((n) => (
                  <tr key={`${n.origem}-${n.id}`}>
                    <td>
                      {MODELO_LABEL[n.modelo]}
                      <div className="fisc-origem">
                        {n.origem === 'pdv_nfce' ? 'PDV' : 'HUB'}
                      </div>
                    </td>
                    <td>{n.pedido_numero != null ? `#${n.pedido_numero}` : '—'}</td>
                    <td>
                      {n.serie && n.numero ? `${n.serie}/${n.numero}` : (n.numero ?? '—')}
                    </td>
                    <td>{n.cliente ?? '—'}</td>
                    <td className="fisc-col-num">{formatarMoeda(n.valor)}</td>
                    <td>
                      <span className={`fisc-badge fisc-badge--${n.status}`}>
                        {rotuloStatusFiscal(n.status)}
                      </span>
                      {n.mensagem && n.status === 'rejeitada' ? (
                        <div className="fisc-origem" title={n.mensagem}>
                          {n.mensagem.slice(0, 40)}
                          {n.mensagem.length > 40 ? '…' : ''}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      {n.emitida_em
                        ? new Date(n.emitida_em).toLocaleString('pt-BR')
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </AppPageHeader>
  );
}
