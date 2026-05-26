import { useCallback, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppPageHeader } from '@/components/AppPageHeader';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import {
  FORMATOS_ARTE,
  TEMAS_VISUAIS,
  TIPOS_CAMPANHA,
  TIPOS_PRODUTO,
  TITULOS_SUGERIDOS,
} from '@/lib/marketing/creator/constants';
import { novoProdutoArte } from '@/lib/marketing/creator/defaults';
import { gerarPreviewDataUrl, gerarVariacoes } from '@/lib/marketing/creator/gerarPreview';
import { salvarArteGaleria, tituloArte } from '@/lib/marketing/creator/storage';
import { ArtePreview } from '@/pages/marketing/creator/components/ArtePreview';
import { CreatorStepper } from '@/pages/marketing/creator/components/CreatorStepper';
import {
  MarketingCreatorProvider,
  useMarketingCreator,
} from '@/pages/marketing/creator/MarketingCreatorProvider';
import './marketing-creator.css';

function Toggle({
  label,
  ativo,
  onChange,
  children,
}: {
  label: string;
  ativo: boolean;
  onChange: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="mkt-toggle-row">
      <div className="mkt-toggle-row-top">
        <span>{label}</span>
        <button
          type="button"
          className={`mkt-toggle ${ativo ? 'ativo' : ''}`}
          role="switch"
          aria-checked={ativo}
          onClick={() => onChange(!ativo)}
        >
          {ativo ? 'Ativado' : 'Desativado'}
        </button>
      </div>
      {ativo ? children : null}
    </div>
  );
}

function CreatorWizard() {
  const navigate = useNavigate();
  const { estado, dispatch, avancar, voltar, irPara } = useMarketingCreator();
  const [erro, setErro] = useState<string | null>(null);
  const [previewGerado, setPreviewGerado] = useState<string | null>(null);
  const [variacoes, setVariacoes] = useState<string[]>([]);

  const podeContinuar = useCallback((): boolean => {
    switch (estado.passo) {
      case 1:
        return estado.tipoCampanha !== null;
      case 2:
        return estado.tema !== null;
      case 7:
        return estado.formato !== null;
      default:
        return true;
    }
  }, [estado]);

  function handleContinuar() {
    if (!podeContinuar()) {
      setErro('Selecione uma opção para continuar.');
      return;
    }
    setErro(null);
    if (estado.passo === 6 && estado.config.modo === 'rapido') {
      dispatch({ type: 'APLICAR_MODO_RAPIDO' });
    }
    avancar();
  }

  function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg|webp)$/i.test(file.type)) {
      setErro('Use PNG, JPG ou WebP.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      dispatch({
        type: 'SET_IMAGEM',
        dataUrl: reader.result as string,
        nome: file.name,
      });
      setErro(null);
    };
    reader.readAsDataURL(file);
  }

  async function handleGerar(e?: FormEvent) {
    e?.preventDefault();
    if (!estado.tipoCampanha || !estado.tema || !estado.formato) {
      setErro('Complete campanha, tema e formato.');
      return;
    }
    setErro(null);
    dispatch({ type: 'SET_GERANDO', valor: true });
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const preview = await gerarPreviewDataUrl(estado);
      const vars = await gerarVariacoes(preview, 3);
      const id = crypto.randomUUID();
      const arte = {
        id,
        criadoEm: new Date().toISOString(),
        favorito: false,
        previewDataUrl: preview,
        formato: estado.formato,
        tipoCampanha: estado.tipoCampanha,
        tema: estado.tema,
        titulo: tituloArte(estado),
        estado: { ...estado, gerando: false, arteGeradaId: id },
        variacoes: vars,
      };
      salvarArteGaleria(arte);
      dispatch({ type: 'SET_ARTE_GERADA', id });
      setPreviewGerado(preview);
      setVariacoes(vars);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao gerar arte.');
    } finally {
      dispatch({ type: 'SET_GERANDO', valor: false });
    }
  }

  function baixar(dataUrl: string, nome: string) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = nome;
    a.click();
  }

  const passo = estado.passo;

  return (
    <div className="mkt-creator">
      <CreatorStepper passoAtual={passo} onIrPara={(p) => p <= passo && irPara(p)} />

      <div className="mkt-creator-grid">
        <section className="mkt-creator-painel card">
          {passo === 1 ? (
            <>
              <h2 className="mkt-creator-titulo">Tipo da campanha</h2>
              <p className="mkt-creator-sub">Escolha o objetivo da arte. Tudo é opcional depois.</p>
              <div className="mkt-campanha-grid">
                {TIPOS_CAMPANHA.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`mkt-campanha-card ${estado.tipoCampanha === c.id ? 'ativo' : ''}`}
                    onClick={() => dispatch({ type: 'SET_CAMPANHA', valor: c.id })}
                  >
                    <strong>{c.titulo}</strong>
                    <span>{c.descricao}</span>
                    <ul>
                      {c.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {passo === 2 ? (
            <>
              <h2 className="mkt-creator-titulo">Tema visual</h2>
              <p className="mkt-creator-sub">Atmosfera, cores e estilo da composição.</p>
              <div className="mkt-tema-grid">
                {TEMAS_VISUAIS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`mkt-tema-card ${estado.tema === t.id ? 'ativo' : ''}`}
                    onClick={() => dispatch({ type: 'SET_TEMA', valor: t.id })}
                  >
                    <div
                      className="mkt-tema-card-preview"
                      style={{ background: t.gradient }}
                      aria-hidden
                    />
                    <div className={`mkt-tema-card-texto ${t.textoEscuro ? 'escuro' : ''}`}>
                      <strong>{t.titulo}</strong>
                      <span>{t.descricao}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {passo === 3 ? (
            <>
              <h2 className="mkt-creator-titulo">Produtos na arte</h2>
              <p className="mkt-creator-sub">Opcional — nome, tipo e quantidade na composição.</p>
              {estado.produtos.length === 0 ? (
                <p className="mkt-creator-vazio">Nenhum produto adicionado.</p>
              ) : (
                <ul className="mkt-produto-lista">
                  {estado.produtos.map((p, idx) => (
                    <li key={p.id} className="mkt-produto-item">
                      <label>
                        Nome
                        <input
                          value={p.nome}
                          onChange={(e) => {
                            const produtos = [...estado.produtos];
                            produtos[idx] = { ...p, nome: e.target.value };
                            dispatch({ type: 'SET_PRODUTOS', produtos });
                          }}
                          placeholder="Ex.: Skol 350ml"
                        />
                      </label>
                      <label>
                        Descrição
                        <input
                          value={p.descricao}
                          onChange={(e) => {
                            const produtos = [...estado.produtos];
                            produtos[idx] = { ...p, descricao: e.target.value };
                            dispatch({ type: 'SET_PRODUTOS', produtos });
                          }}
                        />
                      </label>
                      <label>
                        Tipo
                        <select
                          value={p.tipo}
                          onChange={(e) => {
                            const produtos = [...estado.produtos];
                            produtos[idx] = {
                              ...p,
                              tipo: e.target.value as typeof p.tipo,
                            };
                            dispatch({ type: 'SET_PRODUTOS', produtos });
                          }}
                        >
                          {TIPOS_PRODUTO.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Qtd. na arte
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={p.quantidade}
                          onChange={(e) => {
                            const produtos = [...estado.produtos];
                            produtos[idx] = {
                              ...p,
                              quantidade: Number(e.target.value) || 1,
                            };
                            dispatch({ type: 'SET_PRODUTOS', produtos });
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="btn btn-secundario"
                        onClick={() =>
                          dispatch({
                            type: 'SET_PRODUTOS',
                            produtos: estado.produtos.filter((x) => x.id !== p.id),
                          })
                        }
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() =>
                  dispatch({
                    type: 'SET_PRODUTOS',
                    produtos: [...estado.produtos, novoProdutoArte()],
                  })
                }
              >
                + Adicionar produto
              </button>
            </>
          ) : null}

          {passo === 4 ? (
            <>
              <h2 className="mkt-creator-titulo">Texto da arte</h2>
              <p className="mkt-creator-sub">Defina o que aparece — ou use modo clean.</p>
              <Toggle
                label="Modo clean (só produto + ambiente)"
                ativo={estado.campos.modoClean}
                onChange={(v) => dispatch({ type: 'PATCH_CAMPOS', patch: { modoClean: v } })}
              />
              {!estado.campos.modoClean ? (
                <>
                  <div className="mkt-chips">
                    {TITULOS_SUGERIDOS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={
                          estado.campos.tituloPrincipal === t ? 'mkt-chip ativo' : 'mkt-chip'
                        }
                        onClick={() =>
                          dispatch({ type: 'PATCH_CAMPOS', patch: { tituloPrincipal: t } })
                        }
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <label className="mkt-field">
                    Título principal
                    <input
                      value={estado.campos.tituloPrincipal}
                      onChange={(e) =>
                        dispatch({
                          type: 'PATCH_CAMPOS',
                          patch: { tituloPrincipal: e.target.value },
                        })
                      }
                    />
                  </label>
                  <label className="mkt-field">
                    Subtítulo (opcional)
                    <input
                      value={estado.campos.subtitulo}
                      onChange={(e) =>
                        dispatch({ type: 'PATCH_CAMPOS', patch: { subtitulo: e.target.value } })
                      }
                      placeholder="Deixe vazio para omitir"
                    />
                  </label>
                  <div className="mkt-check-grid">
                    {(
                      [
                        ['nomeProduto', 'Nome do produto'],
                        ['descricao', 'Descrição'],
                        ['preco', 'Preço'],
                        ['precoPromocional', 'Preço promocional'],
                        ['percentualDesconto', '% desconto'],
                        ['logo', 'Logo'],
                        ['whatsapp', 'WhatsApp'],
                        ['cta', 'CTA'],
                        ['redesSociais', 'Redes sociais'],
                        ['endereco', 'Endereço'],
                        ['selosPromocionais', 'Selos promocionais'],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="mkt-check">
                        <input
                          type="checkbox"
                          checked={estado.campos[key]}
                          onChange={(e) =>
                            dispatch({
                              type: 'PATCH_CAMPOS',
                              patch: { [key]: e.target.checked },
                            })
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  <Toggle
                    label="Botão CTA"
                    ativo={estado.campos.cta}
                    onChange={(v) => dispatch({ type: 'PATCH_CAMPOS', patch: { cta: v } })}
                  >
                    <input
                      value={estado.campos.textoCta}
                      onChange={(e) =>
                        dispatch({ type: 'PATCH_CAMPOS', patch: { textoCta: e.target.value } })
                      }
                    />
                  </Toggle>
                  <Toggle
                    label="Selo promocional"
                    ativo={estado.campos.selosPromocionais}
                    onChange={(v) =>
                      dispatch({ type: 'PATCH_CAMPOS', patch: { selosPromocionais: v } })
                    }
                  >
                    <input
                      value={estado.campos.textoSelo}
                      onChange={(e) =>
                        dispatch({ type: 'PATCH_CAMPOS', patch: { textoSelo: e.target.value } })
                      }
                    />
                  </Toggle>
                </>
              ) : null}
            </>
          ) : null}

          {passo === 5 ? (
            <>
              <p className="mkt-creator-etapa-label">IMAGEM</p>
              <h2 className="mkt-creator-titulo">Imagem do produto</h2>
              <p className="mkt-creator-sub">PNG transparente, JPG ou foto simples.</p>
              <label className="mkt-upload-zone">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleUpload}
                  hidden
                />
                {estado.imagemProduto ? (
                  <div className="mkt-upload-preview">
                    <img src={estado.imagemProduto} alt="" />
                    <span>{estado.imagemProdutoNome}</span>
                  </div>
                ) : (
                  <span>Arraste ou clique para enviar</span>
                )}
              </label>
              {estado.imagemProduto ? (
                <button
                  type="button"
                  className="btn btn-secundario"
                  onClick={() => dispatch({ type: 'SET_IMAGEM', dataUrl: null, nome: null })}
                >
                  Remover imagem
                </button>
              ) : null}
            </>
          ) : null}

          {passo === 6 ? (
            <>
              <h2 className="mkt-creator-titulo">Configurações</h2>
              <div className="mkt-modo-toggle">
                <button
                  type="button"
                  className={estado.config.modo === 'rapido' ? 'ativo' : ''}
                  onClick={() =>
                    dispatch({ type: 'PATCH_CONFIG', patch: { modo: 'rapido' } })
                  }
                >
                  Modo rápido
                </button>
                <button
                  type="button"
                  className={estado.config.modo === 'avancado' ? 'ativo' : ''}
                  onClick={() =>
                    dispatch({ type: 'PATCH_CONFIG', patch: { modo: 'avancado' } })
                  }
                >
                  Modo avançado
                </button>
              </div>
              <p className="mkt-creator-sub">
                {estado.config.modo === 'rapido'
                  ? 'A IA (em breve) decide fundo, ambiente e intensidade. Por ora aplicamos presets inteligentes.'
                  : 'Personalize preço, fundo e atmosfera.'}
              </p>
              <Toggle
                label="Mostrar preço"
                ativo={estado.config.mostrarPreco}
                onChange={(v) =>
                  dispatch({ type: 'PATCH_CONFIG', patch: { mostrarPreco: v } })
                }
              />
              {estado.config.mostrarPreco ? (
                <div className="mkt-form-grid">
                  <label>
                    De (R$)
                    <input
                      value={estado.config.precoDe}
                      onChange={(e) =>
                        dispatch({ type: 'PATCH_CONFIG', patch: { precoDe: e.target.value } })
                      }
                    />
                  </label>
                  <label>
                    Por (R$)
                    <input
                      value={estado.config.precoPor}
                      onChange={(e) =>
                        dispatch({ type: 'PATCH_CONFIG', patch: { precoPor: e.target.value } })
                      }
                    />
                  </label>
                  <label>
                    % desconto
                    <input
                      value={estado.config.descontoPercentual}
                      onChange={(e) =>
                        dispatch({
                          type: 'PATCH_CONFIG',
                          patch: { descontoPercentual: e.target.value },
                        })
                      }
                    />
                  </label>
                </div>
              ) : null}
              {estado.config.modo === 'avancado' ? (
                <div className="mkt-form-grid">
                  <label>
                    Estilo do fundo
                    <select
                      value={estado.config.estiloFundo}
                      onChange={(e) =>
                        dispatch({
                          type: 'PATCH_CONFIG',
                          patch: {
                            estiloFundo: e.target.value as typeof estado.config.estiloFundo,
                          },
                        })
                      }
                    >
                      <option value="gradiente">Gradiente</option>
                      <option value="estudio">Estúdio</option>
                      <option value="ambiente">Ambiente</option>
                      <option value="textura">Textura</option>
                    </select>
                  </label>
                  <label>
                    Intensidade promocional
                    <select
                      value={estado.config.intensidade}
                      onChange={(e) =>
                        dispatch({
                          type: 'PATCH_CONFIG',
                          patch: {
                            intensidade: e.target.value as typeof estado.config.intensidade,
                          },
                        })
                      }
                    >
                      <option value="suave">Suave</option>
                      <option value="media">Média</option>
                      <option value="forte">Forte</option>
                    </select>
                  </label>
                  <label>
                    Ambiente
                    <select
                      value={estado.config.ambiente}
                      onChange={(e) =>
                        dispatch({
                          type: 'PATCH_CONFIG',
                          patch: {
                            ambiente: e.target.value as typeof estado.config.ambiente,
                          },
                        })
                      }
                    >
                      <option value="estudio">Estúdio</option>
                      <option value="mercado">Mercado</option>
                      <option value="praia">Praia</option>
                      <option value="festa">Festa</option>
                      <option value="urbano">Urbano</option>
                    </select>
                  </label>
                  <label>
                    Realismo
                    <select
                      value={estado.config.realismo}
                      onChange={(e) =>
                        dispatch({
                          type: 'PATCH_CONFIG',
                          patch: {
                            realismo: e.target.value as typeof estado.config.realismo,
                          },
                        })
                      }
                    >
                      <option value="foto">Foto</option>
                      <option value="ilustrado">Ilustrado</option>
                      <option value="3d">3D</option>
                    </select>
                  </label>
                  <label>
                    Cor predominante
                    <input
                      type="color"
                      value={estado.config.corPredominante}
                      onChange={(e) =>
                        dispatch({
                          type: 'PATCH_CONFIG',
                          patch: { corPredominante: e.target.value },
                        })
                      }
                    />
                  </label>
                </div>
              ) : null}
            </>
          ) : null}

          {passo === 7 ? (
            <>
              <h2 className="mkt-creator-titulo">Formato da arte</h2>
              <p className="mkt-creator-sub">Escolha o tamanho e formato de saída.</p>
              <div className="mkt-formato-grid">
                {FORMATOS_ARTE.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`mkt-formato-btn ${estado.formato === f.id ? 'ativo' : ''}`}
                    onClick={() => dispatch({ type: 'SET_FORMATO', valor: f.id })}
                  >
                    <strong>{f.titulo}</strong>
                    <span>{f.descricao}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {passo === 8 ? (
            <>
              <h2 className="mkt-creator-titulo">Gerar arte</h2>
              {!previewGerado ? (
                <>
                  <p className="mkt-creator-sub">
                    Prévia local com suas escolhas. A geração por IA virá na próxima etapa.
                  </p>
                  {estado.gerando ? (
                    <p className="mkt-gerando" role="status">
                      Criando arte e variações…
                    </p>
                  ) : (
                    <button type="button" className="btn mkt-btn-gerar" onClick={() => void handleGerar()}>
                      Gerar arte
                    </button>
                  )}
                </>
              ) : (
                <div className="mkt-resultado">
                  <img src={previewGerado} alt="Arte gerada" className="mkt-resultado-img" />
                  <div className="mkt-resultado-acoes">
                    <button
                      type="button"
                      className="btn mkt-btn-gerar"
                      onClick={() => baixar(previewGerado, 'ligeirinho-arte.png')}
                    >
                      Baixar imagem
                    </button>
                    <button
                      type="button"
                      className="btn btn-secundario"
                      onClick={() => void handleGerar()}
                    >
                      Gerar novamente
                    </button>
                  </div>
                  <div className="mkt-ajustes-rapidos">
                    {['Mais claro', 'Mais escuro', 'Mais vibrante', 'Mais limpo'].map((label) => (
                      <button key={label} type="button" className="mkt-chip">
                        {label}
                      </button>
                    ))}
                  </div>
                  {variacoes.length > 0 ? (
                    <div className="mkt-variacoes">
                      <h3>Variações</h3>
                      <div className="mkt-variacoes-grid">
                        {variacoes.map((v, i) => (
                          <button
                            key={i}
                            type="button"
                            className="mkt-variacao-thumb"
                            onClick={() => setPreviewGerado(v)}
                          >
                            <img src={v} alt={`Variação ${i + 1}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <Link to="/marketing/galeria" className="btn btn-secundario">
                    Ir para galeria
                  </Link>
                </div>
              )}
            </>
          ) : null}

          {erro ? <p className="erro">{erro}</p> : null}

          {passo < 8 ? (
            <div className="mkt-creator-nav">
              <button
                type="button"
                className="btn btn-secundario"
                onClick={voltar}
                disabled={passo <= 1}
              >
                Voltar
              </button>
              <button type="button" className="btn mkt-btn-continuar" onClick={handleContinuar}>
                Continuar
              </button>
            </div>
          ) : (
            <div className="mkt-creator-nav">
              <button type="button" className="btn btn-secundario" onClick={voltar}>
                Voltar
              </button>
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() => {
                  dispatch({ type: 'RESET' });
                  setPreviewGerado(null);
                  setVariacoes([]);
                  navigate('/marketing/criar');
                }}
              >
                Nova arte
              </button>
            </div>
          )}
        </section>

        <aside className="mkt-creator-aside">
          <p className="mkt-creator-aside-label">Prévia ao vivo</p>
          <ArtePreview estado={estado} />
          <p className="mkt-creator-aside-dica">
            Etapa {passo} de 8 — tudo opcional exceto campanha, tema e formato.
          </p>
        </aside>
      </div>
    </div>
  );
}

export function CriarArtePage() {
  const app = appPorId('marketing');
  if (!app) return null;
  const item = itemAppPorRota(app, '/marketing/criar');

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Criar arte"
      subtitulo="Campanha, tema, produto e formato — do jeito das referências."
    >
      <MarketingCreatorProvider>
        <CreatorWizard />
      </MarketingCreatorProvider>
    </AppPageHeader>
  );
}
