import './relatorios.css';

interface BarraProps {
  rotulo: string;
  valor: number;
  max: number;
  cor?: string;
  secundario?: string;
}

export function RelatorioBarra({ rotulo, valor, max, cor, secundario }: BarraProps) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0;
  return (
    <div className="rel-barra">
      <div className="rel-barra__rotulo">
        <span>{rotulo}</span>
        <strong>{secundario ?? valor}</strong>
      </div>
      <div className="rel-barra__trilha" aria-hidden>
        <div
          className="rel-barra__preenchimento"
          style={{ width: `${pct}%`, background: cor }}
        />
      </div>
    </div>
  );
}

interface GraficoBarrasDuplasProps {
  rotulos: string[];
  serieA: number[];
  serieB: number[];
  nomeA: string;
  nomeB: string;
  formatarValor?: (v: number) => string;
}

export function GraficoBarrasDuplas({
  rotulos,
  serieA,
  serieB,
  nomeA,
  nomeB,
  formatarValor = String,
}: GraficoBarrasDuplasProps) {
  const max = Math.max(...serieA, ...serieB, 1);

  return (
    <div className="rel-grafico-duplo">
      <div className="rel-grafico-legenda">
        <span className="rel-legenda rel-legenda--a">{nomeA}</span>
        <span className="rel-legenda rel-legenda--b">{nomeB}</span>
      </div>
      <div className="rel-grafico-colunas">
        {rotulos.map((rotulo, i) => (
          <div key={rotulo} className="rel-coluna">
            <div className="rel-coluna__barras">
              <div
                className="rel-coluna__bar rel-coluna__bar--a"
                style={{ height: `${Math.round((serieA[i] / max) * 100)}%` }}
                title={`${nomeA}: ${formatarValor(serieA[i])}`}
              />
              <div
                className="rel-coluna__bar rel-coluna__bar--b"
                style={{ height: `${Math.round((serieB[i] / max) * 100)}%` }}
                title={`${nomeB}: ${formatarValor(serieB[i])}`}
              />
            </div>
            <span className="rel-coluna__rotulo">{rotulo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
