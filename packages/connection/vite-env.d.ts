/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WS_URI: string;
  readonly VITE_API_URL?:  string;
  readonly VITE_API_KEY?: string;
  // add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
