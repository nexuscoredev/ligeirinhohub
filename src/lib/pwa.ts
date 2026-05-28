import { registerSW } from 'virtual:pwa-register';

type PwaUpdateState = { status: 'ready' } | { status: 'need-refresh' };

let updateFn: ((reloadPage?: boolean) => Promise<void>) | null = null;
let started = false;
let lastRegistration: ServiceWorkerRegistration | null = null;

function emitir(state: PwaUpdateState) {
  window.dispatchEvent(new CustomEvent<PwaUpdateState>('hub-pwa', { detail: state }));
}

export function initPwaUpdatePrompt() {
  if (!('serviceWorker' in navigator)) return;
  if (started) return;
  started = true;

  // Quando o SW novo assume o controle, recarrega garantindo assets novos.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });

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
      lastRegistration = registration;

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
  // Caminho preferencial (vite-plugin-pwa dispara SKIP_WAITING + reload)
  if (updateFn) {
    await updateFn(true);
    // Fallback: se o reload não acontecer (varia por browser), força.
    window.setTimeout(() => window.location.reload(), 600);
    return;
  }

  // Fallback total: tenta promover SW waiting manualmente.
  try {
    const reg = lastRegistration ?? (await navigator.serviceWorker.getRegistration());
    reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
  } finally {
    window.location.reload();
  }
}

