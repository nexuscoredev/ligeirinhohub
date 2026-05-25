import { LOGO_OFICIAL, MARCA_NOME } from '@/lib/brand';
import './HubLogo.css';

export type HubLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';

interface HubLogoProps {
  size?: HubLogoSize;
  /** Exibe selo "Hub" no canto (painel administrativo) */
  badgeHub?: boolean;
  glow?: boolean;
  className?: string;
  alt?: string;
}

export function HubLogo({
  size = 'md',
  badgeHub = false,
  glow = false,
  className = '',
  alt = MARCA_NOME,
}: HubLogoProps) {
  const classes = [
    'hub-logo',
    `hub-logo--${size}`,
    glow ? 'hub-logo-glow' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <img src={LOGO_OFICIAL} alt={alt} width={500} height={500} decoding="async" />
      {badgeHub ? <span className="hub-logo-badge">Hub</span> : null}
    </div>
  );
}
