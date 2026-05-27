import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { usePerfil } from '@/contexts/PerfilContext';
import { fetchCatalogoLegado } from '@/lib/catalogo/fetchCatalogo';
import { formatarMoeda } from '@/lib/pedidos/constants';
import { supabase } from '@/lib/supabase';
import './admin.css';

type PedidoRow = {
  status: string;
  valor_pedido: number | null;
  created_at: string;
};

function inicioDoDia(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function diasAtras(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function VisaoEstrategicaPage() {
  const { usuario } = usePerfil();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [kpi, setKpi] = useState({
    produtos: '—',
    clientes: '—',
    pedidosHoje: '—',
    receita30d: '—',
    emSeparacao: '—',
    suporteAberto: '—',
    promocoesAtivas: '—',
  });

  const hoje = useMemo(() => inicioDoDia().toISOString(), []);
  const ult30 = useMemo(() => diasAtras(30).toISOString(), []);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [
        catalogo,
        clientesRes,
        pedidosHojeRes,
        pedidos30dRes,
        filaRes,
        suporteRes,
        promoRes,
      ] = await Promise.all([
        fetchCatalogoLegado().catch(() => null),
        supabase.from('clientes').select('id', { count: 'exact', head: true }),
        supabase
          .from('pedidos')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', hoje),
        supabase
          .from('pedidos')
          .select('status, valor_pedido, created_at')
          .gte('created_at', ult30)
          .limit(800),
        supabase
          .from('pedidos')
          .select('id', { count: 'exact', head: true })
          .in('status', ['em_separacao', 'separacao_pausada']),
        supabase
          .from('suporte_tickets')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'aberto'),
        supabase
          .from('promocoes')
          .select('id', { count: 'exact', head: true })
          .eq('ativo', true),
      ]);

      const pedidos30 = (pedidos30dRes.data ?? []) as PedidoRow[];
      const receita30 = pedidos30.reduce((s, p) => s + Number(p.valor_pedido ?? 0), 0);

      setKpi({
        produtos: catalogo ? String(catalogo.totalProducts) : '—',
        clientes: String(clientesRes.count ?? 0),
        pedidosHoje: String(pedidosHojeRes.count ?? 0),
        receita30d: formatarMoeda(receita30),
        emSeparacao: String(filaRes.count ?? 0),
        suporteAberto: String(suporteRes.count ?? 0),
        promocoesAtivas: String(promoRes.count ?? 0),
      });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar visão estratégica');
    }
    setCarregando(false);
  }, [hoje, ult30]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (!usuario) return null;
  if (usuario.cargo !== 'CEO') {
    return (
      <PageShell
        className="hub-page--denso"
        tag="Painel administrativo"
        titulo="Visão Estratégica"
        subtitulo="Acesso restrito ao CEO."
      >
        <p className="card">Sem permissão para acessar esta página.</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      className="hub-page--denso"
      tag="Painel administrativo"
      titulo={
        <>
          Visão <span>Estratégica</span>
        </>
      }
      subtitulo="KPIs executivos e status do ecossistema (pedidos, receita, operação e suporte)."
      acoes={
        <button type="button" className="btn btn-secundario" onClick={() => void carregar()} disabled={carregando}>
          {carregando ? 'Atualizando…' : 'Atualizar'}
        </button>
      }
    >
      {erro ? <p className="erro">{erro}</p> : null}

      <div className="dashboard-topo" style={{ marginBottom: '1.25rem' }} aria-busy={carregando}>
        <div className="hub-stat-card">
          <strong>{kpi.receita30d}</strong>
          <span>receita (30 dias)</span>
        </div>
        <div className="hub-stat-card">
          <strong>{kpi.pedidosHoje}</strong>
          <span>pedidos hoje</span>
        </div>
        <div className="hub-stat-card">
          <strong>{kpi.emSeparacao}</strong>
          <span>em separação</span>
        </div>
      </div>

      <div className="admin-modulos-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <div className="card">
          <strong style={{ display: 'block', fontSize: '1.1rem' }}>{kpi.produtos}</strong>
          <span style={{ color: 'var(--hub-muted)', fontSize: '0.85rem', fontWeight: 700 }}>
            produtos no catálogo
          </span>
        </div>
        <div className="card">
          <strong style={{ display: 'block', fontSize: '1.1rem' }}>{kpi.clientes}</strong>
          <span style={{ color: 'var(--hub-muted)', fontSize: '0.85rem', fontWeight: 700 }}>
            clientes ativos
          </span>
        </div>
        <div className="card">
          <strong style={{ display: 'block', fontSize: '1.1rem' }}>{kpi.promocoesAtivas}</strong>
          <span style={{ color: 'var(--hub-muted)', fontSize: '0.85rem', fontWeight: 700 }}>
            promoções ativas
          </span>
        </div>
        <div className="card">
          <strong style={{ display: 'block', fontSize: '1.1rem' }}>{kpi.suporteAberto}</strong>
          <span style={{ color: 'var(--hub-muted)', fontSize: '0.85rem', fontWeight: 700 }}>
            solicitações em aberto
          </span>
        </div>
      </div>

      <p style={{ marginTop: '1rem', color: 'var(--hub-muted)', fontSize: '0.82rem' }}>
        Dica: use o Chat interno → “Solicitações” para acompanhar ajustes e suporte.
      </p>
    </PageShell>
  );
}

