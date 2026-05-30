import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { ADMIN_DESCRICAO } from '@/lib/admin/modulos';
import { buscarEmpresaConfig, salvarEnvioXml } from '@/lib/config/api';
import type { EmpresaConfig, FiscalAmbienteConfig } from '@/types/config';
import { AdminSubnav } from '@/pages/admin/AdminSubnav';
import '@/pages/admin/admin.css';
import './config.css';

export function ConfigFiscalPage() {
  const [empresa, setEmpresa] = useState<EmpresaConfig | null>(null);
  const [form, setForm] = useState({
    fiscal_ambiente: 'homologacao' as FiscalAmbienteConfig,
    certificado_fiscal_ref: '',
    envio_xml_habilitado: false,
    envio_xml_destino: '',
    envio_xml_email: '',
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
        fiscal_ambiente: row.fiscal_ambiente ?? 'homologacao',
        certificado_fiscal_ref: row.certificado_fiscal_ref ?? '',
        envio_xml_habilitado: row.envio_xml_habilitado,
        envio_xml_destino: row.envio_xml_destino ?? '',
        envio_xml_email: row.envio_xml_email ?? '',
      });
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const salvar = async () => {
    if (!empresa?.id) {
      setErro('Cadastre a empresa em Configuração → Empresa antes de configurar o fiscal.');
      return;
    }
    setSalvando(true);
    setErro(null);
    const { error } = await salvarEnvioXml({
      id: empresa.id,
      ...form,
    });
    setSalvando(false);
    if (error) setErro(error.message);
    else setMsg('Parâmetros fiscais salvos.');
  };

  return (
    <PageShell
      className="hub-page--denso"
      tag="Configuração"
      titulo={
        <>
          Fiscal / <span>envio XML</span>
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

      {!empresa && !carregando ? (
        <p style={{ opacity: 0.8 }}>
          Nenhuma empresa cadastrada.{' '}
          <Link to="/admin/config/empresa">Cadastrar empresa →</Link>
        </p>
      ) : (
        <div className="cfg-form" aria-busy={carregando}>
          <label>
            Ambiente fiscal padrão
            <select
              value={form.fiscal_ambiente}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  fiscal_ambiente: e.target.value as FiscalAmbienteConfig,
                }))
              }
            >
              <option value="homologacao">Homologação</option>
              <option value="producao">Produção</option>
            </select>
          </label>
          <label>
            Referência do certificado digital
            <input
              value={form.certificado_fiscal_ref}
              onChange={(e) =>
                setForm((f) => ({ ...f, certificado_fiscal_ref: e.target.value }))
              }
              placeholder="Vault / Nuvem Fiscal / caminho seguro"
            />
          </label>
          <label className="cfg-inline-check">
            <input
              type="checkbox"
              checked={form.envio_xml_habilitado}
              onChange={(e) =>
                setForm((f) => ({ ...f, envio_xml_habilitado: e.target.checked }))
              }
            />
            Habilitar envio automático de XML
          </label>
          <label>
            Destino do envio (pasta / integração)
            <input
              value={form.envio_xml_destino}
              onChange={(e) =>
                setForm((f) => ({ ...f, envio_xml_destino: e.target.value }))
              }
              placeholder="s3://bucket/xml ou integração contador"
            />
          </label>
          <label>
            E-mail para envio de XML
            <input
              type="email"
              value={form.envio_xml_email}
              onChange={(e) => setForm((f) => ({ ...f, envio_xml_email: e.target.value }))}
              placeholder="contador@escritorio.com.br"
            />
          </label>
          <button type="button" className="btn" disabled={salvando} onClick={() => void salvar()}>
            {salvando ? 'Salvando…' : 'Salvar configuração fiscal'}
          </button>
        </div>
      )}
    </PageShell>
  );
}
