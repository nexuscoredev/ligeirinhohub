import './SistemaStatusBadge.css';

interface SistemaStatusBadgeProps {
  nome: string;
  label: string;
  ok?: boolean;
}

/** Pill escuro com ponto verde quando conectado (ex.: Supabase: conectado). */
export function SistemaStatusBadge({ nome, label, ok = false }: SistemaStatusBadgeProps) {
  return (
    <div
      className={`sistema-status-badge ${ok ? 'ok' : ''}`}
      role="status"
    >
      <span className="sistema-status-badge-dot" aria-hidden />
      {nome}: <strong>{label}</strong>
    </div>
  );
}
