import { createPortal } from 'react-dom';
import { FORMA_PAGAMENTO_LABEL, formatarMoeda } from '@/lib/pedidos/constants';
import type { ResultadoFiscal } from '@/lib/pdv/fiscal';
import type { LinhaVenda } from '@/lib/pdv/types';
import type { PagamentoSplitLinha } from '@/types/pedidos';

interface PdvCupomProps {
  numero: number;
  linhas: LinhaVenda[];
  total: number;
  pagamento: PagamentoSplitLinha[];
  troco: number;
  fiscal: ResultadoFiscal | null;
  onFechar: () => void;
}

export function PdvCupom({
  numero,
  linhas,
  total,
  pagamento,
  troco,
  fiscal,
  onFechar,
}: PdvCupomProps) {
  function imprimir() {
    window.print();
  }

  return createPortal(
    <div className="pdv-cupom-overlay" role="dialog" aria-modal="true" aria-label="Comprovante">
      <div className="pdv-cupom-overlay__backdrop" onClick={onFechar} />
      <div className="pdv-cupom-painel">
        <div className="pdv-cupom" id="pdv-cupom-print">
          <div className="pdv-cupom-cab">
            <strong>LICORINHO BEBIDAS</strong>
            <span>Comprovante de venda</span>
            <span>Venda #{numero}</span>
            <span>{new Date().toLocaleString('pt-BR')}</span>
          </div>
          <table className="pdv-cupom-itens">
            <tbody>
              {linhas.map((l) => (
                <tr key={l.seq}>
                  <td>
                    {l.qty}x {l.descricao}
                  </td>
                  <td className="pdv-col-num">{formatarMoeda(l.preco_unitario * l.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pdv-cupom-total">
            <span>TOTAL</span>
            <strong>{formatarMoeda(total)}</strong>
          </div>
          <div className="pdv-cupom-pag">
            {pagamento.map((p) => (
              <div key={p.forma}>
                <span>{FORMA_PAGAMENTO_LABEL[p.forma]}</span>
                <span>{formatarMoeda(p.valor)}</span>
              </div>
            ))}
            {troco > 0 ? (
              <div>
                <span>Troco</span>
                <span>{formatarMoeda(troco)}</span>
              </div>
            ) : null}
          </div>
          {fiscal?.status === 'autorizada' ? (
            <div className="pdv-cupom-fiscal">
              <span>NFC-e nº {fiscal.numero ?? '—'}</span>
              {fiscal.chave ? <span className="pdv-cupom-chave">{fiscal.chave}</span> : null}
              {fiscal.protocolo ? <span>Protocolo: {fiscal.protocolo}</span> : null}
              <span className="pdv-cupom-nota">
                QR Code e DANFE oficiais no documento do provedor fiscal.
              </span>
            </div>
          ) : fiscal ? (
            <div className="pdv-cupom-fiscal">
              <span>NFC-e: {fiscal.mensagem ?? 'não emitida'}</span>
            </div>
          ) : null}
          <div className="pdv-cupom-rodape">Obrigado e volte sempre!</div>
        </div>

        <div className="pdv-cupom-acoes">
          {fiscal?.danfe_url ? (
            <a
              className="pdv-btn-secundario"
              href={fiscal.danfe_url}
              target="_blank"
              rel="noreferrer"
            >
              Abrir DANFE (PDF)
            </a>
          ) : null}
          <button type="button" className="pdv-btn-secundario" onClick={imprimir}>
            Imprimir comprovante
          </button>
          <button type="button" className="pdv-btn-primario" onClick={onFechar}>
            Concluir (ESC)
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
