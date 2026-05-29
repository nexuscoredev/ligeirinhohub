import { useEffect, useMemo, useState } from 'react';
import { formatarMoeda } from '@/lib/pedidos/constants';
import { listarNotasEmitidas, type NotaEmitida } from '@/lib/pdv/relatorios';
import { NFCE_STATUS_LABEL, type NfceStatus } from '@/lib/pdv/types';
import { PdvOverlay } from './PdvOverlay';

const ABAS: { id: NfceStatus | 'todas'; rotulo: string }[] = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'autorizada', rotulo: 'Autorizadas' },
  { id: 'rejeitada', rotulo: 'Rejeitadas' },
  { id: 'processando', rotulo: 'Processando' },
  { id: 'cancelada', rotulo: 'Canceladas' },
  { id: 'contingencia', rotulo: 'Contingência' },
  { id: 'nao_emitida', rotulo: 'Sem NFC-e' },
];

export function PdvNotasEmitidas({ onFechar }: { onFechar: () => void }) {
  const [notas, setNotas] = useState<NotaEmitida[]>([]);
  const [aba, setAba] = useState<NfceStatus | 'todas'>('todas');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    void listarNotasEmitidas().then(({ notas: lista }) => {
      setNotas(lista);
      setCarregando(false);
    });
  }, []);

  const filtradas = useMemo(
    () => (aba === 'todas' ? notas : notas.filter((n) => n.nfce_status === aba)),
    [notas, aba],
  );

  return (
    <PdvOverlay titulo="Notas Emitidas — F11" onFechar={onFechar} largura="xl">
      <div className="pdv-notas-abas">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`pdv-notas-aba${aba === a.id ? ' ativa' : ''}`}
            onClick={() => setAba(a.id)}
          >
            {a.rotulo}
          </button>
        ))}
      </div>
      <div className="pdv-consulta-tabela-wrap">
        <table className="pdv-consulta-tabela">
          <thead>
            <tr>
              <th>Venda</th>
              <th>NFC-e</th>
              <th>Data/Hora</th>
              <th className="pdv-col-num">Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={5} className="pdv-consulta-vazio">
                  Carregando…
                </td>
              </tr>
            ) : filtradas.length === 0 ? (
              <tr>
                <td colSpan={5} className="pdv-consulta-vazio">
                  Nenhuma nota nesta aba.
                </td>
              </tr>
            ) : (
              filtradas.map((n) => (
                <tr key={n.id}>
                  <td>#{n.numero}</td>
                  <td>{n.nfce_numero ?? '—'}</td>
                  <td>{new Date(n.created_at).toLocaleString('pt-BR')}</td>
                  <td className="pdv-col-num">{formatarMoeda(n.valor_pedido)}</td>
                  <td>
                    <span className={`pdv-nfce-badge pdv-nfce-badge--${n.nfce_status}`}>
                      {NFCE_STATUS_LABEL[n.nfce_status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PdvOverlay>
  );
}
