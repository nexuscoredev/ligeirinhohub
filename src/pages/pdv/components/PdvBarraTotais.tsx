import { formatarMoeda } from '@/lib/pedidos/constants';
import type { LinhaVenda } from '@/lib/pdv/types';

interface PdvBarraTotaisProps {
  ultimaLinha: LinhaVenda | null;
  total: number;
}

export function PdvBarraTotais({ ultimaLinha, total }: PdvBarraTotaisProps) {
  const qty = ultimaLinha?.qty ?? 0;
  const unit = ultimaLinha?.preco_unitario ?? 0;
  return (
    <div className="pdv-barra-totais">
      <div className="pdv-barra-bloco">
        <span className="pdv-barra-rotulo">Quantidade x Unitário</span>
        <span className="pdv-barra-valor pdv-barra-valor--sec">
          {qty} x {formatarMoeda(unit)}
        </span>
      </div>
      <div className="pdv-barra-bloco">
        <span className="pdv-barra-rotulo">Total do item</span>
        <span className="pdv-barra-valor pdv-barra-valor--sec">
          {formatarMoeda(qty * unit)}
        </span>
      </div>
      <div className="pdv-barra-bloco pdv-barra-bloco--total">
        <span className="pdv-barra-rotulo">Total a pagar</span>
        <span className="pdv-barra-valor pdv-barra-valor--total">
          {formatarMoeda(total)}
        </span>
      </div>
    </div>
  );
}
