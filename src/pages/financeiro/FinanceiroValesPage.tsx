import { useCallback, useEffect, useState } from 'react';
import { AppPageHeader } from '@/components/AppPageHeader';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { listarPessoasResumo, listarValesDesconto, salvarValeDesconto } from '@/lib/financeiro/api';
import { formatarMoeda } from '@/lib/pedidos/constants';
import { VALE_STATUS_LABEL, type ValeDesconto } from '@/types/financeiro';
import './financeiro.css';

export function FinanceiroValesPage() {
  const app = appPorId('financeiro');
  const item = app ? itemAppPorRota(app, '/financeiro/vales') : null;

  const [vales, setVales] = useState<ValeDesconto[]>([]);
  const [pessoas, setPessoas] = useState<{ id: string; nome: string; nome_fantasia: string | null }[]>(
    [],
  );
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    descricao: '',
    valor_original: '',
    pessoa_id: '',
    codigo: '',
    validade: '',
  });

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [vRes, pRes] = await Promise.all([listarValesDesconto(), listarPessoasResumo()]);
    if (vRes.error) setErro(vRes.error.message);
    else {
      setVales(vRes.vales);
      setErro(null);
    }
    if (!pRes.error) setPessoas(pRes.pessoas as typeof pessoas);
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function gravar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const { error } = await salvarValeDesconto({
      descricao: form.descricao,
      valor_original: Number(form.valor_original.replace(',', '.')),
      pessoa_id: form.pessoa_id || null,
      codigo: form.codigo || null,
      validade: form.validade || null,
    });
    if (error) {
      setErro(error.message);
      return;
    }
    setErro(null);
    setMsg('Vale registrado.');
    setForm({ descricao: '', valor_original: '', pessoa_id: '', codigo: '', validade: '' });
    void carregar();
  }

  if (!app || !item) return null;

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Vales desconto"
      subtitulo="Créditos promocionais ou compensações para clientes."
    >
      {erro ? (
        <p className="fin-erro" role="alert">
          {erro}
        </p>
      ) : null}
      {msg ? <p className="fin-msg">{msg}</p> : null}

      <form className="card fin-grid-form" onSubmit={(e) => void gravar(e)}>
        <h2 style={{ gridColumn: '1 / -1', margin: 0 }}>Novo vale</h2>
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
          Cliente
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
          Código
          <input
            value={form.codigo}
            onChange={(e) => setForm((s) => ({ ...s, codigo: e.target.value }))}
          />
        </label>
        <label className="admin-field">
          Validade
          <input
            type="date"
            value={form.validade}
            onChange={(e) => setForm((s) => ({ ...s, validade: e.target.value }))}
          />
        </label>
        <div style={{ gridColumn: '1 / -1' }}>
          <button type="submit" className="fin-btn-primario">
            Salvar
          </button>
        </div>
      </form>

      {carregando ? <p className="fin-loading">Carregando…</p> : null}

      {!carregando ? (
        <div className="fin-lista-wrap card">
          <table className="fin-tabela">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Cliente</th>
                <th className="fin-col-num">Saldo</th>
                <th>Validade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="fin-vazio">
                    Nenhum vale registrado.
                  </td>
                </tr>
              ) : (
                vales.map((v) => (
                  <tr key={v.id}>
                    <td>{v.codigo ?? '—'}</td>
                    <td>{v.descricao}</td>
                    <td>{v.pessoas?.nome_fantasia ?? v.pessoas?.nome ?? '—'}</td>
                    <td className="fin-col-num">{formatarMoeda(v.saldo)}</td>
                    <td>
                      {v.validade
                        ? new Date(v.validade).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td>
                      <span className={`fin-badge fin-badge--${v.status}`}>
                        {VALE_STATUS_LABEL[v.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </AppPageHeader>
  );
}
