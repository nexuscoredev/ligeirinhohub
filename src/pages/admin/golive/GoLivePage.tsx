import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { ADMIN_DESCRICAO } from '@/lib/admin/modulos';
import {
  avaliarGoLive,
  confirmarCriterioManual,
  sincronizarInadimplenciaGoLive,
} from '@/lib/golive/api';
import type { ResumoGoLive } from '@/types/golive';
import { AdminSubnav } from '@/pages/admin/AdminSubnav';
import '@/pages/admin/admin.css';
import './golive.css';

const RESUMO_VAZIO: ResumoGoLive = {
  criterios: [],
  prontos: 0,
  total: 0,
  liberado: false,
};

export function GoLivePage() {
  const [resumo, setResumo] = useState<ResumoGoLive>(RESUMO_VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [obsGf, setObsGf] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    const { resumo: dados, error } = await avaliarGoLive();
    if (error) setErro(error.message);
    else setResumo(dados);
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const confirmarGfParado = async (confirmado: boolean) => {
    setSalvando(true);
    const { error } = await confirmarCriterioManual('gf_parado_7d', confirmado, obsGf);
    setSalvando(false);
    if (error) setErro(error.message);
    else void carregar();
  };

  const syncInadimplencia = async () => {
    setSalvando(true);
    const { error } = await sincronizarInadimplenciaGoLive();
    setSalvando(false);
    if (error) setErro(error.message);
    else void carregar();
  };

  return (
    <PageShell
      className="hub-page--denso"
      tag="Go-live"
      titulo={
        <>
          Checklist de <span>go-live</span>
        </>
      }
      subtitulo={ADMIN_DESCRICAO}
    >
      <AdminSubnav />

      {erro ? (
        <p className="golive-erro" role="alert">
          {erro}
        </p>
      ) : null}

      <div className="golive-acoes">
        <button type="button" className="btn btn-secundario" disabled={carregando} onClick={() => void carregar()}>
          {carregando ? 'Avaliando…' : 'Reavaliar'}
        </button>
        <button type="button" className="btn btn-secundario" disabled={salvando} onClick={() => void syncInadimplencia()}>
          Sincronizar inadimplência
        </button>
        <Link to="/admin/sistemas" className="btn btn-secundario">
          Status dos sistemas
        </Link>
      </div>

      <div className="golive-resumo" aria-busy={carregando}>
        <div className={`golive-kpi${resumo.liberado ? ' golive-kpi--ok' : ' golive-kpi--pendente'}`}>
          <strong>
            {resumo.prontos}/{resumo.total}
          </strong>
          <span>critérios OK</span>
        </div>
        <div className="golive-kpi">
          <strong>{resumo.liberado ? 'Pronto' : 'Pendente'}</strong>
          <span>descomissionar GF</span>
        </div>
      </div>

      <div className="golive-lista">
        {resumo.criterios.map((c) => (
          <article
            key={c.criterio}
            className={`golive-item${c.ok ? ' golive-item--ok' : ' golive-item--fail'}`}
          >
            <div className="golive-item__topo">
              <strong>{c.titulo}</strong>
              <span className="golive-badge golive-badge--auto">
                {c.automatico ? 'Automático' : 'Manual'} · {c.ok ? 'OK' : 'Pendente'}
              </span>
            </div>
            <p>{c.detalhe}</p>

            {!c.automatico && c.criterio === 'gf_parado_7d' ? (
              <div className="golive-manual">
                <input
                  type="text"
                  placeholder="Observações (opcional)"
                  value={obsGf}
                  onChange={(e) => setObsGf(e.target.value)}
                />
                <button
                  type="button"
                  className="btn"
                  disabled={salvando}
                  onClick={() => void confirmarGfParado(true)}
                >
                  Confirmar GF parado 7d
                </button>
                <button
                  type="button"
                  className="btn btn-secundario"
                  disabled={salvando}
                  onClick={() => void confirmarGfParado(false)}
                >
                  Revogar
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {resumo.liberado ? (
        <div className="golive-sucesso" role="status">
          <strong>Go-live liberado.</strong> Todos os critérios foram atendidos — a loja pode operar
          100% no HUB e iniciar o descomissionamento do Gestão Fácil.
        </div>
      ) : null}

      <p style={{ marginTop: '1rem', fontSize: '0.82rem', opacity: 0.75 }}>
        Critérios oficiais: operação completa · NFC-e produção · inadimplência financeira · GF
        sem pedidos novos por 7 dias.
      </p>
    </PageShell>
  );
}
