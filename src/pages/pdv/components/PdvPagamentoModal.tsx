import { useMemo, useState } from 'react';
import {
  FORMA_PAGAMENTO_LABEL,
  FORMAS_PAGAMENTO,
  formatarMoeda,
} from '@/lib/pedidos/constants';
import type { FormaPagamento, PagamentoSplitLinha } from '@/types/pedidos';
import { PdvOverlay } from './PdvOverlay';

interface PdvPagamentoModalProps {
  total: number;
  modo: 'dinheiro' | 'outras';
  cpfConsumidor: string | null;
  enviando: boolean;
  onConfirmar: (split: PagamentoSplitLinha[], emitirNfce: boolean) => void;
  onFechar: () => void;
}

type ValoresSplit = Record<FormaPagamento, number>;

function valoresIniciais(total: number, modo: 'dinheiro' | 'outras'): ValoresSplit {
  const base = { dinheiro: 0, pix: 0, cartao_debito: 0, cartao_credito: 0 } as ValoresSplit;
  if (modo === 'dinheiro') base.dinheiro = total;
  return base;
}

export function PdvPagamentoModal({
  total,
  modo,
  cpfConsumidor,
  enviando,
  onConfirmar,
  onFechar,
}: PdvPagamentoModalProps) {
  const [valores, setValores] = useState<ValoresSplit>(() => valoresIniciais(total, modo));
  const [emitirNfce, setEmitirNfce] = useState(true);

  const soma = useMemo(
    () => FORMAS_PAGAMENTO.reduce((acc, f) => acc + (valores[f] || 0), 0),
    [valores],
  );
  const restante = Math.round((total - soma) * 100) / 100;
  const troco = soma > total ? Math.round((soma - total) * 100) / 100 : 0;
  // Troco só é válido em dinheiro; cartão/pix não geram troco.
  const excedenteNaoDinheiro =
    soma - (valores.dinheiro || 0) > total + 0.001;
  const ok = soma >= total - 0.001 && !excedenteNaoDinheiro;

  function confirmar() {
    const split: PagamentoSplitLinha[] = FORMAS_PAGAMENTO.map((forma) => ({
      forma,
      valor:
        forma === 'dinheiro' && troco > 0
          ? Math.round(((valores.dinheiro || 0) - troco) * 100) / 100
          : valores[forma] || 0,
    })).filter((l) => l.valor > 0);
    onConfirmar(split, emitirNfce);
  }

  return (
    <PdvOverlay
      titulo={modo === 'dinheiro' ? 'Finalizar — Dinheiro (F3)' : 'Finalizar — Outras formas (F4)'}
      onFechar={onFechar}
      largura="md"
    >
      <div className="pdv-pag-total">
        <span>Total a pagar</span>
        <strong>{formatarMoeda(total)}</strong>
      </div>

      <div className="pdv-pag-rows">
        {FORMAS_PAGAMENTO.map((forma) => (
          <label key={forma} className="pdv-pag-row">
            <span>{FORMA_PAGAMENTO_LABEL[forma]}</span>
            <input
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={valores[forma] || ''}
              onChange={(e) =>
                setValores((prev) => ({
                  ...prev,
                  [forma]: e.target.value === '' ? 0 : Number(e.target.value),
                }))
              }
            />
          </label>
        ))}
      </div>

      <div className="pdv-pag-resumo">
        <div>
          <span>Recebido</span>
          <strong>{formatarMoeda(soma)}</strong>
        </div>
        {restante > 0 ? (
          <div className="pdv-pag-resumo--falta">
            <span>Falta</span>
            <strong>{formatarMoeda(restante)}</strong>
          </div>
        ) : null}
        {troco > 0 ? (
          <div className="pdv-pag-resumo--troco">
            <span>Troco</span>
            <strong>{formatarMoeda(troco)}</strong>
          </div>
        ) : null}
      </div>

      {excedenteNaoDinheiro ? (
        <p className="pdv-pag-aviso">Apenas dinheiro pode exceder o total (troco).</p>
      ) : null}

      <label className="pdv-pag-nfce">
        <input
          type="checkbox"
          checked={emitirNfce}
          onChange={(e) => setEmitirNfce(e.target.checked)}
        />
        Emitir NFC-e {cpfConsumidor ? `(CPF ${cpfConsumidor})` : '(sem CPF)'}
      </label>

      <div className="pdv-pag-acoes">
        <button type="button" className="pdv-btn-secundario" onClick={onFechar}>
          Cancelar (ESC)
        </button>
        <button
          type="button"
          className="pdv-btn-primario"
          disabled={!ok || enviando}
          onClick={confirmar}
        >
          {enviando ? 'Processando…' : 'Confirmar venda'}
        </button>
      </div>
    </PdvOverlay>
  );
}
