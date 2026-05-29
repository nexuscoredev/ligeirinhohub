import { PdvOverlay } from './PdvOverlay';

export type FuncaoPdv =
  | 'abrir_gaveta'
  | 'identificar_vendedor'
  | 'preco_atacado'
  | 'pausar_venda'
  | 'pausar_entrega'
  | 'cancelar_tef';

interface ItemFuncao {
  n: number;
  acao: FuncaoPdv;
  icone: string;
  rotulo: string;
}

const FUNCOES: ItemFuncao[] = [
  { n: 1, acao: 'abrir_gaveta', icone: '🔓', rotulo: 'Abrir Gaveta' },
  { n: 2, acao: 'identificar_vendedor', icone: '🧑‍💼', rotulo: 'Identificar Vendedor(a)' },
  { n: 3, acao: 'preco_atacado', icone: '🔁', rotulo: 'Ativar Preço Atacado' },
  { n: 4, acao: 'pausar_venda', icone: '⏸️', rotulo: 'Pausar Venda (F6)' },
  { n: 5, acao: 'pausar_entrega', icone: '🚚', rotulo: 'Pausar para Entrega (F7)' },
  { n: 6, acao: 'cancelar_tef', icone: '💳', rotulo: 'Cancelar Operação TEF' },
];

interface PdvFuncoesMenuProps {
  precoAtacadoAtivo: boolean;
  onSelecionar: (acao: FuncaoPdv) => void;
  onFechar: () => void;
}

export function PdvFuncoesMenu({
  precoAtacadoAtivo,
  onSelecionar,
  onFechar,
}: PdvFuncoesMenuProps) {
  return (
    <PdvOverlay titulo="Funções do PDV" onFechar={onFechar} largura="md">
      <p className="pdv-overlay__hint">Digite o número da opção desejada.</p>
      <div className="pdv-funcoes-lista">
        {FUNCOES.map((f) => (
          <button
            key={f.n}
            type="button"
            className="pdv-funcao-btn"
            onClick={() => onSelecionar(f.acao)}
          >
            <span className="pdv-operacao-num">{f.n}</span>
            <span className="pdv-operacao-icone" aria-hidden>
              {f.icone}
            </span>
            <span className="pdv-operacao-rotulo">{f.rotulo}</span>
            {f.acao === 'preco_atacado' && precoAtacadoAtivo ? (
              <span className="pdv-funcao-tag">ATIVO</span>
            ) : null}
          </button>
        ))}
      </div>
    </PdvOverlay>
  );
}
