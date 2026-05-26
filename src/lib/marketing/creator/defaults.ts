import type { CamposArte, ConfigArte, MarketingCreatorState } from '@/lib/marketing/creator/types';

export const CAMPOS_PADRAO: CamposArte = {
  modoClean: false,
  nomeProduto: true,
  descricao: false,
  preco: true,
  precoPromocional: true,
  percentualDesconto: true,
  logo: true,
  whatsapp: true,
  cta: true,
  redesSociais: false,
  endereco: false,
  selosPromocionais: true,
  tituloPrincipal: 'PROMOÇÃO DE ESTOQUE',
  subtitulo: '',
  textoCta: 'Peça agora',
  textoSelo: 'Condições imperdíveis',
  rodapeLegal: '',
};

export const CONFIG_PADRAO: ConfigArte = {
  modo: 'avancado',
  mostrarPreco: true,
  precoDe: '99,90',
  precoPor: '79,90',
  descontoPercentual: '20',
  estiloFundo: 'gradiente',
  intensidade: 'media',
  ambiente: 'estudio',
  realismo: 'foto',
  corPredominante: '#ff6b00',
};

export function estadoInicialCriador(): MarketingCreatorState {
  return {
    passo: 1,
    tipoCampanha: null,
    tema: null,
    produtos: [],
    campos: { ...CAMPOS_PADRAO },
    imagemProduto: null,
    imagemProdutoNome: null,
    config: { ...CONFIG_PADRAO },
    formato: null,
    gerando: false,
    arteGeradaId: null,
  };
}

export function novoProdutoArte(): import('@/lib/marketing/creator/types').ProdutoArte {
  return {
    id: crypto.randomUUID(),
    nome: '',
    descricao: '',
    tipo: 'cerveja',
    quantidade: 1,
  };
}
