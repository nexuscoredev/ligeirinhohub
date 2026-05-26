import { imagemProdutoArte } from '@/lib/marketing/creator/catalogoProduto';
import { TEMAS_VISUAIS } from '@/lib/marketing/creator/constants';
import { FORMATOS_ARTE } from '@/lib/marketing/creator/constants';
import type { MarketingCreatorState } from '@/lib/marketing/creator/types';

interface ArtePreviewProps {
  estado: MarketingCreatorState;
  className?: string;
  compacto?: boolean;
}

export function ArtePreview({ estado, className = '', compacto }: ArtePreviewProps) {
  const tema = TEMAS_VISUAIS.find((t) => t.id === estado.tema);
  const formato = FORMATOS_ARTE.find((f) => f.id === estado.formato);
  const ratio = formato?.ratio ?? '1 / 1';
  const escuro = !tema?.textoEscuro;
  const imgProduto = imagemProdutoArte(estado);

  return (
    <div
      className={`mkt-arte-preview ${compacto ? 'mkt-arte-preview--sm' : ''} ${className}`.trim()}
      style={{
        aspectRatio: ratio,
        background: tema?.gradient,
        color: escuro ? '#fff' : '#1a1a1a',
      }}
    >
      {!estado.campos.modoClean && estado.campos.selosPromocionais ? (
        <span className="mkt-arte-preview__selo">{estado.campos.textoSelo || 'OFERTA'}</span>
      ) : null}

      {estado.campos.logo ? (
        <span className="mkt-arte-preview__logo">LIGEIRINHO</span>
      ) : null}

      {!estado.campos.modoClean && estado.campos.tituloPrincipal ? (
        <h3 className="mkt-arte-preview__titulo">{estado.campos.tituloPrincipal}</h3>
      ) : null}

      <div className="mkt-arte-preview__produto">
        {imgProduto ? (
          <img src={imgProduto} alt="" />
        ) : (
          <span className="mkt-arte-preview__placeholder">Produto</span>
        )}
      </div>

      {!estado.campos.modoClean && estado.campos.nomeProduto && estado.produtos[0]?.nome ? (
        <p className="mkt-arte-preview__nome">{estado.produtos[0].nome}</p>
      ) : null}

      {!estado.campos.modoClean &&
      estado.config.mostrarPreco &&
      estado.campos.precoPromocional ? (
        <div className="mkt-arte-preview__precos">
          <strong>R$ {estado.config.precoPor}</strong>
          {estado.campos.preco ? (
            <span>De R$ {estado.config.precoDe}</span>
          ) : null}
          {estado.campos.percentualDesconto ? (
            <em>{estado.config.descontoPercentual}% OFF</em>
          ) : null}
        </div>
      ) : null}

      {!estado.campos.modoClean && estado.campos.cta ? (
        <span className="mkt-arte-preview__cta">{estado.campos.textoCta || 'Peça agora'}</span>
      ) : null}
    </div>
  );
}
