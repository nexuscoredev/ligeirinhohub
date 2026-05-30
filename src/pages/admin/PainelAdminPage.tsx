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
  '/admin/estrategico': 'KPIs executivos e visão do negócio',
  '/admin/dashboard': 'KPIs e indicadores do dia',
  '/admin/relatorios': 'Painel gerencial, vendas e fiscal',
  '/admin/catalogo': 'Produtos visíveis e preços por tabela',
  '/admin/config': 'Empresa, caixas PDV e envio XML',
  '/admin/produtos': 'Catálogo, preços e categorias',
  '/admin/usuarios': 'Cargos, acesso e permissões',
  '/admin/sistemas': 'Status de conexões e integrações',
};

export function PainelAdminPage() {
  const { usuario } = usePerfil();
  const [stats, setStats] = useState({ usuarios: '—', produtos: '—', clientes: '—' });
  const [atualizando, setAtualizando] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  const modulos = usuario
    ? HUB_ADMIN_MODULOS.filter(
        (m) =>
          m.rota !== '/admin' &&
          itemHubPermitido(m, usuario.cargo, usuario.paginas_permitidas, usuario.email),
      )
    : [];

  const carregarResumo = () => {
    setAtualizando(true);
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
      setUltimaAtualizacao(new Date());
      setAtualizando(false);
    });
  };

  useEffect(() => {
    carregarResumo();
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

      <section className="admin-resumo" aria-label="Resumo rápido">
        <div className="card admin-resumo-card">
          <div className="admin-resumo-topo">
            <div className="admin-resumo-kpis" aria-label="Indicadores principais">
              <div className="admin-resumo-kpi">
                <strong>{stats.usuarios}</strong>
                <span>usuários</span>
              </div>
              <div className="admin-resumo-kpi">
                <strong>{stats.produtos}</strong>
                <span>produtos</span>
              </div>
              <div className="admin-resumo-kpi">
                <strong>{stats.clientes}</strong>
                <span>clientes</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secundario admin-resumo-atualizar"
              onClick={() => carregarResumo()}
              disabled={atualizando}
              aria-label="Atualizar resumo"
              title="Atualizar números"
            >
              {atualizando ? 'Atualizando…' : 'Atualizar'}
            </button>
          </div>

          <div className="admin-resumo-rodape">
            <span className="admin-resumo-meta">
              {ultimaAtualizacao
                ? `Atualizado às ${ultimaAtualizacao.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Carregando…'}
            </span>
            <span className="admin-resumo-meta admin-resumo-meta--dica">
              Dica: use os módulos abaixo para ir direto ao que precisa.
            </span>
          </div>
        </div>
      </section>

      <section aria-labelledby="admin-modulos-titulo">
        <div className="hub-secao-header">
          <h2 id="admin-modulos-titulo" className="hub-secao-titulo">
            Módulos <span>do painel</span>
          </h2>
        </div>
        <div className="admin-modulos-grid">
          {modulos.map((m) => (
            <Link key={m.rota} to={m.rota} className="admin-modulo-card">
              <div className="admin-modulo-card__topo">
                <strong>{m.titulo}</strong>
                <span aria-hidden className="admin-modulo-card__icone">
                  {m.icone}
                </span>
              </div>
              <em>{MODULO_DESC[m.rota] ?? 'Abrir módulo'}</em>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
