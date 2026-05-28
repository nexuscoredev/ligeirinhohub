import { registerSW } from 'virtual:pwa-register';

type PwaUpdateState = { status: 'ready' } | { status: 'need-refresh' };

let updateFn: ((reloadPage?: boolean) => Promise<void>) | null = null;

function emitir(state: PwaUpdateState) {
  window.dispatchEvent(new CustomEvent<PwaUpdateState>('hub-pwa', { detail: state }));
}

export function initPwaUpdatePrompt() {
  if (!('serviceWorker' in navigator)) return;

  updateFn = registerSW({
    immediate: true,
    onNeedRefresh() {
      emitir({ status: 'need-refresh' });
    },
    onOfflineReady() {
      emitir({ status: 'ready' });
    },
  });
}

export async function aplicarAtualizacaoPwa() {
  if (!updateFn) return;
  await updateFn(true);
}

