import { useEffect, useState } from 'react';
import { AppPageHeader } from '@/components/AppPageHeader';
import { usePerfil } from '@/contexts/PerfilContext';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { criarOcorrencia, listarEntregasPendentes } from '@/lib/pedidos/api';
import { formatarMoeda, STATUS_LABEL } from '@/lib/pedidos/constants';
import type { Pedido } from '@/types/pedidos';
import '../operacional/operacional.css';

export function MotoristaPage() {
  const app = appPorId('operacional');
  const { usuario } = usePerfil();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [descricao, setDescricao] = useState('');
  const [pedidoOcorrencia, setPedidoOcorrencia] = useState('');

  const carregar = () => {
    void listarEntregasPendentes().then(({ pedidos: lista }) => setPedidos(lista));
  };

  useEffect(() => {
    carregar();
  }, []);

  async function registrarOcorrencia() {
    if (!usuario || !pedidoOcorrencia || !descricao.trim()) return;
    await criarOcorrencia(pedidoOcorrencia, descricao.trim(), 'entrega', true, usuario.id);
    setDescricao('');
    carregar();
  }

  if (!app) return null;

  const item = itemAppPorRota(app, '/motorista');

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Motoristas"
      subtitulo="Entregas pendentes e registro de ocorrência na rota."
    >
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>Nova ocorrência</h3>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Pedido
          <select
            value={pedidoOcorrencia}
            onChange={(e) => setPedidoOcorrencia(e.target.value)}
            style={{ marginTop: '0.25rem' }}
          >
            <option value="">Selecione</option>
            {pedidos.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.numero} — {p.clientes?.nome}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Descrição
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex.: veio Ballantine's no lugar de Buchanan's"
            style={{ marginTop: '0.25rem' }}
          />
        </label>
        <button type="button" className="btn" onClick={() => void registrarOcorrencia()}>
          Registrar e alertar
        </button>
      </div>

      <ul className="ops-fila">
        {pedidos.map((p) => (
          <li key={p.id}>
            <div className="ops-fila-item">
              <span className="ops-fila-num">#{p.numero}</span>
              <span className="ops-fila-corpo">
                <strong>{p.clientes?.nome}</strong>
                <span className="ops-fila-meta">
                  {STATUS_LABEL[p.status]} ·{' '}
                  {formatarMoeda(Number(p.valor_separado ?? p.valor_pedido))}
                </span>
              </span>
              {p.tem_ocorrencia ? (
                <span className="ops-badge ops-badge--ocorrencia">Ocorrência</span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </AppPageHeader>
  );
}
