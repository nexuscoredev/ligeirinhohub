import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppPageHeader } from '@/components/AppPageHeader';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import {
  cancelarContaFinanceira,
  listarContasFinanceiras,
  listarPessoasResumo,
  registrarBaixaConta,
  salvarContaFinanceira,
} from '@/lib/financeiro/api';
import { formatarMoeda } from '@/lib/pedidos/constants';
import { CONTA_STATUS_LABEL, type ContaFinanceira } from '@/types/financeiro';
import './financeiro.css';

interface Props {
  natureza: 'receber' | 'pagar';
}

function ContasFinanceirasPage({ natureza }: Props) {
  const rota = natureza === 'receber' ? '/financeiro/receber' : '/financeiro/pagar';
  const app = appPorId('financeiro');
  const item = app ? itemAppPorRota(app, rota) : null;

  const [contas, setContas] = useState<ContaFinanceira[]>([]);
  const [pessoas, setPessoas] = useState<{ id: string; nome: string; nome_fantasia: string | null }[]>(
    [],
  );
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>('todas');
  const [baixaConta, setBaixaConta] = useState<ContaFinanceira | null>(null);
  const [valorBaixa, setValorBaixa] = useState('');

  const [form, setForm] = useState({
    descricao: '',
    valor_original: '',
    data_vencimento: '',
    pessoa_id: '',
    documento_ref: '',
  });

  const titulo = natureza === 'receber' ? 'Contas a receber' : 'Contas a pagar';
  const subtitulo =
    natureza === 'receber'
      ? 'Títulos de clientes — baixas atualizam inadimplência.'
      : 'Obrigações com fornecedores e despesas.';

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [cRes, pRes] = await Promise.all([
      listarContasFinanceiras(natureza),
      listarPessoasResumo(),
    ]);
    if (cRes.error) setErro(cRes.error.message);
    else {
      setContas(cRes.contas);
      setErro(null);
    }
    if (!pRes.error) setPessoas(pRes.pessoas as typeof pessoas);
    setCarregando(false);
  }, [natureza]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtradas = useMemo(() => {
    if (filtroStatus === 'todas') return contas;
    return contas.filter((c) => c.status === filtroStatus);
  }, [contas, filtroStatus]);

  async function gravarConta(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const valor = Number(form.valor_original.replace(',', '.'));
    const { error } = await salvarContaFinanceira({
      natureza,
      descricao: form.descricao,
      valor_original: valor,
      data_vencimento: form.data_vencimento,
      pessoa_id: form.pessoa_id || null,
      documento_ref: form.documento_ref || null,
    });
    if (error) {
      setErro(error.message);
      return;
    }
    setErro(null);
    setMsg('Conta registrada.');
    setForm({
      descricao: '',
      valor_original: '',
      data_vencimento: '',
      pessoa_id: '',
      documento_ref: '',
    });
    void carregar();
  }

  async function confirmarBaixa(e: React.FormEvent) {
    e.preventDefault();
    if (!baixaConta) return;
    const valor = Number(valorBaixa.replace(',', '.'));
    const { error } = await registrarBaixaConta({
      conta_financeira_id: baixaConta.id,
      valor,
    });
    if (error) {
      setErro(error.message);
      return;
    }
    setErro(null);
    setMsg('Baixa registrada.');
    setBaixaConta(null);
    setValorBaixa('');
    void carregar();
  }

  if (!app || !item) return null;

  return (
    <AppPageHeader app={app} item={item} titulo={titulo} subtitulo={subtitulo}>
      {erro ? (
        <p className="fin-erro" role="alert">
          {erro}
        </p>
      ) : null}
      {msg ? <p className="fin-msg">{msg}</p> : null}

      <form className="card fin-grid-form" onSubmit={(e) => void gravarConta(e)}>
        <h2 style={{ gridColumn: '1 / -1', margin: 0 }}>Nova conta</h2>
        <label className="admin-field">
          Descrição
          <input
            value={form.descricao}
            onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
            required
          />
        </label>
        <label className="admin-field">
          Valor
          <input
            value={form.valor_original}
            onChange={(e) => setForm((s) => ({ ...s, valor_original: e.target.value }))}
            required
            inputMode="decimal"
          />
        </label>
        <label className="admin-field">
          Vencimento
          <input
            type="date"
            value={form.data_vencimento}
            onChange={(e) => setForm((s) => ({ ...s, data_vencimento: e.target.value }))}
            required
          />
        </label>
        <label className="admin-field">
          Pessoa
          <select
            value={form.pessoa_id}
            onChange={(e) => setForm((s) => ({ ...s, pessoa_id: e.target.value }))}
          >
            <option value="">— opcional —</option>
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome_fantasia ?? p.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          Documento
          <input
            value={form.documento_ref}
            onChange={(e) => setForm((s) => ({ ...s, documento_ref: e.target.value }))}
          />
        </label>
        <div style={{ gridColumn: '1 / -1' }}>
          <button type="submit" className="fin-btn-primario">
            Salvar
          </button>
        </div>
      </form>

      <div className="fin-toolbar">
        <label>
          Status
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="todas">Todos</option>
            {Object.entries(CONTA_STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="fin-btn-secundario" onClick={() => void carregar()}>
          Atualizar
        </button>
      </div>

      {carregando ? <p className="fin-loading">Carregando…</p> : null}

      {!carregando ? (
        <div className="fin-lista-wrap card">
          <table className="fin-tabela">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Pessoa</th>
                <th>Vencimento</th>
                <th className="fin-col-num">Saldo</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="fin-vazio">
                    Nenhuma conta encontrada.
                  </td>
                </tr>
              ) : (
                filtradas.map((c) => (
                  <tr key={c.id}>
                    <td>
                      {c.descricao}
                      {c.pedidos?.numero ? (
                        <div style={{ fontSize: '0.72rem', color: 'var(--hub-muted)' }}>
                          Pedido #{c.pedidos.numero}
                        </div>
                      ) : null}
                    </td>
                    <td>{c.pessoas?.nome_fantasia ?? c.pessoas?.nome ?? '—'}</td>
                    <td>{new Date(c.data_vencimento).toLocaleDateString('pt-BR')}</td>
                    <td className="fin-col-num">{formatarMoeda(c.valor_saldo)}</td>
                    <td>
                      <span className={`fin-badge fin-badge--${c.status}`}>
                        {CONTA_STATUS_LABEL[c.status]}
                      </span>
                    </td>
                    <td>
                      {c.valor_saldo > 0 && c.status !== 'cancelada' ? (
                        <button
                          type="button"
                          className="fin-btn-secundario"
                          onClick={() => {
                            setBaixaConta(c);
                            setValorBaixa(String(c.valor_saldo));
                          }}
                        >
                          Baixar
                        </button>
                      ) : null}{' '}
                      {c.status !== 'paga' && c.status !== 'cancelada' ? (
                        <button
                          type="button"
                          className="fin-btn-secundario"
                          onClick={() =>
                            void cancelarContaFinanceira(c.id).then(({ error }) => {
                              if (error) setErro(error.message);
                              else void carregar();
                            })
                          }
                        >
                          Cancelar
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {baixaConta ? (
        <div className="fin-modal-backdrop" role="dialog" aria-modal="true">
          <form className="fin-modal" onSubmit={(e) => void confirmarBaixa(e)}>
            <h3>Baixa — {baixaConta.descricao}</h3>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem' }}>
              Saldo: {formatarMoeda(baixaConta.valor_saldo)}
            </p>
            <label className="admin-field">
              Valor da baixa
              <input
                value={valorBaixa}
                onChange={(e) => setValorBaixa(e.target.value)}
                required
                inputMode="decimal"
              />
            </label>
            <div className="fin-modal-acoes">
              <button type="submit" className="fin-btn-primario">
                Confirmar
              </button>
              <button
                type="button"
                className="fin-btn-secundario"
                onClick={() => setBaixaConta(null)}
              >
                Fechar
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AppPageHeader>
  );
}

export function FinanceiroReceberPage() {
  return <ContasFinanceirasPage natureza="receber" />;
}

export function FinanceiroPagarPage() {
  return <ContasFinanceirasPage natureza="pagar" />;
}
