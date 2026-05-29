import { useEffect } from 'react';
import { PdvOverlay } from './PdvOverlay';

export type OperacaoPdv =
  | 'cancelar_itens'
  | 'cancelar_venda'
  | 'acres_desconto'
  | 'retiradas'
  | 'entradas'
  | 'orcamentos'
  | 'operador'
  | 'clientes'
  | 'funcoes'
  | 'leitura_x'
  | 'notas_emitidas'
  | 'vale_descontos'
  | 'ativar_entrega'
  | 'devolucao'
  | 'resumo_diario'
  | 'ver_cupons'
  | 'tabela_precos'
  | 'sair';

interface ItemOperacao {
  n: number;
  acao: OperacaoPdv;
  icone: string;
  rotulo: string;
}

const OPERACOES: ItemOperacao[] = [
  { n: 1, acao: 'cancelar_itens', icone: '🧾', rotulo: 'Cancelar Itens' },
  { n: 2, acao: 'cancelar_venda', icone: '🗑️', rotulo: 'Cancelar Venda' },
  { n: 3, acao: 'acres_desconto', icone: '➗', rotulo: 'Acrésc/Desconto' },
  { n: 4, acao: 'retiradas', icone: '📤', rotulo: 'Retiradas' },
  { n: 5, acao: 'entradas', icone: '📥', rotulo: 'Entradas' },
  { n: 6, acao: 'orcamentos', icone: '📄', rotulo: 'Orçamentos' },
  { n: 7, acao: 'operador', icone: '🧑‍💼', rotulo: 'Operador' },
  { n: 8, acao: 'clientes', icone: '👥', rotulo: 'Clientes' },
  { n: 9, acao: 'funcoes', icone: '⚙️', rotulo: 'Funções do PDV' },
  { n: 10, acao: 'leitura_x', icone: '📊', rotulo: 'Leitura X' },
  { n: 11, acao: 'notas_emitidas', icone: '☁️', rotulo: 'Notas Emitidas' },
  { n: 12, acao: 'vale_descontos', icone: '🏷️', rotulo: 'Vale Descontos' },
  { n: 13, acao: 'ativar_entrega', icone: '🚚', rotulo: 'Ativar Entrega' },
  { n: 14, acao: 'devolucao', icone: '↩️', rotulo: 'Devolução' },
  { n: 15, acao: 'resumo_diario', icone: '🗓️', rotulo: 'Resumo Diário' },
  { n: 16, acao: 'ver_cupons', icone: '👁️', rotulo: 'Ver Cupons' },
  { n: 17, acao: 'tabela_precos', icone: '💲', rotulo: 'Tabela de Preços' },
  { n: 18, acao: 'sair', icone: '⏻', rotulo: 'Sair do Sistema' },
];

interface PdvOperacoesMenuProps {
  onSelecionar: (acao: OperacaoPdv) => void;
  onFechar: () => void;
}

export function PdvOperacoesMenu({ onSelecionar, onFechar }: PdvOperacoesMenuProps) {
  useEffect(() => {
    let buffer = '';
    let timer: number | undefined;
    function onKey(e: KeyboardEvent) {
      if (!/^\d$/.test(e.key)) return;
      buffer += e.key;
      window.clearTimeout(timer);
      const tentar = () => {
        const n = Number(buffer);
        buffer = '';
        const item = OPERACOES.find((o) => o.n === n);
        if (item) onSelecionar(item.acao);
      };
      // espera breve para permitir dois dígitos (ex.: "11")
      timer = window.setTimeout(tentar, 350);
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(timer);
    };
  }, [onSelecionar]);

  return (
    <PdvOverlay titulo="Menu de Operações — F5" onFechar={onFechar} largura="xl">
      <p className="pdv-overlay__hint">Digite o número da opção desejada e pressione ENTER.</p>
      <div className="pdv-operacoes-grid">
        {OPERACOES.map((o) => (
          <button
            key={o.n}
            type="button"
            className="pdv-operacao-btn"
            onClick={() => onSelecionar(o.acao)}
          >
            <span className="pdv-operacao-num">{o.n}</span>
            <span className="pdv-operacao-icone" aria-hidden>
              {o.icone}
            </span>
            <span className="pdv-operacao-rotulo">{o.rotulo}</span>
          </button>
        ))}
      </div>
    </PdvOverlay>
  );
}
