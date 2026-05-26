import { PASSOS_CRIADOR } from '@/lib/marketing/creator/constants';

interface CreatorStepperProps {
  passoAtual: number;
  onIrPara?: (passo: number) => void;
}

export function CreatorStepper({ passoAtual, onIrPara }: CreatorStepperProps) {
  return (
    <ol className="mkt-creator-stepper" aria-label="Etapas da criação">
      {PASSOS_CRIADOR.map((p) => {
        const ativo = p.id === passoAtual;
        const feito = p.id < passoAtual;
        return (
          <li key={p.id} className={ativo ? 'ativo' : feito ? 'feito' : ''}>
            <button
              type="button"
              className="mkt-creator-stepper-btn"
              onClick={() => onIrPara?.(p.id)}
              disabled={!onIrPara || p.id > passoAtual}
              title={p.subtitulo}
            >
              <span className="mkt-creator-stepper-num">{p.id}</span>
              <span className="mkt-creator-stepper-titulo">{p.titulo}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
