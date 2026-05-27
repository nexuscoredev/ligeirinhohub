import { useTema } from '@/contexts/TemaContext';
import type { Tema } from '@/lib/tema';
import './TemaToggle.css';

interface TemaToggleProps {
  compacto?: boolean;
  className?: string;
}

const OPCOES: { id: Tema; rotulo: string; icone: string }[] = [
  { id: 'dark', rotulo: 'Escuro', icone: '🌙' },
  { id: 'light', rotulo: 'Claro', icone: '☀️' },
];

export function TemaToggle({ compacto = false, className = '' }: TemaToggleProps) {
  const { tema, definirTema } = useTema();

  if (compacto) {
    const proximo = tema === 'dark' ? 'light' : 'dark';
    const atual = OPCOES.find((o) => o.id === tema)!;
    const prox = OPCOES.find((o) => o.id === proximo)!;

    return (
      <button
        type="button"
        className={`tema-toggle tema-toggle--compacto ${className}`.trim()}
        onClick={() => definirTema(proximo)}
        aria-label={`Tema ${atual.rotulo}. Alternar para ${prox.rotulo.toLowerCase()}.`}
        title={`Tema ${atual.rotulo}`}
      >
        <span aria-hidden>{atual.icone}</span>
      </button>
    );
  }

  return (
    <div
      className={`tema-toggle tema-toggle--segmentado ${className}`.trim()}
      role="group"
      aria-label="Tema da interface"
    >
      {OPCOES.map((opcao) => (
        <button
          key={opcao.id}
          type="button"
          className={`tema-toggle__opcao${tema === opcao.id ? ' ativo' : ''}`}
          aria-pressed={tema === opcao.id}
          onClick={() => definirTema(opcao.id)}
        >
          <span className="tema-toggle__icone" aria-hidden>
            {opcao.icone}
          </span>
          {opcao.rotulo}
        </button>
      ))}
    </div>
  );
}
