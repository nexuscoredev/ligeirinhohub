import { Link } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { usePerfil } from '@/contexts/PerfilContext';

const atalhos = [
  { titulo: 'Dashboard', rota: '/dashboard', icone: '📊', desc: 'KPIs e visão do dia' },
  { titulo: 'Produtos', rota: '/produtos', icone: '🍺', desc: 'Cadastro e preços' },
  { titulo: 'Pedidos', rota: '/pedidos', icone: '📦', desc: 'Vendas e fila única' },
  { titulo: 'Operacional', rota: '/operacional', icone: '⚡', desc: 'Preparo e despacho' },
];

export function BemVindoPage() {
  const { usuario } = usePerfil();
  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'usuário';

  return (
    <PageShell
      comLogo
      tag="Hub administrativo"
      titulo={
        <>
          Bem-vindo, {primeiroNome}
        </>
      }
      subtitulo="Um pedido, um ID, um banco — PDV, totem e delivery no mesmo ecossistema."
      acoes={
        <Link to="/dashboard" className="btn">
          Ir ao dashboard
        </Link>
      }
    >
      <div className="hub-grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <p style={{ margin: '0 0 0.5rem', color: 'var(--hub-muted)' }}>
            Seu perfil
          </p>
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
            {usuario?.nome}
          </p>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--hub-gold)' }}>
            {usuario?.cargo}
          </p>
        </div>
        <div className="card">
          <p style={{ margin: '0 0 0.5rem', color: 'var(--hub-muted)' }}>
            Fase 1 — MVP
          </p>
          <p style={{ margin: 0 }}>
            Produtos, pedidos, PDV, operacional com Realtime e totem (pagar no
            caixa).
          </p>
        </div>
      </div>

      <div className="hub-secao-header">
        <h2 className="hub-secao-titulo">
          Acesso <span>rápido</span>
        </h2>
      </div>
      <div className="hub-grid-4">
        {atalhos.map((item) => (
          <Link key={item.rota} to={item.rota} className="hub-modulo-card">
            <span className="hub-modulo-icone" aria-hidden>
              {item.icone}
            </span>
            <strong>{item.titulo}</strong>
            <em>{item.desc}</em>
          </Link>
        ))}
      </div>

      <p className="hub-banner">
        Marca oficial <strong>Ligeirinho Bebidas</strong> — mesmo padrão visual do
        site e catálogo, aplicado ao painel administrativo.
      </p>
    </PageShell>
  );
}
