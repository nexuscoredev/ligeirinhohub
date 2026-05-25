import { useEffect, useState } from 'react';
import { AppPageHeader } from '@/components/AppPageHeader';
import { usePerfil } from '@/contexts/PerfilContext';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { listarMotoristasCadastrados } from '@/lib/motoristas/api';
import { criarOcorrencia, listarEntregasPendentes } from '@/lib/pedidos/api';
import { formatarMoeda, STATUS_LABEL } from '@/lib/pedidos/constants';
import type { Motorista } from '@/types/motoristas';
import type { Pedido } from '@/types/pedidos';
import '../operacional/operacional.css';
import './motorista.css';

export function MotoristaPage() {
  const app = appPorId('operacional');
  const { usuario } = usePerfil();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [descricao, setDescricao] = useState('');
  const [pedidoOcorrencia, setPedidoOcorrencia] = useState('');
  const [ocorrenciaAberta, setOcorrenciaAberta] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = () => {
    void listarEntregasPendentes().then(({ pedidos: lista }) => setPedidos(lista));
    void listarMotoristasCadastrados().then(({ motoristas: lista, error }) => {
      if (error) setErro(error.message);
      else setMotoristas(lista);
    });
  };

  useEffect(() => {
    carregar();
  }, []);

  async function registrarOcorrencia() {
    if (!usuario || !pedidoOcorrencia || !descricao.trim()) return;
    const { error } = await criarOcorrencia(
      pedidoOcorrencia,
      descricao.trim(),
      'entrega',
      true,
      usuario.id,
    );
    if (error) {
      setErro(error.message);
      return;
    }
    setDescricao('');
    setPedidoOcorrencia('');
    setOcorrenciaAberta(false);
    carregar();
  }

  if (!app) return null;

  const item = itemAppPorRota(app, '/motorista');

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Motoristas"
      subtitulo="Entregas pendentes e equipe de rota."
    >
      <div className="ops-motor-toolbar">
        <button type="button" className="btn" onClick={() => setOcorrenciaAberta(true)}>
          Nova ocorrência
        </button>
      </div>

      {erro ? <p className="erro">{erro}</p> : null}

      {ocorrenciaAberta ? (
        <div
          className="ops-modal-backdrop"
          role="presentation"
          onClick={() => setOcorrenciaAberta(false)}
        >
          <div
            className="ops-modal card"
            role="dialog"
            aria-labelledby="ops-ocorrencia-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="ops-ocorrencia-titulo" style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>
              Nova ocorrência na rota
            </h3>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Pedido
              <select
                value={pedidoOcorrencia}
                onChange={(e) => setPedidoOcorrencia(e.target.value)}
                style={{ marginTop: '0.25rem' }}
              >
                <option value="">Selecione</option>
                {pedidos.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.numero} — {p.clientes?.nome}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'block', marginBottom: '0.75rem' }}>
              Descrição
              <input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex.: veio Ballantine's no lugar de Buchanan's"
                style={{ marginTop: '0.25rem' }}
              />
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn" onClick={() => void registrarOcorrencia()}>
                Registrar e alertar
              </button>
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() => setOcorrenciaAberta(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="ops-motor-secao" aria-labelledby="motoristas-cad-titulo">
        <h2 id="motoristas-cad-titulo" className="ops-motor-secao-titulo">
          Motoristas cadastrados
        </h2>
        {motoristas.length === 0 ? (
          <p className="card">Nenhum motorista cadastrado.</p>
        ) : (
          <ul className="ops-motor-lista">
            {motoristas.map((m) => (
              <li key={m.id} className="ops-motor-card">
                <span className="ops-motor-avatar" aria-hidden>
                  🚚
                </span>
                <div>
                  <strong>{m.nome}</strong>
                  <span className="ops-motor-meta">
                    {m.telefone ?? 'Sem telefone'}
                    {m.placa ? ` · ${m.placa}` : ''}
                  </span>
                </div>
                <span className="ops-motor-badge">Ativo</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ops-motor-secao" aria-labelledby="entregas-pend-titulo">
        <h2 id="entregas-pend-titulo" className="ops-motor-secao-titulo">
          Entregas pendentes
        </h2>
        {pedidos.length === 0 ? (
          <p className="card">Nenhuma entrega pendente no momento.</p>
        ) : (
          <ul className="ops-fila">
            {pedidos.map((p) => (
              <li key={p.id}>
                <div className="ops-fila-item">
                  <span className="ops-fila-num">#{p.numero}</span>
                  <span className="ops-fila-corpo">
                    <strong>{p.clientes?.nome}</strong>
                    <span className="ops-fila-meta">
                      {STATUS_LABEL[p.status]} ·{' '}
                      {formatarMoeda(Number(p.valor_separado ?? p.valor_pedido))}
                    </span>
                  </span>
                  {p.tem_ocorrencia ? (
                    <span className="ops-badge ops-badge--ocorrencia">Ocorrência</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppPageHeader>
  );
}
