import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { usePerfil } from '@/contexts/PerfilContext';
import { listarPessoas, salvarPessoa } from '@/lib/cadastros/pessoasApi';
import { isHubAdmin } from '@/lib/admin/usuariosApi';
import {
  TIPO_PESSOA_LABEL,
  TIPOS_PESSOA,
  type GfTipoPessoa,
  type Pessoa,
} from '@/types/cadastrosGf';
import { AdminSubnav } from '@/pages/admin/AdminSubnav';
import './admin.css';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

type FiltroPessoa = 'todos' | GfTipoPessoa;

const FORM_INICIAL = {
  id: undefined as string | undefined,
  tipos: ['cliente'] as GfTipoPessoa[],
  nome: '',
  nome_fantasia: '',
  cpf_cnpj: '',
  email: '',
  telefone: '',
  tabela_preco: 'padrao',
  dia_vencimento_semana: '' as number | '' ,
  bloqueado_pedido: false,
  inadimplente: false,
  limite_credito: '' as number | '',
  observacoes: '',
  ativo: true,
};

export function PessoasAdminPage() {
  const { usuario } = usePerfil();
  const podeEditar = usuario
    ? isHubAdmin(usuario.cargo) || ['Gerente', 'Comercial'].includes(usuario.cargo)
    : false;

  const [filtro, setFiltro] = useState<FiltroPessoa>('todos');
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [form, setForm] = useState(FORM_INICIAL);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { pessoas: lista, error } = await listarPessoas(
      filtro === 'todos' ? undefined : filtro,
    );
    if (error) {
      setErro(
        error.message ||
          'Erro ao carregar pessoas. A migration GF Fase 1 foi aplicada no Supabase?',
      );
    } else {
      setPessoas(lista);
      setErro(null);
    }
    setCarregando(false);
  }, [filtro]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return pessoas;
    return pessoas.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        (p.nome_fantasia ?? '').toLowerCase().includes(q) ||
        (p.cpf_cnpj ?? '').includes(q),
    );
  }, [pessoas, busca]);

  function editar(p: Pessoa) {
    setForm({
      id: p.id,
      tipos: p.tipos,
      nome: p.nome,
      nome_fantasia: p.nome_fantasia ?? '',
      cpf_cnpj: p.cpf_cnpj ?? '',
      email: p.email ?? '',
      telefone: p.telefone ?? '',
      tabela_preco: p.tabela_preco,
      dia_vencimento_semana: p.dia_vencimento_semana ?? '',
      bloqueado_pedido: p.bloqueado_pedido,
      inadimplente: p.inadimplente,
      limite_credito: p.limite_credito ?? '',
      observacoes: p.observacoes ?? '',
      ativo: p.ativo,
    });
  }

  function limpar() {
    setForm({ ...FORM_INICIAL, tipos: ['cliente'] });
  }

  function toggleTipo(tipo: GfTipoPessoa) {
    setForm((s) => {
      const tem = s.tipos.includes(tipo);
      const tipos = tem ? s.tipos.filter((t) => t !== tipo) : [...s.tipos, tipo];
      return { ...s, tipos: tipos.length ? tipos : ['cliente'] };
    });
  }

  async function gravar(e: React.FormEvent) {
    e.preventDefault();
    if (!podeEditar) return;
    setMsg(null);
    const { error } = await salvarPessoa({
      id: form.id,
      tipos: form.tipos,
      nome: form.nome,
      nome_fantasia: form.nome_fantasia || null,
      cpf_cnpj: form.cpf_cnpj || null,
      email: form.email || null,
      telefone: form.telefone || null,
      tabela_preco: form.tabela_preco,
      dia_vencimento_semana:
        form.dia_vencimento_semana === '' ? null : Number(form.dia_vencimento_semana),
      bloqueado_pedido: form.bloqueado_pedido,
      inadimplente: form.inadimplente,
      limite_credito: form.limite_credito === '' ? null : Number(form.limite_credito),
      observacoes: form.observacoes || null,
      ativo: form.ativo,
    });
    if (error) {
      setErro(error.message);
      return;
    }
    setMsg(
      form.tipos.includes('cliente')
        ? 'Pessoa salva e sincronizada com Clientes (Operacional).'
        : 'Pessoa salva.',
    );
    limpar();
    void carregar();
  }

  return (
    <PageShell
      titulo="Pessoas"
      subtitulo="Clientes, fornecedores e vendedores — compatível com a tela Clientes do Operacional."
    >
      <AdminSubnav />

      <p className="admin-intro">
        Cadastro unificado do Gestão Fácil. Quem é <strong>Cliente</strong> continua aparecendo em{' '}
        <strong>Operacional → Clientes</strong> sem alteração de fluxo.
      </p>

      {erro ? (
        <p className="admin-erro" role="alert">
          {erro}
        </p>
      ) : null}
      {msg ? (
        <p className="admin-ok" role="status">
          {msg}
        </p>
      ) : null}

      <div className="cadastros-base-abas pessoas-filtros" role="tablist" aria-label="Filtrar pessoas">
        {(['todos', ...TIPOS_PESSOA] as FiltroPessoa[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={filtro === t}
            className={filtro === t ? 'cadastros-aba ativo' : 'cadastros-aba'}
            onClick={() => setFiltro(t)}
          >
            {t === 'todos' ? 'Todos' : TIPO_PESSOA_LABEL[t]}
          </button>
        ))}
      </div>

      <label className="admin-field pessoas-busca">
        Buscar
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Nome, fantasia ou CPF/CNPJ"
        />
      </label>

      {carregando ? <p className="admin-loading">Carregando…</p> : null}

      {!carregando ? (
        <div className="cadastros-base-grid">
          <form className="card cadastros-form" onSubmit={(e) => void gravar(e)}>
            <h2>{form.id ? 'Editar pessoa' : 'Nova pessoa'}</h2>

            <fieldset className="pessoas-tipos-fieldset">
              <legend>Tipos</legend>
              <div className="pessoas-tipos-grid">
                {TIPOS_PESSOA.map((tipo) => (
                  <label key={tipo} className="admin-field-check">
                    <input
                      type="checkbox"
                      checked={form.tipos.includes(tipo)}
                      onChange={() => toggleTipo(tipo)}
                      disabled={!podeEditar}
                    />
                    {TIPO_PESSOA_LABEL[tipo]}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="admin-field">
              Nome / razão social
              <input
                value={form.nome}
                onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))}
                required
                disabled={!podeEditar}
              />
            </label>
            <label className="admin-field">
              Nome fantasia
              <input
                value={form.nome_fantasia}
                onChange={(e) => setForm((s) => ({ ...s, nome_fantasia: e.target.value }))}
                disabled={!podeEditar}
              />
            </label>
            <label className="admin-field">
              CPF / CNPJ
              <input
                value={form.cpf_cnpj}
                onChange={(e) => setForm((s) => ({ ...s, cpf_cnpj: e.target.value }))}
                disabled={!podeEditar}
              />
            </label>
            <label className="admin-field">
              E-mail
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                disabled={!podeEditar}
              />
            </label>
            <label className="admin-field">
              Telefone
              <input
                value={form.telefone}
                onChange={(e) => setForm((s) => ({ ...s, telefone: e.target.value }))}
                disabled={!podeEditar}
              />
            </label>

            {form.tipos.includes('cliente') ? (
              <>
                <label className="admin-field">
                  Tabela de preço
                  <input
                    value={form.tabela_preco}
                    onChange={(e) => setForm((s) => ({ ...s, tabela_preco: e.target.value }))}
                    disabled={!podeEditar}
                  />
                </label>
                <label className="admin-field">
                  Dia vencimento (semana)
                  <select
                    value={form.dia_vencimento_semana === '' ? '' : String(form.dia_vencimento_semana)}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        dia_vencimento_semana:
                          e.target.value === '' ? '' : Number(e.target.value),
                      }))
                    }
                    disabled={!podeEditar}
                  >
                    <option value="">—</option>
                    {DIAS.map((d, i) => (
                      <option key={d} value={i}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-field">
                  Limite de crédito (R$)
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.limite_credito}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        limite_credito: e.target.value === '' ? '' : Number(e.target.value),
                      }))
                    }
                    disabled={!podeEditar}
                  />
                </label>
                <label className="admin-field admin-field-check">
                  <input
                    type="checkbox"
                    checked={form.bloqueado_pedido}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, bloqueado_pedido: e.target.checked }))
                    }
                    disabled={!podeEditar}
                  />
                  Bloquear novos pedidos
                </label>
                <label className="admin-field admin-field-check">
                  <input
                    type="checkbox"
                    checked={form.inadimplente}
                    onChange={(e) => setForm((s) => ({ ...s, inadimplente: e.target.checked }))}
                    disabled={!podeEditar}
                  />
                  Inadimplente
                </label>
              </>
            ) : null}

            <label className="admin-field">
              Observações
              <textarea
                value={form.observacoes}
                onChange={(e) => setForm((s) => ({ ...s, observacoes: e.target.value }))}
                rows={2}
                disabled={!podeEditar}
              />
            </label>
            <label className="admin-field admin-field-check">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => setForm((s) => ({ ...s, ativo: e.target.checked }))}
                disabled={!podeEditar}
              />
              Ativo
            </label>

            {podeEditar ? (
              <div className="cadastros-form-acoes">
                <button type="submit" className="btn-primario">
                  Salvar
                </button>
                {form.id ? (
                  <button type="button" className="btn-secundario" onClick={limpar}>
                    Cancelar
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="admin-hint">Somente Admin, Gerente ou Comercial podem editar.</p>
            )}
          </form>

          <div className="card cadastros-lista">
            <h2>Pessoas ({filtradas.length})</h2>
            <ul className="cadastros-tabela pessoas-tabela">
              {filtradas.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="cadastros-linha pessoas-linha"
                    onClick={() => editar(p)}
                    disabled={!podeEditar}
                  >
                    <strong>{p.nome_fantasia ?? p.nome}</strong>
                    <span>{p.cpf_cnpj ?? '—'}</span>
                    <span className="pessoas-tags">
                      {p.tipos.map((t) => (
                        <span key={t} className="cadastros-tag">
                          {TIPO_PESSOA_LABEL[t]}
                        </span>
                      ))}
                    </span>
                    {!p.ativo ? <span className="cadastros-inativo">Inativo</span> : null}
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
