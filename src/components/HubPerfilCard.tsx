import { iniciaisNome } from '@/lib/iniciaisNome';
import './HubPerfilCard.css';

interface HubPerfilCardProps {
  nome: string;
  cargo: string;
  className?: string;
}

export function HubPerfilCard({ nome, cargo, className }: HubPerfilCardProps) {
  const classes = ['hub-perfil-card', className].filter(Boolean).join(' ');

  return (
    <div className={classes} aria-label="Seu perfil">
      <div className="hub-perfil-card__avatar" aria-hidden>
        <span className="hub-perfil-card__iniciais">{iniciaisNome(nome)}</span>
      </div>
      <div className="hub-perfil-card__info">
        <p className="hub-perfil-card__nome" title={nome}>
          {nome}
        </p>
        <span className="hub-perfil-card__badge">{cargo}</span>
      </div>
    </div>
  );
}
