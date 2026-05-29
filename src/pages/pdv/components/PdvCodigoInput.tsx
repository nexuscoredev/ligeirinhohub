import { forwardRef, useState } from 'react';

interface PdvCodigoInputProps {
  disabled?: boolean;
  onAdicionar: (codigo: string, qty: number) => void;
  onConsulta: () => void;
}

/**
 * Campo de leitor/código do PDV. Aceita:
 *  - "7891234567890"        → 1 un do produto
 *  - "3*7891234567890"      → 3 un (quantidade * código)
 *  - "3x7891234567890"      → idem
 */
export const PdvCodigoInput = forwardRef<HTMLInputElement, PdvCodigoInputProps>(
  function PdvCodigoInput({ disabled, onAdicionar, onConsulta }, ref) {
    const [valor, setValor] = useState('');

    function submeter() {
      const bruto = valor.trim();
      if (!bruto) return;
      const m = bruto.match(/^(\d+(?:[.,]\d+)?)\s*[*xX]\s*(.+)$/);
      let qty = 1;
      let codigo = bruto;
      if (m) {
        qty = Number(m[1].replace(',', '.')) || 1;
        codigo = m[2].trim();
      }
      onAdicionar(codigo, qty);
      setValor('');
    }

    return (
      <div className="pdv-codigo">
        <button
          type="button"
          className="pdv-codigo-consulta"
          onClick={onConsulta}
          disabled={disabled}
          title="Consulta de produtos (F2)"
          aria-label="Consulta de produtos"
        >
          🔍
        </button>
        <input
          ref={ref}
          className="pdv-codigo-input"
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="Código de barras ou código do produto…"
          value={valor}
          disabled={disabled}
          onChange={(e) => setValor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submeter();
            }
          }}
        />
      </div>
    );
  },
);
