import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppPageHeader } from '@/components/AppPageHeader';
import { usePerfil } from '@/contexts/PerfilContext';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { aceitarOrcamento, listarPedidosGeral } from '@/lib/pedidos/api';
import { formatarMoeda, ORIGEM_LABEL, STATUS_LABEL } from '@/lib/pedidos/constants';
import { podeEditarPedidoOficial } from '@/lib/pedidos/permissoes';
import type { Pedido } from '@/types/pedidos';
import '../operacional/operacional.css';

export function PedidosPage() {
  const app = appPorId('operacional');
  const { usuario } = usePerfil();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    void listarPedidosGeral().then(({ pedidos: lista, error }) => {
      if (error) setErro(error.message);
      else setPedidos(lista);
    });
  }, []);

  async function aceitar(id: string) {
    if (!usuario) return;
    const { error } = await aceitarOrcamento(id, usuario.id);
    if (error) setErro(error.message);
    else {
      const { pedidos: lista } = await listarPedidosGeral();
      setPedidos(lista);
    }
  }

  if (!app) return null;

  const item = itemAppPorRota(app, '/pedidos');

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Pedidos"
      subtitulo="Orçamentos e histórico recente."
    >
      {erro ? <p className="erro">{erro}</p> : null}

      <ul className="ops-fila">
        {pedidos.map((p) => (
          <li key={p.id}>
            <div className="ops-fila-item" style={{ cursor: 'default' }}>
              <span className="ops-fila-num">#{p.numero}</span>
              <span className="ops-fila-corpo">
                <strong>{p.clientes?.nome ?? '—'}</strong>
                <span className="ops-fila-meta">
                  {STATUS_LABEL[p.status]} · {ORIGEM_LABEL[p.origem]} ·{' '}
                  {formatarMoeda(Number(p.valor_pedido))}
                </span>
              </span>
              <span style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {p.status === 'orcamento' ? (
                  <button
                    type="button"
                    className="btn"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                    onClick={() => void aceitar(p.id)}
                  >
                    Aceitar
                  </button>
                ) : null}
                {['aguardando_separacao', 'refazer_separacao', 'em_separacao', 'separacao_pausada'].includes(
                  p.status,
                ) ? (
                  <Link
                    to={`/operacional/separar/${p.id}`}
                    className="btn btn-secundario"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                  >
                    Separar
                  </Link>
                ) : null}
                {podeEditarPedidoOficial(usuario?.cargo ?? 'Visualizador') ? (
                  <span className="ops-badge">Admin edita</span>
                ) : null}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </AppPageHeader>
  );
}
