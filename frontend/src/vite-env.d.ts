// frontend/src/vite-env.d.ts

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // adicione outras variáveis de ambiente que você usar aqui
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
