import { useEffect, useState } from 'react';
import { FORMA_PAGAMENTO_LABEL, FORMAS_PAGAMENTO, formatarMoeda } from '@/lib/pedidos/constants';
import { apurarTurno, type ApuracaoTurno } from '@/lib/pdv/caixa';
import type { CaixaTurno } from '@/lib/pdv/types';
import { PdvOverlay } from './PdvOverlay';

interface PdvResumoDiarioProps {
  turno: CaixaTurno;
  modo: 'leitura_x' | 'resumo_diario';
  onFechar: () => void;
}

export function PdvResumoDiario({ turno, modo, onFechar }: PdvResumoDiarioProps) {
  const [apuracao, setApuracao] = useState<ApuracaoTurno | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    void apurarTurno(turno.id).then(({ apuracao: a }) => {
      setApuracao(a);
      setCarregando(false);
    });
  }, [turno.id]);

  const titulo = modo === 'leitura_x' ? 'Leitura X' : 'Resumo Diário';

  return (
    <PdvOverlay titulo={titulo} onFechar={onFechar} largura="md">
      <p className="pdv-overlay__hint">
        Caixa {turno.caixa_numero} — aberto em{' '}
        {new Date(turno.aberto_em).toLocaleString('pt-BR')}
      </p>
      {carregando || !apuracao ? (
        <p className="pdv-consulta-vazio">Apurando…</p>
      ) : (
        <div className="pdv-resumo">
          <div className="pdv-resumo-linha">
            <span>Vendas</span>
            <strong>{apuracao.qtdVendas}</strong>
          </div>
          <div className="pdv-resumo-linha pdv-resumo-linha--destaque">
            <span>Total vendido</span>
            <strong>{formatarMoeda(apuracao.totalVendas)}</strong>
          </div>
          <hr className="pdv-resumo-sep" />
          {FORMAS_PAGAMENTO.map((forma) => (
            <div key={forma} className="pdv-resumo-linha">
              <span>{FORMA_PAGAMENTO_LABEL[forma]}</span>
              <strong>{formatarMoeda(apuracao.vendasPorForma[forma])}</strong>
            </div>
          ))}
          <hr className="pdv-resumo-sep" />
          <div className="pdv-resumo-linha">
            <span>Abertura + suprimentos</span>
            <strong>
              {formatarMoeda(turno.valor_abertura + apuracao.suprimentos)}
            </strong>
          </div>
          <div className="pdv-resumo-linha">
            <span>Sangrias</span>
            <strong>- {formatarMoeda(apuracao.sangrias)}</strong>
          </div>
          <div className="pdv-resumo-linha pdv-resumo-linha--destaque">
            <span>Saldo em dinheiro (gaveta)</span>
            <strong>{formatarMoeda(apuracao.saldoDinheiro)}</strong>
          </div>
        </div>
      )}
    </PdvOverlay>
  );
}
