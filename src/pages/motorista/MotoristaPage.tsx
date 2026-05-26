import { useEffect, useState } from 'react';
import { AppPageHeader } from '@/components/AppPageHeader';
import { usePerfil } from '@/contexts/PerfilContext';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { criarMotorista, importarMotoristas, listarMotoristasCadastrados } from '@/lib/motoristas/api';
import { criarOcorrencia, listarEntregasPendentes } from '@/lib/pedidos/api';
import { formatarMoeda, STATUS_LABEL } from '@/lib/pedidos/constants';
import type { Motorista } from '@/types/motoristas';
import type { Pedido } from '@/types/pedidos';
import '../operacional/operacional.css';
import './motorista.css';

function podeEditarMotoristas(cargo?: string) {
  return ['Desenvolvedor', 'Administrador', 'Gerente'].includes(String(cargo));
}

function parseImportMotoristas(raw: string) {
  const linhas = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return linhas
    .map((line) => {
      const cols = line.includes(';')
        ? line.split(';')
        : line.includes('\t')
          ? line.split('\t')
          : line.split(',');
      const [nome, telefone, placa] = cols.map((c) => c.trim());
      return { nome, telefone, placa };
    })
    .filter((l) => l.nome);
}

export function MotoristaPage() {
  const app = appPorId('operacional');
  const { usuario } = usePerfil();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [descricao, setDescricao] = useState('');
  const [pedidoOcorrencia, setPedidoOcorrencia] = useState('');
  const [ocorrenciaAberta, setOcorrenciaAberta] = useState(false);
  const [novoAberto, setNovoAberto] = useState(false);
  const [importAberto, setImportAberto] = useState(false);
  const [importRaw, setImportRaw] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [novoPlaca, setNovoPlaca] = useState('');
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = () => {
    setCarregando(true);
    void listarEntregasPendentes().then(({ pedidos: lista }) => setPedidos(lista));
    void listarMotoristasCadastrados().then(({ motoristas: lista, error }) => {
      if (error) setErro(error.message);
      else setMotoristas(lista);
      setCarregando(false);
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
  const podeEditar = podeEditarMotoristas(usuario?.cargo);

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Motoristas"
      subtitulo="Entregas pendentes e equipe de rota."
    >
      <div className="ops-motor-toolbar">
        {podeEditar ? (
          <>
            <button type="button" className="btn btn-secundario" onClick={() => setImportAberto(true)}>
              Importar base
            </button>
            <button type="button" className="btn" onClick={() => setNovoAberto(true)}>
              Novo motorista
            </button>
          </>
        ) : null}
        <button type="button" className="btn" onClick={() => setOcorrenciaAberta(true)}>
          Nova ocorrência
        </button>
      </div>

      {erro ? <p className="erro">{erro}</p> : null}
      {sucesso ? (
        <p className="ops-resumo" role="status">
          {sucesso}
        </p>
      ) : null}

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

      {novoAberto ? (
        <div className="ops-modal-backdrop" role="presentation" onClick={() => setNovoAberto(false)}>
          <div className="ops-modal card" role="dialog" aria-labelledby="motor-novo" onClick={(e) => e.stopPropagation()}>
            <h3 id="motor-novo" style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>
              Novo motorista
            </h3>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Nome
              <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} style={{ marginTop: '0.25rem' }} />
            </label>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Telefone
              <input
                value={novoTelefone}
                onChange={(e) => setNovoTelefone(e.target.value)}
                placeholder="Opcional"
                style={{ marginTop: '0.25rem' }}
              />
            </label>
            <label style={{ display: 'block', marginBottom: '0.75rem' }}>
              Placa
              <input
                value={novoPlaca}
                onChange={(e) => setNovoPlaca(e.target.value)}
                placeholder="Opcional"
                style={{ marginTop: '0.25rem' }}
              />
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setErro(null);
                  setSucesso(null);
                  void criarMotorista({ nome: novoNome, telefone: novoTelefone, placa: novoPlaca }).then(
                    ({ error }) => {
                      if (error) {
                        setErro(error.message);
                        return;
                      }
                      setNovoAberto(false);
                      setNovoNome('');
                      setNovoTelefone('');
                      setNovoPlaca('');
                      setSucesso('Motorista criado com sucesso.');
                      carregar();
                    },
                  );
                }}
              >
                Criar
              </button>
              <button type="button" className="btn btn-secundario" onClick={() => setNovoAberto(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {importAberto ? (
        <div className="ops-modal-backdrop" role="presentation" onClick={() => setImportAberto(false)}>
          <div className="ops-modal card" role="dialog" aria-labelledby="motor-import" onClick={(e) => e.stopPropagation()}>
            <h3 id="motor-import" style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>
              Importar base de motoristas
            </h3>
            <p style={{ margin: '0 0 0.65rem', color: 'var(--hub-muted)', fontSize: '0.85rem' }}>
              Cole linhas no formato: <code>nome;telefone;placa</code>
            </p>
            <textarea
              rows={7}
              value={importRaw}
              onChange={(e) => setImportRaw(e.target.value)}
              placeholder="Ex.:\nJoão Silva;(11) 99999-0000;ABC-1D23\nMarcos Oliveira;;DEF-4G56"
            />
            <p style={{ margin: '0.6rem 0 0', color: 'var(--hub-muted)', fontSize: '0.85rem' }}>
              Prévia: <strong>{parseImportMotoristas(importRaw).length}</strong> motorista(s)
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setErro(null);
                  setSucesso(null);
                  const linhas = parseImportMotoristas(importRaw);
                  void importarMotoristas(linhas).then(({ inseridos, error }) => {
                    if (error) {
                      setErro(error.message);
                      return;
                    }
                    setImportAberto(false);
                    setImportRaw('');
                    setSucesso(`${inseridos} motorista(s) importado(s).`);
                    carregar();
                  });
                }}
                disabled={parseImportMotoristas(importRaw).length === 0}
              >
                Importar
              </button>
              <button type="button" className="btn btn-secundario" onClick={() => setImportAberto(false)}>
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
        {carregando ? (
          <p style={{ color: 'var(--hub-muted)' }}>Carregando motoristas…</p>
        ) : motoristas.length === 0 ? (
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
                <span
                  className={`ops-motor-badge${m.ativo ? '' : ' ops-motor-badge--inativo'}`}
                >
                  {m.ativo ? 'Ativo' : 'Inativo'}
                </span>
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
