import { TEMAS_VISUAIS } from '@/lib/marketing/creator/constants';
import type { MarketingCreatorState } from '@/lib/marketing/creator/types';

const DIMENSOES: Record<string, { w: number; h: number }> = {
  instagram_feed: { w: 1080, h: 1080 },
  instagram_story: { w: 1080, h: 1920 },
  whatsapp: { w: 1080, h: 1080 },
  banner: { w: 1920, h: 1080 },
  cartaz: { w: 1080, h: 1440 },
};

function temaGradient(tema: MarketingCreatorState['tema']): string {
  const t = TEMAS_VISUAIS.find((x) => x.id === tema);
  return t?.gradient ?? 'linear-gradient(180deg, #1a1a1a, #000)';
}

function textoEscuro(tema: MarketingCreatorState['tema']): boolean {
  return TEMAS_VISUAIS.find((x) => x.id === tema)?.textoEscuro ?? false;
}

export async function gerarPreviewDataUrl(
  estado: MarketingCreatorState,
): Promise<string> {
  const formato = estado.formato ?? 'instagram_feed';
  const { w, h } = DIMENSOES[formato] ?? DIMENSOES.instagram_feed;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');

  const escuro = !textoEscuro(estado.tema);
  const corTexto = escuro ? '#ffffff' : '#1a1a1a';
  const corAccent = estado.config.corPredominante || '#ff6b00';

  const grad = ctx.createLinearGradient(0, 0, w, h);
  if (estado.tema === 'clean') {
    grad.addColorStop(0, '#f8f9fa');
    grad.addColorStop(1, '#dee2e6');
  } else if (estado.tema === 'verao') {
    grad.addColorStop(0, '#ffd60a');
    grad.addColorStop(0.5, '#ff9f0a');
    grad.addColorStop(1, '#48cae4');
  } else if (estado.tema === 'neon') {
    grad.addColorStop(0, '#7b2ff7');
    grad.addColorStop(0.5, '#00d4ff');
    grad.addColorStop(1, '#0a0014');
  } else if (estado.tema === 'luxo' || estado.tema === 'premium') {
    grad.addColorStop(0, '#1a1a1a');
    grad.addColorStop(0.4, '#2d2d2d');
    grad.addColorStop(1, '#000');
  } else {
    grad.addColorStop(0, corAccent);
    grad.addColorStop(0.55, '#1a0a00');
    grad.addColorStop(1, '#000');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  if (!estado.campos.modoClean && estado.campos.selosPromocionais) {
    ctx.fillStyle = estado.tema === 'luxo' ? '#d4af37' : corAccent;
    ctx.beginPath();
    ctx.roundRect(w * 0.06, h * 0.06, w * 0.28, h * 0.05, 8);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = `bold ${Math.round(h * 0.022)}px system-ui`;
    ctx.fillText(
      (estado.campos.textoSelo || 'OFERTA').slice(0, 22).toUpperCase(),
      w * 0.08,
      h * 0.095,
    );
  }

  const produtoY = h * 0.38;
  if (estado.imagemProduto) {
    try {
      const img = await carregarImagem(estado.imagemProduto);
      const maxW = w * 0.55;
      const maxH = h * 0.42;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      const iw = img.width * scale;
      const ih = img.height * scale;
      ctx.drawImage(img, (w - iw) / 2, produtoY - ih / 2, iw, ih);
    } catch {
      desenharPlaceholderProduto(ctx, w, produtoY, corAccent);
    }
  } else {
    desenharPlaceholderProduto(ctx, w, produtoY, corAccent);
  }

  if (!estado.campos.modoClean) {
    if (estado.campos.tituloPrincipal) {
      ctx.fillStyle = corTexto;
      ctx.font = `800 ${Math.round(h * 0.055)}px system-ui`;
      ctx.textAlign = 'center';
      const titulo = estado.campos.tituloPrincipal.slice(0, 40);
      ctx.fillText(titulo, w / 2, h * 0.12, w * 0.9);
    }

    const nome =
      estado.produtos[0]?.nome ||
      (estado.campos.nomeProduto ? 'Seu produto' : '');
    if (nome && estado.campos.nomeProduto) {
      ctx.font = `600 ${Math.round(h * 0.032)}px system-ui`;
      ctx.fillText(nome.slice(0, 50), w / 2, h * 0.18, w * 0.85);
    }

    if (estado.config.mostrarPreco && estado.campos.precoPromocional) {
      ctx.fillStyle = corAccent;
      ctx.font = `900 ${Math.round(h * 0.08)}px system-ui`;
      ctx.fillText(`R$ ${estado.config.precoPor}`, w / 2, h * 0.78);
      if (estado.campos.preco) {
        ctx.fillStyle = escuro ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)';
        ctx.font = `500 ${Math.round(h * 0.035)}px system-ui`;
        ctx.fillText(`De R$ ${estado.config.precoDe}`, w / 2, h * 0.84);
      }
      if (estado.campos.percentualDesconto) {
        ctx.fillStyle = '#30d158';
        ctx.font = `bold ${Math.round(h * 0.028)}px system-ui`;
        ctx.fillText(`${estado.config.descontoPercentual}% OFF`, w / 2, h * 0.89);
      }
    }

    if (estado.campos.cta) {
      const bw = w * 0.55;
      const bh = h * 0.055;
      const bx = (w - bw) / 2;
      const by = h * 0.92 - bh;
      ctx.fillStyle = estado.tipoCampanha === 'delivery' ? '#25d366' : corAccent;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, bh / 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(h * 0.028)}px system-ui`;
      ctx.fillText(
        (estado.campos.textoCta || 'Peça agora').slice(0, 28),
        w / 2,
        by + bh * 0.65,
      );
    }

    if (estado.campos.logo) {
      ctx.fillStyle = escuro ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)';
      ctx.font = `bold ${Math.round(h * 0.025)}px system-ui`;
      ctx.textAlign = 'right';
      ctx.fillText('LIGEIRINHO', w * 0.94, h * 0.06);
      ctx.textAlign = 'center';
    }
  }

  ctx.textAlign = 'left';
  return canvas.toDataURL('image/png', 0.92);
}

function desenharPlaceholderProduto(
  ctx: CanvasRenderingContext2D,
  w: number,
  y: number,
  cor: string,
) {
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.roundRect(w * 0.25, y - w * 0.12, w * 0.5, w * 0.24, 16);
  ctx.fill();
  ctx.fillStyle = cor;
  ctx.font = `bold ${Math.round(w * 0.04)}px system-ui`;
  ctx.textAlign = 'center';
  ctx.fillText('PRODUTO', w / 2, y + w * 0.01);
  ctx.textAlign = 'left';
}

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Variações simuladas (filtros rápidos) até integração com IA */
export async function gerarVariacoes(
  baseDataUrl: string,
  count = 3,
): Promise<string[]> {
  const out: string[] = [];
  const filtros = [
    { b: 1.08, s: 1, c: 1 },
    { b: 0.92, s: 1.15, c: 1 },
    { b: 1, s: 0.85, c: 1.1 },
  ];
  for (let i = 0; i < count; i++) {
    out.push(await aplicarFiltroCanvas(baseDataUrl, filtros[i % filtros.length]));
  }
  return out;
}

async function aplicarFiltroCanvas(
  src: string,
  f: { b: number; s: number; c: number },
): Promise<string> {
  const img = await carregarImagem(src);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;
  ctx.filter = `brightness(${f.b}) saturate(${f.s}) contrast(${f.c})`;
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/png', 0.9);
}

export { temaGradient, textoEscuro };
