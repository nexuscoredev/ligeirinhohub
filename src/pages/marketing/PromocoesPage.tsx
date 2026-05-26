import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppPageHeader } from '@/components/AppPageHeader';
import { MktProdutoThumb } from '@/components/marketing/MktProdutoThumb';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { fetchCatalogoLegado, flattenCatalogo } from '@/lib/catalogo/fetchCatalogo';
import type { ProdutoCatalogoView } from '@/lib/catalogo/types';
import { imagemPromocaoSku, mapaImagensCatalogo } from '@/lib/marketing/catalogoImagens';
import {
  atualizarPromocao,
  criarPromocao,
  excluirPromocao,
  listarPromocoes,
} from '@/lib/marketing/api';
import {
  formatarValidade,
  hojeLocal,
  promoExpiraEmBreve,
  promoExpirada,
  promoVigente,
} from '@/lib/marketing/helpers';
import { formatarMoeda } from '@/lib/pedidos/constants';
import { supabase } from '@/lib/supabase';
import type { Promocao, PromocaoInsert } from '@/types/marketing';
import './marketing.css';

const FORM_VAZIO = {
  produto_sku: '',
  preco_promo: '',
  validade_inicio: hojeLocal(),
  validade_fim: hojeLocal(),
  ativo: true,
};

export function PromocoesPage() {
  const app = appPorId('marketing');
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [catalogo, setCatalogo] = useState<ProdutoCatalogoView[]>([]);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(FORM_VAZIO);
  const [editId, setEditId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const ref = hojeLocal();

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [promRes, cat] = await Promise.all([
      listarPromocoes(),
      fetchCatalogoLegado().then(flattenCatalogo).catch(() => [] as ProdutoCatalogoView[]),
    ]);
    if (promRes.error) setErro(promRes.error.message);
    else {
      setPromocoes(promRes.promocoes);
      setErro(null);
    }
    setCatalogo(cat);
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    const channel = supabase
      .channel('marketing-promocoes-crud')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'promocoes' },
        () => void carregar(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [carregar]);

  const produtosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return catalogo.slice(0, 80);
    return catalogo
      .filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q),
      )
      .slice(0, 80);
  }, [catalogo, busca]);

  const produtoSel = catalogo.find((p) => p.sku === form.produto_sku);

  const imagensPorSku = useMemo(() => mapaImagensCatalogo(catalogo), [catalogo]);

  function resetForm() {
    setForm({ ...FORM_VAZIO, validade_inicio: ref, validade_fim: ref });
    setEditId(null);
  }

  function iniciarEdicao(p: Promocao) {
    setEditId(p.id);
    setForm({
      produto_sku: p.produto_sku,
      preco_promo: String(p.preco_promo),
      validade_inicio: p.validade_inicio,
      validade_fim: p.validade_fim,
      ativo: p.ativo,
    });
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!produtoSel || !form.preco_promo) {
      setErro('Selecione um produto e informe o preço promocional.');
      return;
    }
    const precoPromo = Number(form.preco_promo.replace(',', '.'));
    if (Number.isNaN(precoPromo) || precoPromo < 0) {
      setErro('Preço promocional inválido.');
      return;
    }
    if (form.validade_fim < form.validade_inicio) {
      setErro('Data fim deve ser igual ou posterior à data início.');
      return;
    }

    setSalvando(true);
    setErro(null);
    const payload: PromocaoInsert = {
      produto_sku: produtoSel.sku,
      produto_nome: produtoSel.nome,
      preco_original: produtoSel.preco_base,
      preco_promo: precoPromo,
      validade_inicio: form.validade_inicio,
      validade_fim: form.validade_fim,
      ativo: form.ativo,
    };

    const res = editId
      ? await atualizarPromocao(editId, payload)
      : await criarPromocao(payload);

    setSalvando(false);
    if (res.error) {
      setErro(res.error.message);
      return;
    }
    resetForm();
    void carregar();
  }

  async function remover(id: string) {
    if (!window.confirm('Excluir esta promoção?')) return;
    const { error } = await excluirPromocao(id);
    if (error) setErro(error.message);
    else void carregar();
  }

  async function toggleAtivo(p: Promocao) {
    const { error } = await atualizarPromocao(p.id, { ativo: !p.ativo });
    if (error) setErro(error.message);
  }

  if (!app) return null;

  const item = itemAppPorRota(app, '/marketing/promocoes');

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Promoções do dia"
      subtitulo="Produtos do catálogo legado — uma carga em cache, sem consultar Supabase a cada abertura."
    >
      {erro ? <p className="erro">{erro}</p> : null}

      <form className="card" onSubmit={salvar}>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>
          {editId ? 'Editar promoção' : 'Nova promoção'}
        </h2>

        <div className="mkt-toolbar">
          <label style={{ flex: 1, minWidth: 200 }}>
            Buscar no catálogo
            <input
              value={busca}
              onChange={(ev) => setBusca(ev.target.value)}
              placeholder="Nome ou SKU"
            />
          </label>
        </div>

        <div className="mkt-form-grid">
          <label>
            Produto
            <select
              required
              value={form.produto_sku}
              onChange={(ev) =>
                setForm((f) => ({ ...f, produto_sku: ev.target.value }))
              }
            >
              <option value="">Selecione…</option>
              {produtosFiltrados.map((p) => (
                <option key={p.sku} value={p.sku}>
                  {p.nome} — {formatarMoeda(p.preco_base)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Preço promocional (R$)
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={form.preco_promo}
              onChange={(ev) =>
                setForm((f) => ({ ...f, preco_promo: ev.target.value }))
              }
            />
          </label>
          <label>
            Válido de
            <input
              type="date"
              required
              value={form.validade_inicio}
              onChange={(ev) =>
                setForm((f) => ({ ...f, validade_inicio: ev.target.value }))
              }
            />
          </label>
          <label>
            Até
            <input
              type="date"
              required
              value={form.validade_fim}
              onChange={(ev) =>
                setForm((f) => ({ ...f, validade_fim: ev.target.value }))
              }
            />
          </label>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(ev) =>
                setForm((f) => ({ ...f, ativo: ev.target.checked }))
              }
            />
            Ativa na TV
          </label>
        </div>

        {produtoSel ? (
          <div className="mkt-form-preview">
            <MktProdutoThumb
              src={imagemPromocaoSku(produtoSel.sku, imagensPorSku)}
              nome={produtoSel.nome}
              size="sm"
            />
            <div>
              <strong>{produtoSel.nome}</strong>
              <p>
                Tabela {formatarMoeda(produtoSel.preco_base)} · SKU {produtoSel.sku}
              </p>
            </div>
          </div>
        ) : null}

        <div className="mkt-form-acoes">
          <button type="submit" className="btn" disabled={salvando}>
            {salvando ? 'Salvando…' : editId ? 'Atualizar' : 'Criar promoção'}
          </button>
          {editId ? (
            <button type="button" className="btn btn-secundario" onClick={resetForm}>
              Cancelar edição
            </button>
          ) : null}
        </div>
      </form>

      {carregando ? (
        <p style={{ color: 'var(--hub-muted)' }}>Carregando…</p>
      ) : (
        <ul className="mkt-promo-grid" aria-label="Lista de promoções">
          {promocoes.map((p) => {
            const vigente = promoVigente(p, ref);
            const expira = promoExpiraEmBreve(p, 3, ref);
            const expirada = promoExpirada(p, ref);
            const img = imagemPromocaoSku(p.produto_sku, imagensPorSku);
            const desconto =
              p.preco_original > 0 && p.preco_promo < p.preco_original
                ? Math.round((1 - p.preco_promo / p.preco_original) * 100)
                : null;
            const statusLabel = vigente
              ? 'Na TV'
              : expira && p.ativo && !expirada
                ? 'Expira em breve'
                : !p.ativo
                  ? 'Inativa'
                  : expirada
                    ? 'Expirada'
                    : 'Fora do período';
            const statusClass = vigente
              ? 'mkt-badge--ok'
              : expira && p.ativo && !expirada
                ? 'mkt-badge--warn'
                : 'mkt-badge--off';

            return (
              <li
                key={p.id}
                className={`mkt-promo-card${vigente ? ' mkt-promo-card--vigente' : ''}${expira && vigente ? ' mkt-promo-card--expira' : ''}${!p.ativo || expirada ? ' mkt-promo-card--inativa' : ''}`}
              >
                <MktProdutoThumb src={img} nome={p.produto_nome} size="md" />

                <div className="mkt-promo-card__corpo">
                  <div className="mkt-promo-card__topo">
                    <h3 className="mkt-promo-card__nome">{p.produto_nome}</h3>
                    <span className={`mkt-badge ${statusClass}`}>{statusLabel}</span>
                  </div>
                  <p className="mkt-promo-card__meta">
                    {formatarValidade(p.validade_inicio, p.validade_fim)}
                  </p>
                  <div className="mkt-promo-card__precos">
                    <span className="mkt-preco-promo">{formatarMoeda(p.preco_promo)}</span>
                    {p.preco_promo < p.preco_original ? (
                      <span className="mkt-preco-original">{formatarMoeda(p.preco_original)}</span>
                    ) : null}
                    {desconto != null && desconto > 0 ? (
                      <span className="mkt-promo-card__desconto">−{desconto}%</span>
                    ) : null}
                  </div>
                </div>

                <div className="mkt-promo-card__acoes">
                  <button type="button" className="btn btn-secundario" onClick={() => iniciarEdicao(p)}>
                    Editar
                  </button>
                  <button type="button" className="btn btn-secundario" onClick={() => void toggleAtivo(p)}>
                    {p.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                  <button type="button" className="btn btn-secundario" onClick={() => void remover(p.id)}>
                    Excluir
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppPageHeader>
  );
}
