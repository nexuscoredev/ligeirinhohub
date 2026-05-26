export type TipoCampanha =
  | 'promocao'
  | 'combo'
  | 'oferta_dia'
  | 'final_semana'
  | 'churrasco'
  | 'delivery'
  | 'premium'
  | 'sazonal';

export type TemaVisual =
  | 'promocional'
  | 'premium'
  | 'neon'
  | 'mercado'
  | 'verao'
  | 'luxo'
  | 'black_friday'
  | 'clean';

export type TipoProdutoArte =
  | 'cerveja'
  | 'whisky'
  | 'energetico'
  | 'refrigerante'
  | 'agua'
  | 'vinho'
  | 'destilado'
  | 'outro';

export type FormatoArte =
  | 'instagram_feed'
  | 'instagram_story'
  | 'whatsapp'
  | 'banner'
  | 'cartaz';

export type ModoConfiguracao = 'rapido' | 'avancado';

export type EstiloFundo = 'gradiente' | 'estudio' | 'ambiente' | 'textura';
export type IntensidadePromo = 'suave' | 'media' | 'forte';
export type AmbienteArte = 'estudio' | 'mercado' | 'praia' | 'festa' | 'urbano';
export type RealismoArte = 'foto' | 'ilustrado' | '3d';

export interface ProdutoArte {
  id: string;
  nome: string;
  descricao: string;
  tipo: TipoProdutoArte;
  quantidade: number;
}

export interface CamposArte {
  modoClean: boolean;
  nomeProduto: boolean;
  descricao: boolean;
  preco: boolean;
  precoPromocional: boolean;
  percentualDesconto: boolean;
  logo: boolean;
  whatsapp: boolean;
  cta: boolean;
  redesSociais: boolean;
  endereco: boolean;
  selosPromocionais: boolean;
  tituloPrincipal: string;
  subtitulo: string;
  textoCta: string;
  textoSelo: string;
  rodapeLegal: string;
}

export interface ConfigArte {
  modo: ModoConfiguracao;
  mostrarPreco: boolean;
  precoDe: string;
  precoPor: string;
  descontoPercentual: string;
  estiloFundo: EstiloFundo;
  intensidade: IntensidadePromo;
  ambiente: AmbienteArte;
  realismo: RealismoArte;
  corPredominante: string;
}

export interface MarketingCreatorState {
  passo: number;
  tipoCampanha: TipoCampanha | null;
  tema: TemaVisual | null;
  produtos: ProdutoArte[];
  campos: CamposArte;
  imagemProduto: string | null;
  imagemProdutoNome: string | null;
  config: ConfigArte;
  formato: FormatoArte | null;
  gerando: boolean;
  arteGeradaId: string | null;
}

export interface ArteSalva {
  id: string;
  criadoEm: string;
  favorito: boolean;
  previewDataUrl: string;
  formato: FormatoArte;
  tipoCampanha: TipoCampanha;
  tema: TemaVisual;
  titulo: string;
  estado: MarketingCreatorState;
  variacoes: string[];
}

export type CreatorAction =
  | { type: 'SET_PASSO'; passo: number }
  | { type: 'SET_CAMPANHA'; valor: TipoCampanha }
  | { type: 'SET_TEMA'; valor: TemaVisual }
  | { type: 'SET_PRODUTOS'; produtos: ProdutoArte[] }
  | { type: 'PATCH_CAMPOS'; patch: Partial<CamposArte> }
  | { type: 'SET_IMAGEM'; dataUrl: string | null; nome?: string | null }
  | { type: 'PATCH_CONFIG'; patch: Partial<ConfigArte> }
  | { type: 'SET_FORMATO'; valor: FormatoArte }
  | { type: 'SET_GERANDO'; valor: boolean }
  | { type: 'SET_ARTE_GERADA'; id: string | null }
  | { type: 'RESET' }
  | { type: 'APLICAR_MODO_RAPIDO' };
