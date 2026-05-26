import { Navigate, useLocation } from 'react-router-dom';
import { HubLogo } from '@/components/HubLogo';
import { usePerfil } from '@/contexts/PerfilContext';
import { paginaPermitida } from '@/lib/paginasSistema';

export function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { session, usuario, carregando, erro } = usePerfil();
  const location = useLocation();

  const aguardandoPerfil = Boolean(session && !usuario && !erro);

  if (carregando || aguardandoPerfil) {
    return (
      <div className="estado-central">
        <HubLogo size="lg" glow />
        <span className="hub-tag">Carregando</span>
        <p>Preparando seu perfil…</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (erro || !usuario) {
    return (
      <div className="estado-central">
        <div className="card" style={{ maxWidth: 440, textAlign: 'left' }}>
          <h2 style={{ margin: '0 0 0.5rem' }}>Perfil indisponível</h2>
          <p className="erro">{erro ?? 'Perfil não carregado.'}</p>
          <p style={{ color: 'var(--hub-muted)', fontSize: '0.9rem', margin: 0 }}>
            Confirme que a migração do Supabase foi aplicada e que existe um
            registro em <code>usuarios</code> com o mesmo id do Auth.
          </p>
        </div>
      </div>
    );
  }

  const permitido = paginaPermitida(
    location.pathname,
    usuario.cargo,
    usuario.paginas_permitidas,
    usuario.email,
  );

  if (!permitido) {
    return <Navigate to="/bem-vindo" replace />;
  }

  return children;
}
