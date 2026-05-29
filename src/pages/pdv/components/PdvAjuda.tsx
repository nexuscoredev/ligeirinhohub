import { PdvOverlay } from './PdvOverlay';

const TECLAS: { tecla: string; descricao: string }[] = [
  { tecla: 'F1', descricao: 'Menu de Ajuda' },
  { tecla: 'F2', descricao: 'Consulta por Código' },
  { tecla: 'F3', descricao: 'Finalizar Venda direto em Dinheiro' },
  { tecla: 'F4', descricao: 'Finalizar Venda em Outras Formas de Pagamento' },
  { tecla: 'F5', descricao: 'Menu de Operações' },
  { tecla: 'F6', descricao: 'Pausar Venda' },
  { tecla: 'F7', descricao: 'Pausar para Entrega' },
  { tecla: 'F10', descricao: 'Informar CPF Consumidor' },
  { tecla: 'F11', descricao: 'Notas Emitidas' },
  { tecla: 'ESC', descricao: 'Fechar / Voltar' },
];

export function PdvAjuda({ onFechar }: { onFechar: () => void }) {
  return (
    <PdvOverlay titulo="Menu de Ajuda" onFechar={onFechar} largura="lg">
      <p className="pdv-overlay__hint">
        Atalhos de teclado disponíveis no PDV. O campo de código fica sempre em foco para o
        leitor de código de barras.
      </p>
      <ul className="pdv-ajuda-lista">
        {TECLAS.map((t) => (
          <li key={t.tecla}>
            <kbd>{t.tecla}</kbd>
            <span>{t.descricao}</span>
          </li>
        ))}
      </ul>
    </PdvOverlay>
  );
}
