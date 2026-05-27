import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { usePerfil } from '@/contexts/PerfilContext';
import { fetchCatalogoLegado } from '@/lib/catalogo/fetchCatalogo';
import {
  indicadoresDestaque,
  indicadoresPorBudget,
  type KpiEstrategicoValores,
} from '@/lib/admin/visaoEstrategica';
import { paginaPermitida } from '@/lib/apps';
import { formatarMoeda } from '@/lib/pedidos/constants';
import { supabase } from '@/lib/supabase';
import { AdminSubnav } from '@/pages/admin/AdminSubnav';
import { EstrategicoKpiCard } from '@/pages/admin/EstrategicoKpiCard';
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

const KPI_INICIAL: KpiEstrategicoValores = {
  produtos: '—',
  clientes: '—',
  pedidosHoje: '—',
  receita30d: '—',
  emSeparacao: '—',
  orcamentos: '—',
  suporteAberto: '—',
  promocoesAtivas: '—',
};

export function VisaoEstrategicaPage() {
  const { usuario } = usePerfil();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [kpi, setKpi] = useState<KpiEstrategicoValores>(KPI_INICIAL);

  const hoje = useMemo(() => inicioDoDia().toISOString(), []);
  const ult30 = useMemo(() => diasAtras(30).toISOString(), []);

  const grupos = useMemo(() => indicadoresPorBudget(), []);
  const destaques = useMemo(() => indicadoresDestaque(), []);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [
        catalogo,
        clientesRes,
        pedidosHojeRes,
        pedidos30dRes,
        orcamentosRes,
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
          .eq('status', 'orcamento'),
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
        orcamentos: String(orcamentosRes.count ?? 0),
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

  const permitido = paginaPermitida(
    '/admin/estrategico',
    usuario.cargo,
    usuario.paginas_permitidas,
    usuario.email,
  );

  if (!permitido) {
    return <Navigate to="/bem-vindo" replace />;
  }

  return (
    <PageShell
      className="hub-page--denso hub-page--estrategico"
      tag="Painel administrativo"
      titulo={
        <>
          Visão <span>Estratégica</span>
        </>
      }
      subtitulo="Indicadores por área do negócio. Clique em um card para ir direto ao módulo correspondente."
      acoes={
        <button
          type="button"
          className="btn btn-secundario"
          onClick={() => void carregar()}
          disabled={carregando}
        >
          {carregando ? 'Atualizando…' : 'Atualizar'}
        </button>
      }
    >
      <AdminSubnav />

      {erro ? <p className="erro">{erro}</p> : null}

      <section className="estrategico-destaques" aria-label="Indicadores principais" aria-busy={carregando}>
        <div className="estrategico-destaques-grid">
          {destaques.map((ind) => (
            <EstrategicoKpiCard key={ind.id} indicador={ind} valor={kpi[ind.id]} compacto />
          ))}
        </div>
      </section>

      {grupos.map((grupo) => (
        <section
          key={grupo.id}
          className="estrategico-budget"
          aria-labelledby={`budget-${grupo.id}`}
        >
          <header className="estrategico-budget-header">
            <h2 id={`budget-${grupo.id}`} className="hub-secao-titulo">
              {grupo.titulo}
            </h2>
            <p className="estrategico-budget-sub">{grupo.subtitulo}</p>
          </header>
          <div className="estrategico-budget-grid">
            {grupo.itens.map((ind) => (
              <EstrategicoKpiCard key={ind.id} indicador={ind} valor={kpi[ind.id]} />
            ))}
          </div>
        </section>
      ))}

      <p className="estrategico-nota">
        Orçamentos aguardam aceite em <strong>Pedidos</strong> antes de entrar na fila operacional.
      </p>
    </PageShell>
  );
}
