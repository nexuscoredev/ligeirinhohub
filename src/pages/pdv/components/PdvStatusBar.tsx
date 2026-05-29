import { useEffect, useState } from 'react';

interface PdvStatusBarProps {
  caixaNumero: number;
  operador: string;
  caixaAberto: boolean;
  vendasOffline?: number;
}

function useRelogio() {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setAgora(new Date()), 1000 * 30);
    return () => window.clearInterval(id);
  }, []);
  return agora;
}

export function PdvStatusBar({
  caixaNumero,
  operador,
  caixaAberto,
  vendasOffline = 0,
}: PdvStatusBarProps) {
  const agora = useRelogio();
  return (
    <div className="pdv-statusbar" role="contentinfo">
      <span className="pdv-statusbar__item">
        <span aria-hidden>🖥️</span> Caixa {caixaNumero}
      </span>
      <span
        className={`pdv-statusbar__item pdv-statusbar__caixa${caixaAberto ? ' aberto' : ' fechado'}`}
      >
        {caixaAberto ? 'Caixa aberto' : 'Caixa fechado'}
      </span>
      <span className="pdv-statusbar__item">
        <span aria-hidden>👤</span> {operador}
      </span>
      <span className="pdv-statusbar__item">
        <span aria-hidden>📶</span> Vendas offline: {vendasOffline}
      </span>
      <span className="pdv-statusbar__item pdv-statusbar__data">
        <span aria-hidden>📅</span>{' '}
        {agora.toLocaleDateString('pt-BR')}
      </span>
    </div>
  );
}
