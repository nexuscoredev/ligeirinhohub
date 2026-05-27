import { Link } from 'react-router-dom';
import type { IndicadorEstrategico } from '@/lib/admin/visaoEstrategica';
import { abrirChatHub } from '@/lib/admin/visaoEstrategica';

interface EstrategicoKpiCardProps {
  indicador: IndicadorEstrategico;
  valor: string;
  compacto?: boolean;
}

function ConteudoCard({
  indicador,
  valor,
  compacto,
}: EstrategicoKpiCardProps) {
  return (
    <>
      <div className="estrategico-card__topo">
        <strong>{valor}</strong>
        <span className="estrategico-card__icone" aria-hidden>
          {indicador.icone}
        </span>
      </div>
      <span className="estrategico-card__titulo">{indicador.titulo}</span>
      {!compacto ? (
        <span className="estrategico-card__desc">{indicador.descricao}</span>
      ) : null}
      <span className="estrategico-card__cta">Abrir →</span>
    </>
  );
}

export function EstrategicoKpiCard({ indicador, valor, compacto }: EstrategicoKpiCardProps) {
  const className = [
    'estrategico-card',
    'card',
    compacto ? 'estrategico-card--compacto' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (indicador.destino.tipo === 'rota') {
    return (
      <Link to={indicador.destino.to} className={className} title={indicador.descricao}>
        <ConteudoCard indicador={indicador} valor={valor} compacto={compacto} />
      </Link>
    );
  }

  const destino = indicador.destino;
  if (destino.tipo !== 'chat') return null;

  return (
    <button
      type="button"
      className={className}
      title={indicador.descricao}
      onClick={() => abrirChatHub(destino.aba)}
    >
      <ConteudoCard indicador={indicador} valor={valor} compacto={compacto} />
    </button>
  );
}
