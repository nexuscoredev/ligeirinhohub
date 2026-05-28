import type { ChatMessage } from '@/lib/chat/api';

export function formatarHoraChat(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function rotuloDiaChat(iso: string): string {
  try {
    const d = new Date(iso);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dia = new Date(d);
    dia.setHours(0, 0, 0, 0);
    const diff = (hoje.getTime() - dia.getTime()) / 86400000;
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Ontem';
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  } catch {
    return '';
  }
}

export function chaveDiaChat(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  } catch {
    return iso;
  }
}

export type BlocoMensagemChat =
  | { tipo: 'dia'; chave: string; rotulo: string }
  | { tipo: 'msg'; mensagem: ChatMessage };

export function blocosMensagensComDia(mensagens: ChatMessage[]): BlocoMensagemChat[] {
  const blocos: BlocoMensagemChat[] = [];
  let diaAtual = '';
  for (const m of mensagens) {
    const chave = chaveDiaChat(m.created_at);
    if (chave !== diaAtual) {
      diaAtual = chave;
      blocos.push({ tipo: 'dia', chave, rotulo: rotuloDiaChat(m.created_at) });
    }
    blocos.push({ tipo: 'msg', mensagem: m });
  }
  return blocos;
}

export function previewTexto(texto: string, max = 48): string {
  const t = texto.trim().replace(/\s+/g, ' ');
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}
