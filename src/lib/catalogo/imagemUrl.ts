export function imagemCatalogoUrl(url: string | null): string | null {
  if (!url) return null;
  if (/\.(webp|jpg|jpeg|png|gif)(\?|$)/i.test(url)) return url;
  return `${url}.webp`;
}
