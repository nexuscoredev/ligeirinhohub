import { useCallback, useEffect, useState } from 'react';
import { AppPageHeader } from '@/components/AppPageHeader';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import {
  listarDepositos,
  listarMovimentos,
  listarProdutosEstoque,
  registrarMovimento,
} from '@/lib/estoque/api';
import { MOVIMENTO_TIPO_LABEL, type EstoqueMovimentoTipo } from '@/types/estoque';
import './estoque.css';

export function EstoqueMovimentosPage() {
  const app = appPorId('estoque');
  const item = app ? itemAppPorRota(app, '/estoque/movimentos') : null;

  const [depositos, setDepositos] = useState<{ id: string; codigo: string; nome: string }[]>([]);
  const [produtos, setProdutos] = useState<{ id: string; nome: string; sku: string | null }[]>([]);
  const [movimentos, setMovimentos] = useState<Awaited<ReturnType<typeof listarMovimentos>>['movimentos']>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    deposito_id: '',
    produto_id: '',
    tipo: 'entrada' as EstoqueMovimentoTipo,
    quantidade: '',
    documento_ref: '',
    observacoes: '',
  });

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [dRes, pRes, mRes] = await Promise.all([
      listarDepositos(),
      listarProdutosEstoque(),
      listarMovimentos(),
    ]);
    if (dRes.error) setErro(dRes.error.message);
    else {
      setDepositos(dRes.depositos);
      if (!form.deposito_id && dRes.depositos[0]) {
        setForm((s) => ({ ...s, deposito_id: dRes.depositos[0].id }));
      }
      setErro(null);
    }
    if (!pRes.error) setProdutos(pRes.produtos as typeof produtos);
    if (!mRes.error) setMovimentos(mRes.movimentos);
    setCarregando(false);
  }, [form.deposito_id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function gravar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const { error } = await registrarMovimento({
      deposito_id: form.deposito_id,
      produto_id: form.produto_id,
      tipo: form.tipo,
      quantidade: Number(form.quantidade.replace(',', '.')),
      documento_ref: form.documento_ref || null,
      observacoes: form.observacoes || null,
    });
    if (error) {
      setErro(error.message);
      return;
    }
    setErro(null);
    setMsg('Movimento registrado.');
    setForm((s) => ({ ...s, quantidade: '', documento_ref: '', observacoes: '' }));
    void carregar();
  }

  if (!app || !item) return null;

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Entrada e saída"
      subtitulo="Movimentações manuais de estoque por depósito."
    >
      {erro ? <p className="est-erro" role="alert">{erro}</p> : null}
      {msg ? <p className="est-msg">{msg}</p> : null}

      <form className="card est-grid-form" onSubmit={(e) => void gravar(e)}>
        <h2 style={{ gridColumn: '1 / -1', margin: 0 }}>Novo movimento</h2>
        <label className="admin-field">
          Depósito
          <select
            value={form.deposito_id}
            onChange={(e) => setForm((s) => ({ ...s, deposito_id: e.target.value }))}
            required
          >
            {depositos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.codigo} — {d.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          Produto
          <select
            value={form.produto_id}
            onChange={(e) => setForm((s) => ({ ...s, produto_id: e.target.value }))}
            required
          >
            <option value="">Selecione…</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku ? `${p.sku} — ` : ''}{p.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          Tipo
          <select
            value={form.tipo}
            onChange={(e) =>
              setForm((s) => ({ ...s, tipo: e.target.value as EstoqueMovimentoTipo }))
            }
          >
            {(Object.keys(MOVIMENTO_TIPO_LABEL) as EstoqueMovimentoTipo[])
              .filter((t) => t !== 'inventario')
              .map((t) => (
                <option key={t} value={t}>
                  {MOVIMENTO_TIPO_LABEL[t]}
                </option>
              ))}
          </select>
        </label>
        <label className="admin-field">
          Quantidade
          <input
            value={form.quantidade}
            onChange={(e) => setForm((s) => ({ ...s, quantidade: e.target.value }))}
            required
            inputMode="decimal"
          />
        </label>
        <label className="admin-field">
          Documento
          <input
            value={form.documento_ref}
            onChange={(e) => setForm((s) => ({ ...s, documento_ref: e.target.value }))}
          />
        </label>
        <label className="admin-field" style={{ gridColumn: '1 / -1' }}>
          Observações
          <textarea
            value={form.observacoes}
            onChange={(e) => setForm((s) => ({ ...s, observacoes: e.target.value }))}
            rows={2}
          />
        </label>
        <div style={{ gridColumn: '1 / -1' }}>
          <button type="submit" className="est-btn-primario">
            Registrar
          </button>
        </div>
      </form>

      {carregando ? <p className="est-loading">Carregando…</p> : null}

      {!carregando ? (
        <div className="est-lista-wrap card">
          <table className="est-tabela">
            <thead>
              <tr>
                <th>Data</th>
                <th>Produto</th>
                <th>Tipo</th>
                <th className="est-col-num">Qtd</th>
                <th className="est-col-num">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {movimentos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="est-vazio">
                    Nenhum movimento registrado.
                  </td>
                </tr>
              ) : (
                movimentos.map((m) => (
                  <tr key={m.id}>
                    <td>{new Date(m.created_at).toLocaleString('pt-BR')}</td>
                    <td>{m.produtos?.nome ?? '—'}</td>
                    <td>
                      <span className={`est-badge est-badge--${m.tipo}`}>
                        {MOVIMENTO_TIPO_LABEL[m.tipo]}
                      </span>
                    </td>
                    <td className="est-col-num">{m.quantidade}</td>
                    <td className="est-col-num">{m.saldo_posterior ?? '—'}</td>
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
