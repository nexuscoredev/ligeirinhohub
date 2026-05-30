import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { ADMIN_DESCRICAO } from '@/lib/admin/modulos';
import { buscarEmpresaConfig, salvarEmpresaConfig } from '@/lib/config/api';
import type { EmpresaConfig } from '@/types/config';
import { AdminSubnav } from '@/pages/admin/AdminSubnav';
import '@/pages/admin/admin.css';
import './config.css';

const REGIMES = [
  { value: 'simples', label: 'Simples Nacional' },
  { value: 'presumido', label: 'Lucro Presumido' },
  { value: 'real', label: 'Lucro Real' },
] as const;

export function ConfigEmpresaPage() {
  const [empresa, setEmpresa] = useState<EmpresaConfig | null>(null);
  const [form, setForm] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    inscricao_estadual: '',
    regime_tributario: 'simples' as EmpresaConfig['regime_tributario'],
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { empresa: row, error } = await buscarEmpresaConfig();
    if (error) setErro(error.message);
    else if (row) {
      setEmpresa(row);
      setForm({
        razao_social: row.razao_social,
        nome_fantasia: row.nome_fantasia ?? '',
        cnpj: row.cnpj ?? '',
        inscricao_estadual: row.inscricao_estadual ?? '',
        regime_tributario: row.regime_tributario,
      });
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const salvar = async () => {
    if (!form.razao_social.trim()) {
      setErro('Informe a razão social.');
      return;
    }
    setSalvando(true);
    setErro(null);
    const { error } = await salvarEmpresaConfig({
      id: empresa?.id,
      ...form,
    });
    setSalvando(false);
    if (error) setErro(error.message);
    else {
      setMsg('Empresa salva.');
      void carregar();
    }
  };

  return (
    <PageShell
      className="hub-page--denso"
      tag="Configuração"
      titulo={
        <>
          Empresa <span>CNPJ</span>
        </>
      }
      subtitulo={ADMIN_DESCRICAO}
    >
      <AdminSubnav />

      <p className="cfg-voltar">
        <Link to="/admin/config">← Voltar à configuração</Link>
      </p>

      {erro ? (
        <p className="cfg-erro" role="alert">
          {erro}
        </p>
      ) : null}
      {msg ? <p className="cfg-msg">{msg}</p> : null}

      <div className="cfg-form" aria-busy={carregando}>
        <label>
          Razão social *
          <input
            value={form.razao_social}
            onChange={(e) => setForm((f) => ({ ...f, razao_social: e.target.value }))}
          />
        </label>
        <div className="cfg-grid-2">
          <label>
            Nome fantasia
            <input
              value={form.nome_fantasia}
              onChange={(e) => setForm((f) => ({ ...f, nome_fantasia: e.target.value }))}
            />
          </label>
          <label>
            CNPJ
            <input
              value={form.cnpj}
              onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))}
              placeholder="00.000.000/0000-00"
            />
          </label>
        </div>
        <div className="cfg-grid-2">
          <label>
            Inscrição estadual
            <input
              value={form.inscricao_estadual}
              onChange={(e) => setForm((f) => ({ ...f, inscricao_estadual: e.target.value }))}
            />
          </label>
          <label>
            Regime tributário
            <select
              value={form.regime_tributario}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  regime_tributario: e.target.value as EmpresaConfig['regime_tributario'],
                }))
              }
            >
              {REGIMES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="button" className="btn" disabled={salvando} onClick={() => void salvar()}>
          {salvando ? 'Salvando…' : 'Salvar empresa'}
        </button>
      </div>
    </PageShell>
  );
}
