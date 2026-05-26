import { CONFIG_PADRAO, estadoInicialCriador } from '@/lib/marketing/creator/defaults';
import type { CreatorAction, MarketingCreatorState } from '@/lib/marketing/creator/types';

export function creatorReducer(
  state: MarketingCreatorState,
  action: CreatorAction,
): MarketingCreatorState {
  switch (action.type) {
    case 'SET_PASSO':
      return { ...state, passo: action.passo };
    case 'SET_CAMPANHA':
      return { ...state, tipoCampanha: action.valor };
    case 'SET_TEMA':
      return { ...state, tema: action.valor };
    case 'SET_PRODUTOS':
      return { ...state, produtos: action.produtos };
    case 'PATCH_CAMPOS':
      return { ...state, campos: { ...state.campos, ...action.patch } };
    case 'SET_IMAGEM':
      return {
        ...state,
        imagemProduto: action.dataUrl,
        imagemProdutoNome: action.nome ?? null,
      };
    case 'PATCH_CONFIG':
      return { ...state, config: { ...state.config, ...action.patch } };
    case 'SET_FORMATO':
      return { ...state, formato: action.valor };
    case 'SET_GERANDO':
      return { ...state, gerando: action.valor };
    case 'SET_ARTE_GERADA':
      return { ...state, arteGeradaId: action.id };
    case 'APLICAR_MODO_RAPIDO':
      return {
        ...state,
        config: {
          ...CONFIG_PADRAO,
          modo: 'rapido',
          mostrarPreco: true,
          estiloFundo: 'gradiente',
          intensidade: 'media',
          ambiente: state.tema === 'verao' ? 'praia' : 'estudio',
          realismo: 'foto',
          corPredominante:
            state.tema === 'luxo' || state.tema === 'premium'
              ? '#d4af37'
              : '#ff6b00',
        },
        campos: {
          ...state.campos,
          modoClean: state.tema === 'clean',
          nomeProduto: !state.campos.modoClean,
          preco: state.config.mostrarPreco && !state.campos.modoClean,
          cta: state.tipoCampanha === 'delivery',
        },
      };
    case 'RESET':
      return estadoInicialCriador();
    default:
      return state;
  }
}
