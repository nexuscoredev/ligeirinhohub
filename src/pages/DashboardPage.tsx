import { Link } from 'react-router-dom';
import { supabaseConfigurado } from '@/lib/supabase';

const kpis = [
  { rotulo: 'Pedidos hoje', valor: '—', nota: 'Protótipo' },
  { rotulo: 'Em preparo', valor: '—', nota: 'Fila operacional' },
  { rotulo: 'Em rota', valor: '—', nota: 'Motoristas' },
  { rotulo: 'Faturamento', valor: 'R$ —', nota: 'Dashboard Fase 1' },
];

const modulos = [
  { nome: 'PDV', rota: '/pdv', status: 'Em breve' },
  { nome: 'Totem', rota: '/totem', status: 'Em breve' },
  { nome: 'Operacional', rota: '/operacional', status: 'Em breve' },
  { nome: 'Motoristas', rota: '/motorista', status: 'Em breve' },
];

export function DashboardPage() {
  return (
    <div>
      <h1 className="pagina-titulo">Dashboard</h1>
      <p className="pagina-subtitulo">
        Visão gerencial — dados reais após integração de pedidos.
      </p>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <p>
          Supabase:{' '}
          <strong>{supabaseConfigurado ? 'conectado' : 'não configurado'}</strong>
        </p>
      </div>

      <div className="grid-kpis">
        {kpis.map((kpi) => (
          <div key={kpi.rotulo} className="card card-kpi">
            <span className="card-kpi-rotulo">{kpi.rotulo}</span>
            <span className="card-kpi-valor">{kpi.valor}</span>
            <span className="card-kpi-nota">{kpi.nota}</span>
          </div>
        ))}
      </div>

      <h2 className="secao-titulo">Módulos do ecossistema</h2>
      <div className="grid-modulos">
        {modulos.map((mod) => (
          <Link key={mod.nome} to={mod.rota} className="card card-modulo">
            <strong>{mod.nome}</strong>
            <span>{mod.status}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
