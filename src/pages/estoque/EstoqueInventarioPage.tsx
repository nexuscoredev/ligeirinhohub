import { useCallback, useEffect, useState } from 'react';
import { AppPageHeader } from '@/components/AppPageHeader';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import {
  listarDepositos,
  listarProdutosEstoque,
  listarSaldos,
  registrarMovimento,
} from '@/lib/estoque/api';
import './estoque.css';

interface Props {
  modoApp?: boolean;
}

export function EstoqueInventarioPage({ modoApp = false }: Props) {
  const rota = modoApp ? '/estoque/inventario/app' : '/estoque/inventario';
  const app = appPorId('estoque');
  const item = app ? itemAppPorRota(app, rota) : null;

  const [depositos, setDepositos] = useState<{ id: string; codigo: string; nome: string }[]>([]);
  const [produtos, setProdutos] = useState<{ id: string; nome: string; sku: string | null }[]>([]);
  const [depositoId, setDepositoId] = useState('');
  const [saldos, setSaldos] = useState<Awaited<ReturnType<typeof listarSaldos>>['saldos']>([]);
  const [contagens, setContagens] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [dRes, pRes] = await Promise.all([listarDepositos(), listarProdutosEstoque()]);
    if (dRes.error) setErro(dRes.error.message);
    else {
      setDepositos(dRes.depositos);
      const dep = depositoId || dRes.depositos[0]?.id || '';
      if (dep && dep !== depositoId) setDepositoId(dep);
    }
    if (!pRes.error) setProdutos(pRes.produtos as typeof produtos);

    if (depositoId || dRes.depositos[0]?.id) {
      const dep = depositoId || dRes.depositos[0]?.id;
      const { saldos: lista, error } = await listarSaldos(dep);
      if (error) setErro(error.message);
      else setSaldos(lista);
    }
    setCarregando(false);
  }, [depositoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function aplicarInventario(produtoId: string) {
    const qtdStr = contagens[produtoId];
    if (!qtdStr) return;
    const qtd = Number(qtdStr.replace(',', '.'));
    if (Number.isNaN(qtd) || qtd < 0) {
      setErro('Quantidade inválida.');
      return;
    }
    setMsg(null);
    const { error } = await registrarMovimento({
      deposito_id: depositoId,
      produto_id: produtoId,
      tipo: 'inventario',
      quantidade: qtd,
      observacoes: 'Inventário físico',
    });
    if (error) {
      setErro(error.message);
      return;
    }
    setErro(null);
    setMsg('Contagem aplicada.');
    void carregar();
  }

  if (!app || !item) return null;

  const conteudo = (
    <>
      {erro ? <p className="est-erro" role="alert">{erro}</p> : null}
      {msg ? <p className="est-msg">{msg}</p> : null}

      <div className="est-toolbar">
        <label>
          Depósito
          <select value={depositoId} onChange={(e) => setDepositoId(e.target.value)}>
            {depositos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.codigo} — {d.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      {carregando ? <p className="est-loading">Carregando…</p> : null}

      {!carregando ? (
        <div className="est-lista-wrap card">
          <table className="est-tabela">
            <thead>
              <tr>
                <th>Produto</th>
                <th className="est-col-num">Sistema</th>
                <th className="est-col-num">Contagem</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {produtos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="est-vazio">
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              ) : (
                produtos.map((p) => {
                  const saldo = saldos.find((s) => s.produto_id === p.id);
                  return (
                    <tr key={p.id}>
                      <td>
                        {p.sku ? `${p.sku} — ` : ''}{p.nome}
                      </td>
                      <td className="est-col-num">{saldo?.quantidade ?? 0}</td>
                      <td className="est-col-num">
                        <input
                          type="text"
                          inputMode="decimal"
                          style={{ width: '5rem', textAlign: 'right' }}
                          value={contagens[p.id] ?? ''}
                          onChange={(e) =>
                            setContagens((c) => ({ ...c, [p.id]: e.target.value }))
                          }
                          placeholder="0"
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="est-btn-secundario"
                          onClick={() => void aplicarInventario(p.id)}
                        >
                          Aplicar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo={modoApp ? 'Inventário (mobile)' : 'Inventário'}
      subtitulo="Informe a contagem física — o sistema gera ajuste automático."
    >
      <div className={modoApp ? 'est-app-layout' : undefined}>{conteudo}</div>
    </AppPageHeader>
  );
}

export function EstoqueInventarioAppPage() {
  return <EstoqueInventarioPage modoApp />;
}
