import { useEffect, useState } from 'react';
import { AppPageHeader } from '@/components/AppPageHeader';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { listarClientes } from '@/lib/pedidos/api';
import type { Cliente } from '@/types/pedidos';
import '../operacional/operacional.css';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function ClientesPage() {
  const app = appPorId('operacional');
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    void listarClientes().then(({ clientes: lista }) => setClientes(lista));
  }, []);

  if (!app) return null;

  const item = itemAppPorRota(app, '/clientes');

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Clientes"
      subtitulo="Tabela de preço, vencimento e bloqueio de novos pedidos."
    >
      <div className="hub-grid-2">
        {clientes.map((c) => (
          <article key={c.id} className="card">
            <strong>{c.nome_fantasia ?? c.nome}</strong>
            <p style={{ margin: '0.35rem 0', fontSize: '0.85rem', color: 'var(--hub-muted)' }}>
              Tabela: {c.tabela_preco}
              {c.dia_vencimento_semana != null
                ? ` · Vence: ${DIAS[c.dia_vencimento_semana]}`
                : ''}
            </p>
            {c.inadimplente || c.bloqueado_pedido ? (
              <p className="erro" style={{ margin: '0.5rem 0 0' }}>
                {c.inadimplente ? 'Inadimplente' : ''}
                {c.bloqueado_pedido ? ' · Bloqueado para novo pedido' : ''}
              </p>
            ) : (
              <p style={{ margin: '0.5rem 0 0', color: 'var(--hub-sucesso)', fontSize: '0.8rem' }}>
                Liberado para pedidos
              </p>
            )}
          </article>
        ))}
      </div>
    </AppPageHeader>
  );
}
