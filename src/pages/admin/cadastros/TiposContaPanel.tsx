import { useCallback, useEffect, useState } from 'react';
import { listarTiposConta, salvarTipoConta } from '@/lib/cadastros/api';
import {
  TIPO_CONTA_NATUREZA_LABEL,
  type GfTipoContaNatureza,
  type TipoConta,
} from '@/types/cadastrosGf';

const NATUREZAS = Object.keys(TIPO_CONTA_NATUREZA_LABEL) as GfTipoContaNatureza[];

interface Props {
  podeEditar: boolean;
  onErro: (msg: string | null) => void;
  onMsg: (msg: string | null) => void;
}

export function TiposContaPanel({ podeEditar, onErro, onMsg }: Props) {
  const [tipos, setTipos] = useState<TipoConta[]>([]);
  const [form, setForm] = useState({
    id: undefined as string | undefined,
    codigo: '',
    nome: '',
    natureza: 'receita' as GfTipoContaNatureza,
    ativo: true,
  });

  const carregar = useCallback(async () => {
    const { tipos: lista, error } = await listarTiposConta();
    if (error) onErro(error.message);
    else {
      setTipos(lista);
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
    const { error } = await salvarTipoConta(form);
    if (error) {
      onErro(error.message);
      return;
    }
    onMsg('Tipo de conta salvo.');
    setForm({ id: undefined, codigo: '', nome: '', natureza: 'receita', ativo: true });
    void carregar();
  }

  return (
    <div className="cadastros-base-grid">
      <form className="card cadastros-form" onSubmit={(e) => void gravar(e)}>
        <h2>{form.id ? 'Editar tipo' : 'Novo tipo de conta'}</h2>
        <label className="admin-field">
          Código
          <input
            value={form.codigo}
            onChange={(e) => setForm((s) => ({ ...s, codigo: e.target.value }))}
            required
            disabled={!podeEditar}
          />
        </label>
        <label className="admin-field">
          Nome
          <input
            value={form.nome}
            onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))}
            required
            disabled={!podeEditar}
          />
        </label>
        <label className="admin-field">
          Natureza
          <select
            value={form.natureza}
            onChange={(e) =>
              setForm((s) => ({ ...s, natureza: e.target.value as GfTipoContaNatureza }))
            }
            disabled={!podeEditar}
          >
            {NATUREZAS.map((n) => (
              <option key={n} value={n}>
                {TIPO_CONTA_NATUREZA_LABEL[n]}
              </option>
            ))}
          </select>
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
        <h2>Tipos ({tipos.length})</h2>
        <ul className="cadastros-tabela">
          {tipos.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="cadastros-linha"
                onClick={() =>
                  setForm({
                    id: t.id,
                    codigo: t.codigo,
                    nome: t.nome,
                    natureza: t.natureza,
                    ativo: t.ativo,
                  })
                }
                disabled={!podeEditar}
              >
                <strong>{t.codigo}</strong>
                <span>{t.nome}</span>
                <span className="cadastros-tag">{TIPO_CONTA_NATUREZA_LABEL[t.natureza]}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
