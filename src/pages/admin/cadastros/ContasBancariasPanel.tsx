import { useCallback, useEffect, useState } from 'react';
import { listarContasBancarias, salvarContaBancaria } from '@/lib/cadastros/api';
import type { ContaBancaria } from '@/types/cadastrosGf';

interface Props {
  podeEditar: boolean;
  onErro: (msg: string | null) => void;
  onMsg: (msg: string | null) => void;
}

export function ContasBancariasPanel({ podeEditar, onErro, onMsg }: Props) {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [form, setForm] = useState({
    id: undefined as string | undefined,
    banco_codigo: '',
    agencia: '',
    conta: '',
    titular: '',
    ativo: true,
  });

  const carregar = useCallback(async () => {
    const { contas: lista, error } = await listarContasBancarias();
    if (error) onErro(error.message);
    else {
      setContas(lista);
      onErro(null);
    }
  }, [onErro]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function gravar(e: React.FormEvent) {
    e.preventDefault();
    if (!podeEditar) return;
    onMsg(null);
    const { error } = await salvarContaBancaria(form);
    if (error) {
      onErro(error.message);
      return;
    }
    onMsg('Conta bancária salva.');
    setForm({
      id: undefined,
      banco_codigo: '',
      agencia: '',
      conta: '',
      titular: '',
      ativo: true,
    });
    void carregar();
  }

  return (
    <div className="cadastros-base-grid">
      <form className="card cadastros-form" onSubmit={(e) => void gravar(e)}>
        <h2>{form.id ? 'Editar conta' : 'Nova conta bancária'}</h2>
        <label className="admin-field">
          Código do banco
          <input
            value={form.banco_codigo}
            onChange={(e) => setForm((s) => ({ ...s, banco_codigo: e.target.value }))}
            required
            disabled={!podeEditar}
          />
        </label>
        <label className="admin-field">
          Agência
          <input
            value={form.agencia}
            onChange={(e) => setForm((s) => ({ ...s, agencia: e.target.value }))}
            required
            disabled={!podeEditar}
          />
        </label>
        <label className="admin-field">
          Conta
          <input
            value={form.conta}
            onChange={(e) => setForm((s) => ({ ...s, conta: e.target.value }))}
            required
            disabled={!podeEditar}
          />
        </label>
        <label className="admin-field">
          Titular
          <input
            value={form.titular}
            onChange={(e) => setForm((s) => ({ ...s, titular: e.target.value }))}
            required
            disabled={!podeEditar}
          />
        </label>
        <label className="admin-field admin-field-check">
          <input
            type="checkbox"
            checked={form.ativo}
            onChange={(e) => setForm((s) => ({ ...s, ativo: e.target.checked }))}
            disabled={!podeEditar}
          />
          Ativo
        </label>
        {podeEditar ? (
          <button type="submit" className="btn-primario">
            Salvar
          </button>
        ) : null}
      </form>
      <div className="card cadastros-lista">
        <h2>Contas ({contas.length})</h2>
        <ul className="cadastros-tabela">
          {contas.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="cadastros-linha"
                onClick={() =>
                  setForm({
                    id: c.id,
                    banco_codigo: c.banco_codigo,
                    agencia: c.agencia,
                    conta: c.conta,
                    titular: c.titular,
                    ativo: c.ativo,
                  })
                }
                disabled={!podeEditar}
              >
                <strong>{c.titular}</strong>
                <span>
                  {c.banco_codigo} · ag {c.agencia} · cc {c.conta}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
