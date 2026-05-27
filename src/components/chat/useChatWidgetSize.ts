import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

export const CHAT_WIDGET_SIZE_KEY = 'ligeirinho-hub-chat-widget-size';

export const CHAT_WIDGET_PADRAO = { w: 460, h: 640 };
const MIN = { w: 360, h: 520 };
const VIEWPORT_PAD = 32;
/** Espaço para o FAB no canto inferior */
const FAB_CLEARANCE = 72;

export type ResizeModo = 'n' | 'w' | 'nw';

function limitesViewport() {
  const maxW = Math.max(MIN.w, window.innerWidth - VIEWPORT_PAD * 2);
  const maxH = Math.max(MIN.h, window.innerHeight - VIEWPORT_PAD * 2 - FAB_CLEARANCE);
  return { maxW, maxH };
}

export function limitarTamanhoChat(w: number, h: number) {
  const { maxW, maxH } = limitesViewport();
  return {
    w: Math.round(Math.min(Math.max(w, MIN.w), maxW)),
    h: Math.round(Math.min(Math.max(h, MIN.h), maxH)),
  };
}

export function lerTamanhoChatSalvo(): { w: number; h: number } {
  try {
    const raw = localStorage.getItem(CHAT_WIDGET_SIZE_KEY);
    if (!raw) return { ...CHAT_WIDGET_PADRAO };
    const parsed = JSON.parse(raw) as { w?: unknown; h?: unknown };
    if (typeof parsed.w === 'number' && typeof parsed.h === 'number') {
      return limitarTamanhoChat(parsed.w, parsed.h);
    }
  } catch {
    /* localStorage indisponível */
  }
  return { ...CHAT_WIDGET_PADRAO };
}

function salvarTamanhoChat(tamanho: { w: number; h: number }) {
  try {
    localStorage.setItem(CHAT_WIDGET_SIZE_KEY, JSON.stringify(tamanho));
  } catch {
    /* ignore */
  }
}

/** Redimensionamento por arraste (topo / esquerda / canto superior esquerdo). */
export function useChatWidgetSize() {
  const [tamanho, setTamanho] = useState(lerTamanhoChatSalvo);
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 620px)').matches : false,
  );
  const arrasteRef = useRef<{
    modo: ResizeModo;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);
  const tamanhoRef = useRef(tamanho);

  useEffect(() => {
    tamanhoRef.current = tamanho;
  }, [tamanho]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 620px)');
    const atualizar = () => setMobile(mq.matches);
    atualizar();
    mq.addEventListener('change', atualizar);
    return () => mq.removeEventListener('change', atualizar);
  }, []);

  useEffect(() => {
    function aoRedimensionarJanela() {
      setTamanho((atual) => limitarTamanhoChat(atual.w, atual.h));
    }
    window.addEventListener('resize', aoRedimensionarJanela);
    return () => window.removeEventListener('resize', aoRedimensionarJanela);
  }, []);

  const iniciarArraste = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, modo: ResizeModo) => {
      if (mobile) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      arrasteRef.current = {
        modo,
        startX: e.clientX,
        startY: e.clientY,
        startW: tamanhoRef.current.w,
        startH: tamanhoRef.current.h,
      };
    },
    [mobile],
  );

  const moverArraste = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    const arraste = arrasteRef.current;
    if (!arraste) return;

    let w = arraste.startW;
    let h = arraste.startH;

    if (arraste.modo === 'w' || arraste.modo === 'nw') {
      w = arraste.startW + (arraste.startX - e.clientX);
    }
    if (arraste.modo === 'n' || arraste.modo === 'nw') {
      h = arraste.startH + (arraste.startY - e.clientY);
    }

    setTamanho(limitarTamanhoChat(w, h));
  }, []);

  const finalizarArraste = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!arrasteRef.current) return;
    arrasteRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    salvarTamanhoChat(tamanhoRef.current);
  }, []);

  const resetarTamanho = useCallback(() => {
    const padrao = limitarTamanhoChat(CHAT_WIDGET_PADRAO.w, CHAT_WIDGET_PADRAO.h);
    setTamanho(padrao);
    salvarTamanhoChat(padrao);
  }, []);

  return {
    tamanho,
    mobile,
    iniciarArraste,
    moverArraste,
    finalizarArraste,
    resetarTamanho,
  };
}
