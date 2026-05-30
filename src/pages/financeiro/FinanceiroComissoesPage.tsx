import { useCallback, useEffect, useState } from 'react';
import { AppPageHeader } from '@/components/AppPageHeader';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import {
  atualizarStatusComissao,
  listarComissoes,
  listarPessoasResumo,
  salvarComissao,
} from '@/lib/financeiro/api';
import { formatarMoeda } from '@/lib/pedidos/constants';
import { COMISSAO_STATUS_LABEL, type Comissao } from '@/types/financeiro';
import './financeiro.css';

export function FinanceiroComissoesPage() {
  const app = appPorId('financeiro');
  const item = app ? itemAppPorRota(app, '/financeiro/comissoes') : null;

  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [pessoas, setPessoas] = useState<{ id: string; nome: string; nome_fantasia: string | null }[]>(
    [],
  );
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    descricao: '',
    valor: '',
    vendedor_pessoa_id: '',
    percentual: '',
  });

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [cRes, pRes] = await Promise.all([listarComissoes(), listarPessoasResumo()]);
    if (cRes.error) setErro(cRes.error.message);
    else {
      setComissoes(cRes.comissoes);
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
    const { error } = await salvarComissao({
      descricao: form.descricao,
      valor: Number(form.valor.replace(',', '.')),
      vendedor_pessoa_id: form.vendedor_pessoa_id || null,
      percentual: form.percentual ? Number(form.percentual.replace(',', '.')) : null,
    });
    if (error) {
      setErro(error.message);
      return;
    }
    setErro(null);
    setMsg('Comissão registrada.');
    setForm({ descricao: '', valor: '', vendedor_pessoa_id: '', percentual: '' });
    void carregar();
  }

  if (!app || !item) return null;

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Comissões"
      subtitulo="Comissões de vendedores vinculadas a pedidos ou lançamentos avulsos."
    >
      {erro ? (
        <p className="fin-erro" role="alert">
          {erro}
        </p>
      ) : null}
      {msg ? <p className="fin-msg">{msg}</p> : null}

      <form className="card fin-grid-form" onSubmit={(e) => void gravar(e)}>
        <h2 style={{ gridColumn: '1 / -1', margin: 0 }}>Nova comissão</h2>
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
            value={form.valor}
            onChange={(e) => setForm((s) => ({ ...s, valor: e.target.value }))}
            required
            inputMode="decimal"
          />
        </label>
        <label className="admin-field">
          Vendedor
          <select
            value={form.vendedor_pessoa_id}
            onChange={(e) => setForm((s) => ({ ...s, vendedor_pessoa_id: e.target.value }))}
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
          % (opcional)
          <input
            value={form.percentual}
            onChange={(e) => setForm((s) => ({ ...s, percentual: e.target.value }))}
            inputMode="decimal"
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
                <th>Descrição</th>
                <th>Vendedor</th>
                <th>Pedido</th>
                <th className="fin-col-num">Valor</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {comissoes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="fin-vazio">
                    Nenhuma comissão registrada.
                  </td>
                </tr>
              ) : (
                comissoes.map((c) => (
                  <tr key={c.id}>
                    <td>{c.descricao}</td>
                    <td>{c.pessoas?.nome_fantasia ?? c.pessoas?.nome ?? '—'}</td>
                    <td>{c.pedidos?.numero ? `#${c.pedidos.numero}` : '—'}</td>
                    <td className="fin-col-num">{formatarMoeda(c.valor)}</td>
                    <td>
                      <span className={`fin-badge fin-badge--${c.status}`}>
                        {COMISSAO_STATUS_LABEL[c.status]}
                      </span>
                    </td>
                    <td>
                      {c.status === 'pendente' ? (
                        <button
                          type="button"
                          className="fin-btn-secundario"
                          onClick={() =>
                            void atualizarStatusComissao(c.id, 'paga').then(({ error }) => {
                              if (error) setErro(error.message);
                              else void carregar();
                            })
                          }
                        >
                          Marcar paga
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
    </AppPageHeader>
  );
}
