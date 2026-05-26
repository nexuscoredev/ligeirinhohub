import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { usePerfil } from '@/contexts/PerfilContext';
import { fetchCatalogoLegado } from '@/lib/catalogo/fetchCatalogo';
import { ADMIN_DESCRICAO, HUB_ADMIN_MODULOS } from '@/lib/admin/modulos';
import { listarUsuarios } from '@/lib/admin/usuariosApi';
import { itemHubPermitido } from '@/lib/apps';
import { listarClientes } from '@/lib/pedidos/api';
import { AdminSubnav } from '@/pages/admin/AdminSubnav';
import './admin.css';

const MODULO_DESC: Record<string, string> = {
  '/admin': 'Central do painel e atalhos',
  '/admin/dashboard': 'KPIs e indicadores do dia',
  '/admin/produtos': 'Catálogo, preços e categorias',
  '/admin/usuarios': 'Cargos, acesso e permissões',
  '/admin/sistemas': 'Status de conexões e integrações',
};

export function PainelAdminPage() {
  const { usuario } = usePerfil();
  const [stats, setStats] = useState({ usuarios: '—', produtos: '—', clientes: '—' });

  const modulos = usuario
    ? HUB_ADMIN_MODULOS.filter(
        (m) =>
          m.rota !== '/admin' &&
          itemHubPermitido(m, usuario.cargo, usuario.paginas_permitidas, usuario.email),
      )
    : [];

  useEffect(() => {
    void Promise.all([
      listarUsuarios(),
      fetchCatalogoLegado().catch(() => null),
      listarClientes(),
    ]).then(([u, catalogo, c]) => {
      setStats({
        usuarios: u.error ? '—' : String(u.usuarios.length),
        produtos: catalogo ? String(catalogo.totalProducts) : '—',
        clientes: String(c.clientes.length),
      });
    });
  }, []);

  return (
    <PageShell
      className="hub-page--denso"
      tag="Painel administrativo"
      titulo={
        <>
          Visão <span>geral</span>
        </>
      }
      subtitulo={ADMIN_DESCRICAO}
    >
      <AdminSubnav />

      <div className="dashboard-topo" style={{ marginBottom: '1.25rem' }}>
        <div className="hub-stat-card">
          <strong>{stats.usuarios}</strong>
          <span>usuários</span>
        </div>
        <div className="hub-stat-card">
          <strong>{stats.produtos}</strong>
          <span>produtos</span>
        </div>
        <div className="hub-stat-card">
          <strong>{stats.clientes}</strong>
          <span>clientes</span>
        </div>
      </div>

      <section aria-labelledby="admin-modulos-titulo">
        <div className="hub-secao-header">
          <h2 id="admin-modulos-titulo" className="hub-secao-titulo">
            Módulos <span>do painel</span>
          </h2>
        </div>
        <div className="admin-modulos-grid">
          {modulos.map((m) => (
            <Link key={m.rota} to={m.rota} className="admin-modulo-card">
              <span aria-hidden>{m.icone}</span>
              <strong>{m.titulo}</strong>
              <em>{MODULO_DESC[m.rota] ?? 'Abrir módulo'}</em>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
