import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppPageHeader } from '@/components/AppPageHeader';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { listarTurnosCaixaRecentes } from '@/lib/financeiro/api';
import { formatarMoeda } from '@/lib/pedidos/constants';
import './financeiro.css';

interface TurnoCaixa {
  id: string;
  caixa_numero: number;
  status: string;
  valor_abertura: number;
  valor_fechamento_informado: number | null;
  valor_fechamento_apurado: number | null;
  aberto_em: string;
  fechado_em: string | null;
}

export function FinanceiroCaixaPage() {
  const app = appPorId('financeiro');
  const item = app ? itemAppPorRota(app, '/financeiro/caixa') : null;

  const [turnos, setTurnos] = useState<TurnoCaixa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { turnos: lista, error } = await listarTurnosCaixaRecentes();
    if (error) setErro(error.message);
    else {
      setTurnos(lista as TurnoCaixa[]);
      setErro(null);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (!app || !item) return null;

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Conferência de caixa"
      subtitulo="Turnos do PDV — operação diária continua no Ligeirinho PDV."
    >
      <div className="fin-atalhos">
        <Link to="/pdv" className="fin-btn-primario">
          Abrir PDV / Caixa
        </Link>
        <button type="button" className="fin-btn-secundario" onClick={() => void carregar()}>
          Atualizar
        </button>
      </div>

      {erro ? (
        <p className="fin-erro" role="alert">
          {erro}
        </p>
      ) : null}

      {carregando ? <p className="fin-loading">Carregando…</p> : null}

      {!carregando ? (
        <div className="fin-lista-wrap card">
          <table className="fin-tabela">
            <thead>
              <tr>
                <th>Caixa</th>
                <th>Status</th>
                <th>Abertura</th>
                <th className="fin-col-num">Vlr. abertura</th>
                <th className="fin-col-num">Apurado</th>
                <th className="fin-col-num">Informado</th>
                <th>Fechamento</th>
              </tr>
            </thead>
            <tbody>
              {turnos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="fin-vazio">
                    Nenhum turno de caixa registrado.
                  </td>
                </tr>
              ) : (
                turnos.map((t) => (
                  <tr key={t.id}>
                    <td>#{t.caixa_numero}</td>
                    <td>
                      <span className={`fin-badge fin-badge--${t.status === 'aberto' ? 'aberta' : 'paga'}`}>
                        {t.status === 'aberto' ? 'Aberto' : 'Fechado'}
                      </span>
                    </td>
                    <td>{new Date(t.aberto_em).toLocaleString('pt-BR')}</td>
                    <td className="fin-col-num">{formatarMoeda(t.valor_abertura)}</td>
                    <td className="fin-col-num">
                      {t.valor_fechamento_apurado != null
                        ? formatarMoeda(t.valor_fechamento_apurado)
                        : '—'}
                    </td>
                    <td className="fin-col-num">
                      {t.valor_fechamento_informado != null
                        ? formatarMoeda(t.valor_fechamento_informado)
                        : '—'}
                    </td>
                    <td>
                      {t.fechado_em
                        ? new Date(t.fechado_em).toLocaleString('pt-BR')
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
