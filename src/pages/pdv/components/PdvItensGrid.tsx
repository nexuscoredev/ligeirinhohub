import { formatarMoeda } from '@/lib/pedidos/constants';
import type { LinhaVenda } from '@/lib/pdv/types';

interface PdvItensGridProps {
  linhas: LinhaVenda[];
  selecionada: number | null;
  onSelecionar: (seq: number) => void;
}

export function PdvItensGrid({ linhas, selecionada, onSelecionar }: PdvItensGridProps) {
  return (
    <div className="pdv-grid-wrap">
      <table className="pdv-grid" aria-label="Itens da venda">
        <thead>
          <tr>
            <th className="pdv-col-item">Item</th>
            <th className="pdv-col-codigo">Código</th>
            <th className="pdv-col-desc">Descrição</th>
            <th className="pdv-col-unid">Unid.</th>
            <th className="pdv-col-num">Unit. (R$)</th>
            <th className="pdv-col-num">Quant.</th>
            <th className="pdv-col-num">Total</th>
          </tr>
        </thead>
        <tbody>
          {linhas.length === 0 ? (
            <tr className="pdv-grid-vazio">
              <td colSpan={7}>
                Próximo cliente! Leia o código de barras ou digite o código do produto.
              </td>
            </tr>
          ) : (
            linhas.map((l) => (
              <tr
                key={l.seq}
                className={selecionada === l.seq ? 'ativa' : undefined}
                onClick={() => onSelecionar(l.seq)}
              >
                <td className="pdv-col-item">{String(l.seq).padStart(3, '0')}</td>
                <td className="pdv-col-codigo">{l.codigo}</td>
                <td className="pdv-col-desc">{l.descricao}</td>
                <td className="pdv-col-unid">{l.unidade}</td>
                <td className="pdv-col-num">{formatarMoeda(l.preco_unitario)}</td>
                <td className="pdv-col-num">{l.qty}</td>
                <td className="pdv-col-num pdv-col-total">
                  {formatarMoeda(l.preco_unitario * l.qty)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
