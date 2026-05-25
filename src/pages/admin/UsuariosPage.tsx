import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { usePerfil } from '@/contexts/PerfilContext';
import { ADMIN_DESCRICAO } from '@/lib/admin/modulos';
import { atualizarUsuario, isHubAdmin, listarUsuarios } from '@/lib/admin/usuariosApi';
import { todasRotasSistema } from '@/lib/apps';
import { CARGOS_HUB } from '@/lib/cargos';
import type { CargoHub, Usuario } from '@/types/database';
import { AdminSubnav } from '@/pages/admin/AdminSubnav';
import './admin.css';

export function UsuariosPage() {
  const { usuario: perfil } = usePerfil();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
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
    const { usuarios: lista, error } = await listarUsuarios();
    if (error) setErro(error.message);
    else {
      setUsuarios(lista);
      setErro(null);
    }
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

  const filtrados = usuarios.filter((u) => {
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    return (
      u.nome.toLowerCase().includes(q) ||
      u.login?.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.cargo.toLowerCase().includes(q)
    );
  });

  return (
    <PageShell
      className="hub-page--denso"
      tag="Painel administrativo"
      titulo="Usuários"
      subtitulo={ADMIN_DESCRICAO}
    >
      <AdminSubnav />

      {!podeEditar ? (
        <p className="card">Apenas Desenvolvedor e Administrador podem editar usuários.</p>
      ) : null}

      {erro ? <p className="erro">{erro}</p> : null}

      <label className="admin-busca">
        Buscar
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Nome, login ou cargo"
        />
      </label>

      <div className="admin-tabela-wrap">
        <table className="admin-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Login</th>
              <th>Cargo</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtrados.map((u) => (
              <tr key={u.id}>
                <td>{u.nome}</td>
                <td>{u.login ?? '—'}</td>
                <td>{u.cargo}</td>
                <td>
                  <span
                    className={`admin-badge ${u.ativo ? 'admin-badge--ativo' : 'admin-badge--inativo'}`}
                  >
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>
                  {podeEditar ? (
                    <button type="button" className="btn btn-secundario" onClick={() => abrirEdicao(u)}>
                      Editar
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editando ? (
        <div className="admin-drawer">
          <h3>Editar — {editando.login ?? editando.nome}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--hub-muted)', margin: '0 0 0.75rem' }}>
            E-mail Auth: {editando.email}
          </p>
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
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
              Usuário ativo
            </label>
            {cargo === 'Visualizador' ? (
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--hub-muted)' }}>
                  Páginas permitidas
                </span>
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
              Salvar
            </button>
            <button type="button" className="btn btn-secundario" onClick={() => setEditando(null)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      <p className="card" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
        Novos logins são criados no Supabase Auth; o perfil em <code>usuarios</code> vincula
        automaticamente ou pode ser ajustado aqui.
      </p>
    </PageShell>
  );
}
