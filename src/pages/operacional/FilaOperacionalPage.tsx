import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppPageHeader } from '@/components/AppPageHeader';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { listarFilaPedidos } from '@/lib/pedidos/api';
import { CriarPedidoModal } from '@/pages/operacional/CriarPedidoModal';
import { usePerfil } from '@/contexts/PerfilContext';
import { formatarMoeda, ORIGEM_LABEL, STATUS_LABEL } from '@/lib/pedidos/constants';
import { supabase } from '@/lib/supabase';
import type { Pedido, PedidoOrigem } from '@/types/pedidos';
import './operacional.css';

const FILTROS: { id: PedidoOrigem | 'todos'; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'cayena', label: 'Cayena' },
  { id: 'balcao', label: 'Balcão' },
  { id: 'totem', label: 'Totem' },
  { id: 'app', label: 'App' },
];

export function FilaOperacionalPage() {
  const app = appPorId('operacional');
  const { usuario } = usePerfil();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<PedidoOrigem | 'todos'>('todos');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [criarAberto, setCriarAberto] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { pedidos: lista, error } = await listarFilaPedidos(filtro);
    if (error) setErro(error.message);
    else {
      setPedidos(lista);
      setErro(null);
    }
    setCarregando(false);
  }, [filtro]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    const channel = supabase
      .channel('fila-pedidos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => void carregar(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [carregar]);

  if (!app || !usuario) return null;

  const item = itemAppPorRota(app, '/operacional');
  const proximo = pedidos[0];

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Fila operacional"
      subtitulo="Ordem cronológica — refazer separação tem prioridade."
    >
      <div className="ops-toolbar">
        <button type="button" className="btn" onClick={() => setCriarAberto(true)}>
          Criar pedido
        </button>
      </div>

      {msgSucesso ? (
        <p className="ops-resumo" role="status">
          {msgSucesso}
        </p>
      ) : null}

      <CriarPedidoModal
        aberto={criarAberto}
        usuarioId={usuario.id}
        onFechar={() => setCriarAberto(false)}
        onCriado={(numero, naFila) => {
          setMsgSucesso(
            naFila
              ? `Pedido #${numero} criado e adicionado à fila.`
              : `Orçamento #${numero} criado — aceite em Pedidos para entrar na fila.`,
          );
          void carregar();
        }}
      />

      <div className="ops-filtros" role="tablist" aria-label="Filtrar origem">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            className={`ops-filtro${filtro === f.id ? ' ativo' : ''}`}
            onClick={() => setFiltro(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {erro ? <p className="erro">{erro}</p> : null}

      {proximo ? (
        <p className="ops-resumo">
          Próximo da fila:{' '}
          <strong>
            #{proximo.numero} — {proximo.clientes?.nome_fantasia ?? proximo.clientes?.nome}
          </strong>
          {proximo.status === 'em_separacao' ? (
            <span> (separação em andamento)</span>
          ) : null}
        </p>
      ) : null}

      {carregando ? (
        <p style={{ color: 'var(--hub-muted)' }}>Carregando fila…</p>
      ) : pedidos.length === 0 ? (
        <p className="card">Nenhum pedido na fila de separação.</p>
      ) : (
        <ul className="ops-fila">
          {pedidos.map((p) => (
            <li key={p.id}>
              <Link
                to={`/operacional/separar/${p.id}`}
                className={`ops-fila-item${p.prioridade > 0 ? ' prioridade' : ''}`}
              >
                <span className="ops-fila-num">#{p.numero}</span>
                <span className="ops-fila-corpo">
                  <strong>{p.clientes?.nome_fantasia ?? p.clientes?.nome}</strong>
                  <span className="ops-fila-meta">
                    {STATUS_LABEL[p.status]} · {formatarMoeda(Number(p.valor_pedido))}
                    {p.aceito_em
                      ? ` · ${new Date(p.aceito_em).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : ''}
                  </span>
                </span>
                <span
                  className={`ops-badge${p.origem === 'cayena' ? ' ops-badge--cayena' : ''}${p.tem_ocorrencia ? ' ops-badge--ocorrencia' : ''}`}
                >
                  {ORIGEM_LABEL[p.origem]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppPageHeader>
  );
}
