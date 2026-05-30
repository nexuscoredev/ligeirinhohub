import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppPageHeader } from '@/components/AppPageHeader';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { formatarMoeda } from '@/lib/pedidos/constants';
import { listarNegociacoes } from '@/lib/negociacao/api';
import { TIPO_DOCUMENTO_LABEL } from '@/types/negociacao';
import type { NegociacaoCabecalho } from '@/types/negociacao';
import './negociacao.css';

const STATUS_LABEL: Record<string, string> = {
  orcamento: 'Orçamento',
  aguardando_separacao: 'Aguardando separação',
  em_separacao: 'Em separação',
  separado: 'Separado',
  concluido: 'Concluído',
};

export function NegociacaoListaPage() {
  const app = appPorId('operacional');
  const item = app ? itemAppPorRota(app, '/negociacao') : null;

  const [negociacoes, setNegociacoes] = useState<NegociacaoCabecalho[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { negociacoes: lista, error } = await listarNegociacoes();
    if (error) {
      setErro(
        error.message ||
          'Erro ao carregar negociações. A migration GF Fase 2 foi aplicada no Supabase?',
      );
    } else {
      setNegociacoes(lista);
      setErro(null);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const ordenadas = useMemo(
    () =>
      [...negociacoes].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [negociacoes],
  );

  if (!app || !item) return null;

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Negociações"
      subtitulo="Orçamentos e vendas com operação comercial (Gestão Fácil)."
    >
      <div className="neg-topo-acoes">
        <Link to="/negociacao/nova" className="neg-btn-primario">
          + Nova negociação
        </Link>
      </div>

      {erro ? (
        <p className="neg-erro" role="alert">
          {erro}
        </p>
      ) : null}

      {carregando ? <p className="neg-loading">Carregando…</p> : null}

      {!carregando ? (
        <div className="neg-lista-wrap card">
          <table className="neg-tabela">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Operação</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {ordenadas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="neg-vazio">
                    Nenhuma negociação ainda.{' '}
                    <Link to="/negociacao/nova">Criar a primeira</Link>
                  </td>
                </tr>
              ) : (
                ordenadas.map((n) => (
                  <tr key={n.id}>
                    <td>{n.numero}</td>
                    <td>{n.clientes?.nome_fantasia ?? n.clientes?.nome ?? '—'}</td>
                    <td>{n.operacoes_fiscais?.descricao ?? '—'}</td>
                    <td>
                      {n.tipo_documento
                        ? TIPO_DOCUMENTO_LABEL[n.tipo_documento]
                        : '—'}
                    </td>
                    <td>
                      <span className={`neg-status neg-status--${n.status}`}>
                        {STATUS_LABEL[n.status] ?? n.status}
                      </span>
                    </td>
                    <td>{formatarMoeda(n.valor_pedido)}</td>
                    <td>
                      <Link to={`/negociacao/${n.id}`} className="neg-link">
                        Abrir
                      </Link>
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
