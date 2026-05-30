import { useCallback, useEffect, useMemo, useState } from 'react';
import { HubAvatar } from '@/components/HubAvatar';
import { PageShell } from '@/components/PageShell';
import { usePerfil } from '@/contexts/PerfilContext';
import { ADMIN_DESCRICAO } from '@/lib/admin/modulos';
import { atualizarUsuario, isHubAdmin, listarUsuarios } from '@/lib/admin/usuariosApi';
import { todasRotasSistema } from '@/lib/apps';
import { CARGOS_HUB } from '@/lib/cargos';
import type { CargoHub, Usuario } from '@/types/database';
import { AdminSubnav } from '@/pages/admin/AdminSubnav';
import './admin.css';

function tomCargo(cargo: CargoHub): string {
  const map: Record<CargoHub, string> = {
    Desenvolvedor: 'dev',
    Administrador: 'admin',
    CEO: 'ceo',
    Gerente: 'gerente',
    Caixa: 'caixa',
    Estoquista: 'ops',
    Logistica: 'ops',
    Financeiro: 'financeiro',
    Comercial: 'comercial',
    Vendedor: 'comercial',
    Fiscal: 'financeiro',
    Visualizador: 'muted',
  };
  return map[cargo] ?? 'muted';
}

export function UsuariosPage() {
  const { usuario: perfil } = usePerfil();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState<CargoHub>('Visualizador');
  const [ativo, setAtivo] = useState(true);
  const [paginas, setPaginas] = useState<string[]>([]);

  const rotas = useMemo(() => todasRotasSistema(), []);
  const podeEditar = perfil ? isHubAdmin(perfil.cargo) : false;

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { usuarios: lista, error } = await listarUsuarios();
    if (error) setErro(error.message);
    else {
      setUsuarios(lista);
      setErro(null);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function abrirEdicao(u: Usuario) {
    setEditando(u);
    setNome(u.nome);
    setCargo(u.cargo);
    setAtivo(u.ativo);
    setPaginas(u.paginas_permitidas ?? []);
    setErro(null);
  }

  function togglePagina(rota: string) {
    setPaginas((prev) =>
      prev.includes(rota) ? prev.filter((p) => p !== rota) : [...prev, rota],
    );
  }

  async function salvar() {
    if (!editando || !podeEditar) return;
    setSalvando(true);
    const { error } = await atualizarUsuario(editando.id, {
      nome: nome.trim(),
      cargo,
      ativo,
      paginas_permitidas: cargo === 'Visualizador' ? paginas : null,
    });
    setSalvando(false);
    if (error) setErro(error.message);
    else {
      setEditando(null);
      void carregar();
    }
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter(
      (u) =>
        u.nome.toLowerCase().includes(q) ||
        u.login?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.cargo.toLowerCase().includes(q),
    );
  }, [usuarios, busca]);

  const totalAtivos = useMemo(
    () => usuarios.filter((u) => u.ativo).length,
    [usuarios],
  );

  return (
    <PageShell
      className="hub-page--denso"
      tag="Painel administrativo"
      titulo="Usuários"
      subtitulo={ADMIN_DESCRICAO}
    >
      <AdminSubnav />

      {!podeEditar ? (
        <p className="admin-aviso card">Apenas Desenvolvedor e Administrador podem editar usuários.</p>
      ) : null}

      {erro ? (
        <p className="erro" role="alert">
          {erro}
        </p>
      ) : null}

      <section className="admin-usuarios-panel card" aria-labelledby="admin-usuarios-titulo">
        <div className="admin-usuarios-panel__topo">
          <div>
            <h2 id="admin-usuarios-titulo" className="admin-usuarios-panel__titulo">
              Equipe com acesso
            </h2>
            <p className="admin-usuarios-panel__sub">
              Perfis vinculados ao Supabase Auth
            </p>
          </div>
          <div className="admin-usuarios-chips" aria-label="Resumo">
            <span className="admin-usuarios-chip">
              <strong>{usuarios.length}</strong> cadastrados
            </span>
            <span className="admin-usuarios-chip admin-usuarios-chip--ok">
              <strong>{totalAtivos}</strong> ativos
            </span>
            {busca.trim() ? (
              <span className="admin-usuarios-chip admin-usuarios-chip--filtro">
                <strong>{filtrados.length}</strong> na busca
              </span>
            ) : null}
          </div>
        </div>

        <div className="admin-usuarios-toolbar">
          <label className="admin-usuarios-busca">
            <span className="admin-usuarios-busca__icone" aria-hidden>
              ⌕
            </span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome, login, e-mail ou cargo…"
              aria-label="Buscar usuários"
            />
          </label>
        </div>

        <div className="admin-tabela-wrap admin-tabela-wrap--usuarios">
          <table className="admin-tabela admin-tabela--usuarios">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Login</th>
                <th>Cargo</th>
                <th>Status</th>
                {podeEditar ? <th className="admin-tabela__acao-th">Ações</th> : null}
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={podeEditar ? 5 : 4} className="admin-tabela-vazio">
                    Carregando usuários…
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={podeEditar ? 5 : 4} className="admin-tabela-vazio">
                    Nenhum usuário encontrado para esta busca.
                  </td>
                </tr>
              ) : (
                filtrados.map((u) => (
                  <tr key={u.id} className={!u.ativo ? 'admin-tabela-row--inativo' : undefined}>
                    <td>
                      <div className="admin-user-cell">
                        <HubAvatar
                          nome={u.nome}
                          avatarUrl={u.avatar_url}
                          size="sm"
                          className="admin-user-cell__avatar"
                        />
                        <div className="admin-user-cell__texto">
                          <span className="admin-user-cell__nome">{u.nome}</span>
                          <span className="admin-user-cell__email">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code className="admin-user-login">{u.login ?? '—'}</code>
                    </td>
                    <td>
                      <span
                        className={`admin-cargo-pill admin-cargo-pill--${tomCargo(u.cargo)}`}
                      >
                        {u.cargo}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${u.ativo ? 'admin-badge--ativo' : 'admin-badge--inativo'}`}
                      >
                        <span className="admin-badge__ponto" aria-hidden />
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    {podeEditar ? (
                      <td className="admin-tabela__acao-td">
                        <button
                          type="button"
                          className="admin-btn-ghost"
                          onClick={() => abrirEdicao(u)}
                        >
                          <span aria-hidden>✎</span>
                          Editar
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editando ? (
        <div className="admin-drawer admin-drawer--usuarios" role="dialog" aria-labelledby="admin-drawer-titulo">
          <header className="admin-drawer__header">
            <div className="admin-drawer__header-texto">
              <h3 id="admin-drawer-titulo">Editar usuário</h3>
              <p className="admin-drawer__meta">
                Login <strong>{editando.login ?? '—'}</strong>
                <span className="admin-drawer__sep">·</span>
                {editando.email}
              </p>
            </div>
            <HubAvatar nome={editando.nome} avatarUrl={editando.avatar_url} size="md" />
          </header>
          <div className="admin-form-grid">
            <label>
              Nome exibido
              <input value={nome} onChange={(e) => setNome(e.target.value)} />
            </label>
            <label>
              Cargo
              <select value={cargo} onChange={(e) => setCargo(e.target.value as CargoHub)}>
                {CARGOS_HUB.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field-check">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
              />
              Usuário ativo
            </label>
            {cargo === 'Visualizador' ? (
              <div className="admin-permissoes-wrap">
                <span className="admin-permissoes-label">Páginas permitidas</span>
                <div className="admin-permissoes">
                  {rotas.map((r) => (
                    <label key={r.rota}>
                      <input
                        type="checkbox"
                        checked={paginas.includes(r.rota)}
                        onChange={() => togglePagina(r.rota)}
                      />
                      {r.titulo}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="admin-form-acoes">
            <button type="button" className="btn" disabled={salvando} onClick={() => void salvar()}>
              {salvando ? 'Salvando…' : 'Salvar alterações'}
            </button>
            <button type="button" className="btn btn-secundario" onClick={() => setEditando(null)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      <p className="admin-usuarios-nota card">
        Novos logins são criados no Supabase Auth; o perfil em <code>usuarios</code> vincula
        automaticamente ou pode ser ajustado aqui.
      </p>
    </PageShell>
  );
}
