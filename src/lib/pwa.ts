import { registerSW } from 'virtual:pwa-register';

type PwaUpdateState = { status: 'ready' } | { status: 'need-refresh' };

let updateFn: ((reloadPage?: boolean) => Promise<void>) | null = null;
let started = false;

function emitir(state: PwaUpdateState) {
  window.dispatchEvent(new CustomEvent<PwaUpdateState>('hub-pwa', { detail: state }));
}

export function initPwaUpdatePrompt() {
  if (!('serviceWorker' in navigator)) return;
  if (started) return;
  started = true;

  updateFn = registerSW({
    immediate: true,
    onNeedRefresh() {
      emitir({ status: 'need-refresh' });
    },
    onOfflineReady() {
      emitir({ status: 'ready' });
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      // Checa update ao voltar pra aba (depois de um deploy, isso pega rápido).
      const onVis = () => {
        if (document.visibilityState === 'visible') {
          void registration.update();
        }
      };
      document.addEventListener('visibilitychange', onVis);

      // E faz um ping periódico leve.
      const id = window.setInterval(() => {
        void registration.update();
      }, 60_000);

      window.addEventListener(
        'beforeunload',
        () => {
          document.removeEventListener('visibilitychange', onVis);
          window.clearInterval(id);
        },
        { once: true },
      );
    },
  });
}

export async function aplicarAtualizacaoPwa() {
  if (!updateFn) return;
  await updateFn(true);
}

