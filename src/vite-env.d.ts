/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_ORIGIN?: string;
  readonly VITE_PAGINAS_BYPASS_EMAILS?: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_CATALOGO_LEGADO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
