import { NavLink } from 'react-router-dom';
import { HubAvatar } from '@/components/HubAvatar';
import './HubPerfilCard.css';

interface HubPerfilCardProps {
  nome: string;
  cargo: string;
  avatarUrl?: string | null;
  className?: string;
  /** Se informado, o card vira link para a página de perfil */
  linkTo?: string;
}

export function HubPerfilCard({
  nome,
  cargo,
  avatarUrl,
  className,
  linkTo,
}: HubPerfilCardProps) {
  const classes = [
    'hub-perfil-card',
    linkTo ? 'hub-perfil-card--link' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const conteudo = (
    <>
      <HubAvatar nome={nome} avatarUrl={avatarUrl} size="sm" />
      <div className="hub-perfil-card__info">
        <p className="hub-perfil-card__nome" title={nome}>
          {nome}
        </p>
        <span className="hub-perfil-card__badge">{cargo}</span>
      </div>
    </>
  );

  if (linkTo) {
    return (
      <NavLink to={linkTo} className={classes} aria-label="Abrir meu perfil">
        {conteudo}
      </NavLink>
    );
  }

  return (
    <div className={classes} aria-label="Seu perfil">
      {conteudo}
    </div>
  );
}
