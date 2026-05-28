import { useEffect, useMemo, useState } from 'react';
import { AppPageHeader } from '@/components/AppPageHeader';
import { usePerfil } from '@/contexts/PerfilContext';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { criarCliente, importarClientes, listarClientes } from '@/lib/pedidos/api';
import type { Cliente } from '@/types/pedidos';
import '../operacional/operacional.css';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function podeEditarClientes(cargo?: string) {
  return ['Desenvolvedor', 'Administrador', 'Gerente', 'Comercial'].includes(String(cargo));
}

function parseImportClientes(raw: string) {
  const linhas = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const out: Array<{
    nome: string;
    nome_fantasia?: string;
    tabela_preco?: string;
    dia_vencimento_semana?: number | null;
  }> = [];

  for (const line of linhas) {
    const cols = line.includes(';')
      ? line.split(';')
      : line.includes('\t')
        ? line.split('\t')
        : line.split(',');
    const [nome, nomeFantasia, tabelaPreco, dia] = cols.map((c) => c.trim());
    if (!nome) continue;
    const diaNum = dia === undefined || dia === '' ? null : Number(dia);
    out.push({
      nome,
      nome_fantasia: nomeFantasia || undefined,
      tabela_preco: tabelaPreco || undefined,
      dia_vencimento_semana: Number.isFinite(diaNum as number) ? (diaNum as number) : null,
    });
  }
  return out;
}

export function ClientesPage() {
  const app = appPorId('operacional');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const { usuario } = usePerfil();
  const [novoAberto, setNovoAberto] = useState(false);
  const [importAberto, setImportAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const carregar = () =>
    void listarClientes().then(({ clientes: lista }) => setClientes(lista));

  useEffect(() => {
    carregar();
  }, []);

  if (!app) return null;

  const item = itemAppPorRota(app, '/clientes');
  const podeEditar = podeEditarClientes(usuario?.cargo);

  const clientesOrdenados = useMemo(() => {
    return [...clientes].sort((a, b) =>
      (a.nome_fantasia ?? a.nome).localeCompare(b.nome_fantasia ?? b.nome, 'pt-BR'),
    );
  }, [clientes]);

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Clientes"
      subtitulo="Tabela de preço, vencimento e bloqueio de novos pedidos."
    >
      <div className="ops-toolbar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {podeEditar ? (
            <>
              <button type="button" className="btn" onClick={() => setNovoAberto(true)}>
                Novo cliente
              </button>
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() => setImportAberto(true)}
              >
                Importar base
              </button>
            </>
          ) : null}
        </div>
      </div>

      {erro ? <p className="erro">{erro}</p> : null}
      {sucesso ? (
        <p className="ops-resumo" role="status">
          {sucesso}
        </p>
      ) : null}

      {novoAberto ? (
        <div className="ops-modal-backdrop" role="presentation" onClick={() => setNovoAberto(false)}>
          <div
            className="ops-modal ops-modal--cliente card"
            role="dialog"
            aria-labelledby="cli-novo"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="ops-modal-header">
              <h3 id="cli-novo" className="ops-modal-titulo">
                Novo cliente
              </h3>
              <p className="ops-modal-subtitulo">
                Tabela, vencimento e bloqueios para novos pedidos.
              </p>
            </header>
            <NovoClienteForm
              onCancelar={() => setNovoAberto(false)}
              onSalvar={async (payload) => {
                setErro(null);
                setSucesso(null);
                const { error } = await criarCliente(payload);
                if (error) {
                  setErro(error.message);
                  return;
                }
                setNovoAberto(false);
                setSucesso('Cliente criado com sucesso.');
                carregar();
              }}
            />
          </div>
        </div>
      ) : null}

      {importAberto ? (
        <div className="ops-modal-backdrop" role="presentation" onClick={() => setImportAberto(false)}>
          <div
            className="ops-modal ops-modal--cliente card"
            role="dialog"
            aria-labelledby="cli-import"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="ops-modal-header">
              <h3 id="cli-import" className="ops-modal-titulo">
                Importar base de clientes
              </h3>
              <p className="ops-modal-subtitulo">
                Cole linhas e importe em lote para acelerar o cadastro.
              </p>
            </header>
            <ImportClientesForm
              onCancelar={() => setImportAberto(false)}
              onImportar={async (raw) => {
                setErro(null);
                setSucesso(null);
                const linhas = parseImportClientes(raw);
                const { inseridos, error } = await importarClientes(linhas);
                if (error) {
                  setErro(error.message);
                  return;
                }
                setImportAberto(false);
                setSucesso(`${inseridos} cliente(s) importado(s).`);
                carregar();
              }}
            />
          </div>
        </div>
      ) : null}

      <div className="hub-grid-2">
        {clientesOrdenados.map((c) => (
          <article key={c.id} className="card">
            <strong>{c.nome_fantasia ?? c.nome}</strong>
            <p style={{ margin: '0.35rem 0', fontSize: '0.85rem', color: 'var(--hub-muted)' }}>
              Tabela: {c.tabela_preco}
              {c.dia_vencimento_semana != null
                ? ` · Vence: ${DIAS[c.dia_vencimento_semana]}`
                : ''}
            </p>
            {c.inadimplente || c.bloqueado_pedido ? (
              <p className="erro" style={{ margin: '0.5rem 0 0' }}>
                {c.inadimplente ? 'Inadimplente' : ''}
                {c.bloqueado_pedido ? ' · Bloqueado para novo pedido' : ''}
              </p>
            ) : (
              <p style={{ margin: '0.5rem 0 0', color: 'var(--hub-sucesso)', fontSize: '0.8rem' }}>
                Liberado para pedidos
              </p>
            )}
          </article>
        ))}
      </div>
    </AppPageHeader>
  );
}

function NovoClienteForm({
  onSalvar,
  onCancelar,
}: {
  onSalvar: (payload: {
    nome: string;
    nomeFantasia?: string | null;
    tabelaPreco?: string | null;
    diaVencimentoSemana?: number | null;
    bloqueadoPedido?: boolean;
    inadimplente?: boolean;
    observacoes?: string | null;
  }) => void;
  onCancelar: () => void;
}) {
  const [nome, setNome] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [tabelaPreco, setTabelaPreco] = useState('padrao');
  const [dia, setDia] = useState<string>('');
  const [bloqueado, setBloqueado] = useState(false);
  const [inadimplente, setInadimplente] = useState(false);
  const [observacoes, setObservacoes] = useState('');

  return (
    <>
      <div className="ops-modal-corpo">
        <label className="ops-field">
          Nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>
        <label className="ops-field">
          Nome fantasia
          <input
            value={nomeFantasia}
            onChange={(e) => setNomeFantasia(e.target.value)}
          />
        </label>
        <div className="ops-criar-pedido-meta">
          <label className="ops-field">
            Tabela
            <input
              value={tabelaPreco}
              onChange={(e) => setTabelaPreco(e.target.value)}
            />
          </label>
          <label className="ops-field">
            Dia venc. (0–6)
            <input
              value={dia}
              onChange={(e) => setDia(e.target.value)}
              placeholder="Ex.: 1 (Seg)"
              inputMode="numeric"
            />
          </label>
        </div>
        <label className="ops-field ops-field--check" style={{ marginTop: '0.25rem' }}>
          <input
            type="checkbox"
            checked={bloqueado}
            onChange={(e) => setBloqueado(e.target.checked)}
          />
          Bloqueado para novos pedidos
        </label>
        <label className="ops-field ops-field--check" style={{ marginTop: '-0.25rem' }}>
          <input
            type="checkbox"
            checked={inadimplente}
            onChange={(e) => setInadimplente(e.target.checked)}
          />
          Inadimplente
        </label>
        <label className="ops-field">
          Observações
          <textarea
            rows={3}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Opcional"
          />
        </label>
      </div>
      <div className="ops-modal-acoes">
        <button
          type="button"
          className="btn"
          onClick={() =>
            onSalvar({
              nome,
              nomeFantasia: nomeFantasia || null,
              tabelaPreco: tabelaPreco || null,
              diaVencimentoSemana: dia === '' ? null : Number(dia),
              bloqueadoPedido: bloqueado,
              inadimplente,
              observacoes: observacoes || null,
            })
          }
        >
          Criar
        </button>
        <button type="button" className="btn btn-secundario" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </>
  );
}

function ImportClientesForm({
  onImportar,
  onCancelar,
}: {
  onImportar: (raw: string) => void;
  onCancelar: () => void;
}) {
  const [raw, setRaw] = useState('');
  const preview = useMemo(() => parseImportClientes(raw), [raw]);

  return (
    <>
      <div className="ops-modal-corpo">
        <p style={{ margin: '0 0 0.65rem', color: 'var(--hub-muted)', fontSize: '0.85rem' }}>
          Cole linhas no formato:{' '}
          <code>nome;nome_fantasia;tabela_preco;dia_vencimento(0-6)</code>
        </p>
        <textarea
          rows={9}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="Ex.:\nMercado Central;Mercado Central LTDA;padrao;2\nPadaria da Esquina;;;5"
        />
        <p style={{ margin: '0.6rem 0 0', color: 'var(--hub-muted)', fontSize: '0.85rem' }}>
          Prévia: <strong>{preview.length}</strong> cliente(s)
        </p>
      </div>
      <div className="ops-modal-acoes">
        <button
          type="button"
          className="btn"
          onClick={() => onImportar(raw)}
          disabled={preview.length === 0}
        >
          Importar
        </button>
        <button type="button" className="btn btn-secundario" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </>
  );
}
