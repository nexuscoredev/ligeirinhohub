import { useCallback, useEffect, useState } from 'react';
import { AppPageHeader } from '@/components/AppPageHeader';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { listarSeriesFiscais, salvarSerieFiscal } from '@/lib/fiscal/api';
import { usePerfil } from '@/contexts/PerfilContext';
import { isHubAdmin } from '@/lib/admin/usuariosApi';
import type { FiscalAmbiente, SerieFiscal } from '@/types/fiscal';
import './fiscal.css';

const AMBIENTE_LABEL: Record<FiscalAmbiente, string> = {
  homologacao: 'Homologação',
  producao: 'Produção',
};

export function FiscalSeriesPage() {
  const app = appPorId('fiscal');
  const item = app ? itemAppPorRota(app, '/fiscal/series') : null;
  const { usuario } = usePerfil();
  const podeEditar = usuario ? isHubAdmin(usuario.cargo) : false;

  const [series, setSeries] = useState<SerieFiscal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: undefined as string | undefined,
    modelo: '55' as '55' | '65',
    serie: '',
    numero_atual: 0,
    ambiente: 'homologacao' as FiscalAmbiente,
    descricao: '',
    ativo: true,
  });

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { series: lista, error } = await listarSeriesFiscais();
    if (error) {
      setErro(error.message);
    } else {
      setSeries(lista);
      setErro(null);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function editar(s: SerieFiscal) {
    setForm({
      id: s.id,
      modelo: s.modelo,
      serie: s.serie,
      numero_atual: s.numero_atual,
      ambiente: s.ambiente,
      descricao: s.descricao ?? '',
      ativo: s.ativo,
    });
    setMsg(null);
  }

  function limparForm() {
    setForm({
      id: undefined,
      modelo: '55',
      serie: '',
      numero_atual: 0,
      ambiente: 'homologacao',
      descricao: '',
      ativo: true,
    });
  }

  async function gravar(e: React.FormEvent) {
    e.preventDefault();
    if (!podeEditar) return;
    setMsg(null);
    const { error } = await salvarSerieFiscal({
      id: form.id,
      modelo: form.modelo,
      serie: form.serie,
      numero_atual: form.numero_atual,
      ambiente: form.ambiente,
      descricao: form.descricao || null,
      ativo: form.ativo,
    });
    if (error) {
      setErro(error.message);
      return;
    }
    setErro(null);
    setMsg('Série salva.');
    limparForm();
    void carregar();
  }

  if (!app || !item) return null;

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Séries fiscais"
      subtitulo="Numeração NF-e (55) e NFC-e (65) por ambiente."
    >
      {erro ? (
        <p className="fisc-erro" role="alert">
          {erro}
        </p>
      ) : null}
      {msg ? <p className="fisc-msg">{msg}</p> : null}

      <form className="card fisc-grid-form" onSubmit={(e) => void gravar(e)}>
        <h2 style={{ gridColumn: '1 / -1', margin: 0 }}>
          {form.id ? 'Editar série' : 'Nova série'}
        </h2>
        <label className="admin-field">
          Modelo
          <select
            value={form.modelo}
            onChange={(e) =>
              setForm((s) => ({ ...s, modelo: e.target.value as '55' | '65' }))
            }
            disabled={!podeEditar || !!form.id}
          >
            <option value="55">55 — NF-e</option>
            <option value="65">65 — NFC-e</option>
          </select>
        </label>
        <label className="admin-field">
          Série
          <input
            value={form.serie}
            onChange={(e) => setForm((s) => ({ ...s, serie: e.target.value }))}
            required
            disabled={!podeEditar}
          />
        </label>
        <label className="admin-field">
          Número atual
          <input
            type="number"
            min={0}
            value={form.numero_atual}
            onChange={(e) =>
              setForm((s) => ({ ...s, numero_atual: Number(e.target.value) || 0 }))
            }
            disabled={!podeEditar}
          />
        </label>
        <label className="admin-field">
          Ambiente
          <select
            value={form.ambiente}
            onChange={(e) =>
              setForm((s) => ({ ...s, ambiente: e.target.value as FiscalAmbiente }))
            }
            disabled={!podeEditar}
          >
            <option value="homologacao">Homologação</option>
            <option value="producao">Produção</option>
          </select>
        </label>
        <label className="admin-field">
          Descrição
          <input
            value={form.descricao}
            onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
            disabled={!podeEditar}
          />
        </label>
        <label className="admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={form.ativo}
            onChange={(e) => setForm((s) => ({ ...s, ativo: e.target.checked }))}
            disabled={!podeEditar}
          />
          Ativa
        </label>
        {podeEditar ? (
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="fisc-btn-primario">
              Salvar
            </button>
            {form.id ? (
              <button type="button" className="fisc-btn-secundario" onClick={limparForm}>
                Cancelar
              </button>
            ) : null}
          </div>
        ) : (
          <p className="fisc-origem" style={{ gridColumn: '1 / -1' }}>
            Apenas administradores podem alterar séries.
          </p>
        )}
      </form>

      {carregando ? <p className="fisc-loading">Carregando…</p> : null}

      {!carregando ? (
        <div className="fisc-lista-wrap card">
          <table className="fisc-tabela">
            <thead>
              <tr>
                <th>Modelo</th>
                <th>Série</th>
                <th>Nº atual</th>
                <th>Ambiente</th>
                <th>Descrição</th>
                <th>Ativa</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {series.length === 0 ? (
                <tr>
                  <td colSpan={7} className="fisc-vazio">
                    Nenhuma série cadastrada. A migration Fase 3 inclui seeds de homologação.
                  </td>
                </tr>
              ) : (
                series.map((s) => (
                  <tr key={s.id}>
                    <td>{s.modelo === '55' ? 'NF-e' : 'NFC-e'}</td>
                    <td>{s.serie}</td>
                    <td>{s.numero_atual}</td>
                    <td>{AMBIENTE_LABEL[s.ambiente]}</td>
                    <td>{s.descricao ?? '—'}</td>
                    <td>{s.ativo ? 'Sim' : 'Não'}</td>
                    <td>
                      {podeEditar ? (
                        <button
                          type="button"
                          className="fisc-btn-secundario"
                          onClick={() => editar(s)}
                        >
                          Editar
                        </button>
                      ) : null}
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
