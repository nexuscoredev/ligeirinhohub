import { NavLink } from 'react-router-dom';
import { HubAvatar } from '@/components/HubAvatar';
import './HubPerfilButton.css';

interface HubPerfilButtonProps {
  nome: string;
  cargo: string;
  avatarUrl?: string | null;
  className?: string;
  /** Avatar maior no desktop */
  size?: 'sm' | 'md';
}

export function HubPerfilButton({
  nome,
  cargo,
  avatarUrl,
  className = '',
  size = 'md',
}: HubPerfilButtonProps) {
  return (
    <NavLink
      to="/perfil"
      className={({ isActive }) =>
        [
          'hub-perfil-btn',
          size === 'md' ? 'hub-perfil-btn--size-md' : '',
          isActive ? 'hub-perfil-btn--ativo' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')
      }
      title={`Meu perfil — ${nome}`}
      aria-label={`Meu perfil, ${cargo}`}
    >
      <span className="hub-perfil-btn__halo" aria-hidden />
      <span className="hub-perfil-btn__anel" aria-hidden />
      <HubAvatar
        nome={nome}
        avatarUrl={avatarUrl}
        size={size}
        className="hub-perfil-btn__avatar"
      />
    </NavLink>
  );
}
