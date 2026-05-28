import { iniciaisNome } from '@/lib/iniciaisNome';
import './HubAvatar.css';

export type HubAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface HubAvatarProps {
  nome: string;
  avatarUrl?: string | null;
  size?: HubAvatarSize;
  className?: string;
}

export function HubAvatar({
  nome,
  avatarUrl,
  size = 'md',
  className = '',
}: HubAvatarProps) {
  const classes = ['hub-avatar', `hub-avatar--${size}`, className].filter(Boolean).join(' ');

  return (
    <div className={classes} aria-hidden>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" decoding="async" />
      ) : (
        <span className="hub-avatar__iniciais">{iniciaisNome(nome)}</span>
      )}
    </div>
  );
}
