import { useCallback, useEffect, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { usePerfil } from '@/contexts/PerfilContext';
import { listarFormasPagamento, listarMotivos, salvarFormaPagamento, salvarMotivo } from '@/lib/cadastros/api';
import { isHubAdmin } from '@/lib/admin/usuariosApi';
import {
  FORMA_PAGAMENTO_TIPO_LABEL,
  MOTIVO_TIPO_LABEL,
  type FormaPagamento,
  type GfFormaPagamentoTipo,
  type GfMotivoTipo,
  type Motivo,
} from '@/types/cadastrosGf';
import { AdminSubnav } from '@/pages/admin/AdminSubnav';
import './admin.css';

type AbaCadastro = 'motivos' | 'formas';

const TIPOS_MOTIVO = Object.keys(MOTIVO_TIPO_LABEL) as GfMotivoTipo[];
const TIPOS_FORMA = Object.keys(FORMA_PAGAMENTO_TIPO_LABEL) as GfFormaPagamentoTipo[];

export function CadastrosBasePage() {
  const { usuario } = usePerfil();
  const podeEditar = usuario ? isHubAdmin(usuario.cargo) : false;

  const [aba, setAba] = useState<AbaCadastro>('motivos');
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [formas, setFormas] = useState<FormaPagamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [motivoForm, setMotivoForm] = useState({
    id: '' as string | undefined,
    codigo: '',
    descricao: '',
    tipo: 'ocorrencia' as GfMotivoTipo,
    ativo: true,
  });

  const [formaForm, setFormaForm] = useState({
    id: '' as string | undefined,
    codigo: '',
    nome: '',
    tipo: 'dinheiro' as GfFormaPagamentoTipo,
    gera_conta_receber: false,
    dias_prazo: 0,
    ativo: true,
  });

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [motRes, formRes] = await Promise.all([listarMotivos(), listarFormasPagamento()]);
    if (motRes.error || formRes.error) {
      setErro(
        motRes.error?.message ??
          formRes.error?.message ??
          'Erro ao carregar cadastros. A migration GF Fase 0 foi aplicada no Supabase?',
      );
    } else {
      setMotivos(motRes.motivos);
      setFormas(formRes.formas);
      setErro(null);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function editarMotivo(m: Motivo) {
    setMotivoForm({
      id: m.id,
      codigo: m.codigo,
      descricao: m.descricao,
      tipo: m.tipo,
      ativo: m.ativo,
    });
    setAba('motivos');
  }

  function editarForma(f: FormaPagamento) {
    setFormaForm({
      id: f.id,
      codigo: f.codigo,
      nome: f.nome,
      tipo: f.tipo,
      gera_conta_receber: f.gera_conta_receber,
      dias_prazo: f.dias_prazo,
      ativo: f.ativo,
    });
    setAba('formas');
  }

  function limparMotivo() {
    setMotivoForm({ id: undefined, codigo: '', descricao: '', tipo: 'ocorrencia', ativo: true });
  }

  function limparForma() {
    setFormaForm({
      id: undefined,
      codigo: '',
      nome: '',
      tipo: 'dinheiro',
      gera_conta_receber: false,
      dias_prazo: 0,
      ativo: true,
    });
  }

  async function gravarMotivo(e: React.FormEvent) {
    e.preventDefault();
    if (!podeEditar) return;
    setMsg(null);
    const { error } = await salvarMotivo({
      id: motivoForm.id,
      codigo: motivoForm.codigo,
      descricao: motivoForm.descricao,
      tipo: motivoForm.tipo,
      ativo: motivoForm.ativo,
    });
    if (error) {
      setErro(error.message);
      return;
    }
    setMsg('Motivo salvo.');
    limparMotivo();
    void carregar();
  }

  async function gravarForma(e: React.FormEvent) {
    e.preventDefault();
    if (!podeEditar) return;
    setMsg(null);
    const { error } = await salvarFormaPagamento({
      id: formaForm.id,
      codigo: formaForm.codigo,
      nome: formaForm.nome,
      tipo: formaForm.tipo,
      gera_conta_receber: formaForm.gera_conta_receber,
      dias_prazo: formaForm.dias_prazo,
      ativo: formaForm.ativo,
    });
    if (error) {
      setErro(error.message);
      return;
    }
    setMsg('Forma de pagamento salva.');
    limparForma();
    void carregar();
  }

  return (
    <PageShell titulo="Cadastros base" subtitulo="Fundamento Gestão Fácil — Fase 0">
      <AdminSubnav />

      <p className="admin-intro">
        Cadastros auxiliares do plano Gestão Fácil. Não altera PDV, Totem ou Operacional.
      </p>

      {erro ? <p className="admin-erro" role="alert">{erro}</p> : null}
      {msg ? <p className="admin-ok" role="status">{msg}</p> : null}

      <div className="cadastros-base-abas" role="tablist" aria-label="Seções de cadastro">
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'motivos'}
          className={aba === 'motivos' ? 'cadastros-aba ativo' : 'cadastros-aba'}
          onClick={() => setAba('motivos')}
        >
          Motivos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'formas'}
          className={aba === 'formas' ? 'cadastros-aba ativo' : 'cadastros-aba'}
          onClick={() => setAba('formas')}
        >
          Formas de pagamento
        </button>
      </div>

      {carregando ? <p className="admin-loading">Carregando…</p> : null}

      {!carregando && aba === 'motivos' ? (
        <div className="cadastros-base-grid">
          <form className="card cadastros-form" onSubmit={(e) => void gravarMotivo(e)}>
            <h2>{motivoForm.id ? 'Editar motivo' : 'Novo motivo'}</h2>
            <label className="admin-field">
              Código
              <input
                value={motivoForm.codigo}
                onChange={(e) => setMotivoForm((s) => ({ ...s, codigo: e.target.value }))}
                required
                disabled={!podeEditar}
              />
            </label>
            <label className="admin-field">
              Descrição
              <input
                value={motivoForm.descricao}
                onChange={(e) => setMotivoForm((s) => ({ ...s, descricao: e.target.value }))}
                required
                disabled={!podeEditar}
              />
            </label>
            <label className="admin-field">
              Tipo
              <select
                value={motivoForm.tipo}
                onChange={(e) =>
                  setMotivoForm((s) => ({ ...s, tipo: e.target.value as GfMotivoTipo }))
                }
                disabled={!podeEditar}
              >
                {TIPOS_MOTIVO.map((t) => (
                  <option key={t} value={t}>
                    {MOTIVO_TIPO_LABEL[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field admin-field-check">
              <input
                type="checkbox"
                checked={motivoForm.ativo}
                onChange={(e) => setMotivoForm((s) => ({ ...s, ativo: e.target.checked }))}
                disabled={!podeEditar}
              />
              Ativo
            </label>
            {podeEditar ? (
              <div className="cadastros-form-acoes">
                <button type="submit" className="btn-primario">
                  Salvar
                </button>
                {motivoForm.id ? (
                  <button type="button" className="btn-secundario" onClick={limparMotivo}>
                    Cancelar
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="admin-hint">Somente administradores podem editar.</p>
            )}
          </form>

          <div className="card cadastros-lista">
            <h2>Motivos cadastrados ({motivos.length})</h2>
            <ul className="cadastros-tabela">
              {motivos.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="cadastros-linha"
                    onClick={() => editarMotivo(m)}
                    disabled={!podeEditar}
                  >
                    <strong>{m.codigo}</strong>
                    <span>{m.descricao}</span>
                    <span className="cadastros-tag">{MOTIVO_TIPO_LABEL[m.tipo]}</span>
                    {!m.ativo ? <span className="cadastros-inativo">Inativo</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {!carregando && aba === 'formas' ? (
        <div className="cadastros-base-grid">
          <form className="card cadastros-form" onSubmit={(e) => void gravarForma(e)}>
            <h2>{formaForm.id ? 'Editar forma' : 'Nova forma de pagamento'}</h2>
            <label className="admin-field">
              Código
              <input
                value={formaForm.codigo}
                onChange={(e) => setFormaForm((s) => ({ ...s, codigo: e.target.value }))}
                required
                disabled={!podeEditar}
              />
            </label>
            <label className="admin-field">
              Nome
              <input
                value={formaForm.nome}
                onChange={(e) => setFormaForm((s) => ({ ...s, nome: e.target.value }))}
                required
                disabled={!podeEditar}
              />
            </label>
            <label className="admin-field">
              Tipo
              <select
                value={formaForm.tipo}
                onChange={(e) =>
                  setFormaForm((s) => ({ ...s, tipo: e.target.value as GfFormaPagamentoTipo }))
                }
                disabled={!podeEditar}
              >
                {TIPOS_FORMA.map((t) => (
                  <option key={t} value={t}>
                    {FORMA_PAGAMENTO_TIPO_LABEL[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field admin-field-check">
              <input
                type="checkbox"
                checked={formaForm.gera_conta_receber}
                onChange={(e) =>
                  setFormaForm((s) => ({ ...s, gera_conta_receber: e.target.checked }))
                }
                disabled={!podeEditar}
              />
              Gera conta a receber
            </label>
            <label className="admin-field">
              Dias de prazo
              <input
                type="number"
                min={0}
                value={formaForm.dias_prazo}
                onChange={(e) =>
                  setFormaForm((s) => ({ ...s, dias_prazo: Number(e.target.value) || 0 }))
                }
                disabled={!podeEditar}
              />
            </label>
            <label className="admin-field admin-field-check">
              <input
                type="checkbox"
                checked={formaForm.ativo}
                onChange={(e) => setFormaForm((s) => ({ ...s, ativo: e.target.checked }))}
                disabled={!podeEditar}
              />
              Ativo
            </label>
            {podeEditar ? (
              <div className="cadastros-form-acoes">
                <button type="submit" className="btn-primario">
                  Salvar
                </button>
                {formaForm.id ? (
                  <button type="button" className="btn-secundario" onClick={limparForma}>
                    Cancelar
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="admin-hint">Somente administradores podem editar.</p>
            )}
          </form>

          <div className="card cadastros-lista">
            <h2>Formas cadastradas ({formas.length})</h2>
            <ul className="cadastros-tabela">
              {formas.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    className="cadastros-linha"
                    onClick={() => editarForma(f)}
                    disabled={!podeEditar}
                  >
                    <strong>{f.codigo}</strong>
                    <span>{f.nome}</span>
                    <span className="cadastros-tag">{FORMA_PAGAMENTO_TIPO_LABEL[f.tipo]}</span>
                    {f.gera_conta_receber ? (
                      <span className="cadastros-tag">A prazo</span>
                    ) : null}
                    {!f.ativo ? <span className="cadastros-inativo">Inativo</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
