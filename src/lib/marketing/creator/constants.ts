import type {
  FormatoArte,
  TemaVisual,
  TipoCampanha,
  TipoProdutoArte,
} from '@/lib/marketing/creator/types';

export const PASSOS_CRIADOR = [
  { id: 1, titulo: 'Campanha', subtitulo: 'Tipo da campanha' },
  { id: 2, titulo: 'Tema', subtitulo: 'Visual da arte' },
  { id: 3, titulo: 'Produtos', subtitulo: 'Opcional' },
  { id: 4, titulo: 'Conteúdo', subtitulo: 'O que aparece' },
  { id: 5, titulo: 'Imagem', subtitulo: 'Upload' },
  { id: 6, titulo: 'Ajustes', subtitulo: 'Preço e estilo' },
  { id: 7, titulo: 'Formato', subtitulo: 'Saída' },
  { id: 8, titulo: 'Gerar', subtitulo: 'Criar arte' },
] as const;

export const TIPOS_CAMPANHA: {
  id: TipoCampanha;
  titulo: string;
  descricao: string;
  bullets: string[];
}[] = [
  {
    id: 'promocao',
    titulo: 'Promoção',
    descricao: 'Selo, preço de/por e CTA de oferta.',
    bullets: ['Selo promocional', 'Preço destacado', 'Botão de ação'],
  },
  {
    id: 'combo',
    titulo: 'Combo',
    descricao: 'Pacote com mais de um produto na arte.',
    bullets: ['Cluster de produtos', 'Valor do combo', 'Economia visível'],
  },
  {
    id: 'oferta_dia',
    titulo: 'Oferta do dia',
    descricao: 'Urgência para a promoção de hoje.',
    bullets: ['Validade curta', 'Destaque do dia', 'Alta conversão'],
  },
  {
    id: 'final_semana',
    titulo: 'Final de semana',
    descricao: 'Clima de festa e consumo em casa.',
    bullets: ['Tom descontraído', 'Cores quentes', 'Churrasco e gelada'],
  },
  {
    id: 'churrasco',
    titulo: 'Churrasco',
    descricao: 'Cerveja, carvão e ambiente ao ar livre.',
    bullets: ['Ambiente externo', 'Produtos gelados', 'Selo “churrasco”'],
  },
  {
    id: 'delivery',
    titulo: 'Delivery',
    descricao: 'Peça agora com frete ou retirada.',
    bullets: ['CTA “Peça agora”', 'WhatsApp', 'Ícone delivery'],
  },
  {
    id: 'premium',
    titulo: 'Produto premium',
    descricao: 'Luxo, dourado e vitrine sofisticada.',
    bullets: ['Fundo escuro', 'Detalhes dourados', 'Produto em destaque'],
  },
  {
    id: 'sazonal',
    titulo: 'Sazonal',
    descricao: 'Datas e estações do ano.',
    bullets: ['Verão / festas', 'Cores sazonais', 'Elementos temáticos'],
  },
];

export const TEMAS_VISUAIS: {
  id: TemaVisual;
  titulo: string;
  descricao: string;
  gradient: string;
  textoEscuro?: boolean;
}[] = [
  {
    id: 'promocional',
    titulo: 'Promocional',
    descricao: 'Laranja, impacto e oferta clara.',
    gradient: 'linear-gradient(145deg, #ff6b00 0%, #ff3d00 55%, #1a0a00 100%)',
  },
  {
    id: 'premium',
    titulo: 'Premium',
    descricao: 'Azul profundo e vitrine elegante.',
    gradient: 'linear-gradient(160deg, #1e3a5f 0%, #0d1b2a 50%, #000 100%)',
  },
  {
    id: 'neon',
    titulo: 'Neon',
    descricao: 'Roxo, ciano e energia noturna.',
    gradient: 'linear-gradient(135deg, #7b2ff7 0%, #00d4ff 50%, #0a0014 100%)',
  },
  {
    id: 'mercado',
    titulo: 'Mercado',
    descricao: 'Verde fresco e prateleira.',
    gradient: 'linear-gradient(160deg, #2d6a4f 0%, #1b4332 60%, #081c15 100%)',
  },
  {
    id: 'verao',
    titulo: 'Verão',
    descricao: 'Areia, sol e mar.',
    gradient: 'linear-gradient(180deg, #ffd60a 0%, #ff9f0a 40%, #48cae4 100%)',
    textoEscuro: true,
  },
  {
    id: 'luxo',
    titulo: 'Luxo',
    descricao: 'Preto, ouro e mármore.',
    gradient: 'linear-gradient(145deg, #d4af37 0%, #1a1a1a 45%, #000 100%)',
  },
  {
    id: 'black_friday',
    titulo: 'Black Friday',
    descricao: 'Preto, vermelho e urgência.',
    gradient: 'linear-gradient(160deg, #e63946 0%, #111 40%, #000 100%)',
  },
  {
    id: 'clean',
    titulo: 'Clean',
    descricao: 'Fundo claro, produto e ambiente.',
    gradient: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
    textoEscuro: true,
  },
];

export const TIPOS_PRODUTO: { id: TipoProdutoArte; label: string }[] = [
  { id: 'cerveja', label: 'Cerveja' },
  { id: 'whisky', label: 'Whisky' },
  { id: 'energetico', label: 'Energético' },
  { id: 'refrigerante', label: 'Refrigerante' },
  { id: 'agua', label: 'Água' },
  { id: 'vinho', label: 'Vinho' },
  { id: 'destilado', label: 'Destilado' },
  { id: 'outro', label: 'Outro' },
];

export const TITULOS_SUGERIDOS = [
  'PROMOÇÃO DE ESTOQUE',
  'OFERTA ESPECIAL',
  'PROMOÇÃO IMPERDÍVEL',
  'SUPER OFERTA',
  'OFERTA DO DIA',
  'FRETE GRÁTIS',
];

export const FORMATOS_ARTE: {
  id: FormatoArte;
  titulo: string;
  descricao: string;
  ratio: string;
}[] = [
  { id: 'instagram_feed', titulo: 'Instagram Feed', descricao: '1:1 (1080×1080)', ratio: '1 / 1' },
  { id: 'instagram_story', titulo: 'Story', descricao: '9:16 (1080×1920)', ratio: '9 / 16' },
  { id: 'whatsapp', titulo: 'WhatsApp', descricao: 'Quadrado otimizado', ratio: '1 / 1' },
  { id: 'banner', titulo: 'Banner', descricao: '16:9 paisagem', ratio: '16 / 9' },
  { id: 'cartaz', titulo: 'Cartaz', descricao: '3:4 vertical loja', ratio: '3 / 4' },
];

export const FILTROS_GALERIA = [
  { id: 'todas', label: 'Todas' },
  { id: 'favoritos', label: 'Favoritos' },
  { id: 'promocao', label: 'Promo' },
  { id: 'combo', label: 'Combo' },
  { id: 'premium', label: 'Premium' },
  { id: 'sazonal', label: 'Sazonal' },
] as const;

export function labelCampanha(id: TipoCampanha): string {
  return TIPOS_CAMPANHA.find((c) => c.id === id)?.titulo ?? id;
}

export function labelTema(id: TemaVisual): string {
  return TEMAS_VISUAIS.find((t) => t.id === id)?.titulo ?? id;
}

export function labelFormato(id: FormatoArte): string {
  return FORMATOS_ARTE.find((f) => f.id === id)?.titulo ?? id;
}
