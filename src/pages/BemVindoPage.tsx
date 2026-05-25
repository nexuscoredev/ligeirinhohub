import { usePerfil } from '@/contexts/PerfilContext';

export function BemVindoPage() {
  const { usuario } = usePerfil();

  return (
    <div>
      <h1 className="pagina-titulo">Bem-vindo, {usuario?.nome ?? 'usuário'}</h1>
      <p className="pagina-subtitulo">
        Hub administrativo da adega — fase 1 em construção.
      </p>
      <div className="card">
        <p>
          Ecossistema: <strong>PDV</strong>, <strong>Totem</strong>,{' '}
          <strong>Operacional</strong>, <strong>Motoristas</strong> e{' '}
          <strong>Dashboard</strong> — um pedido, uma fila.
        </p>
        <p style={{ color: 'var(--cor-texto-suave)', marginTop: '1rem' }}>
          Seu cargo: <strong>{usuario?.cargo}</strong> · MVP Fase 1 em andamento
        </p>
      </div>
    </div>
  );
}
