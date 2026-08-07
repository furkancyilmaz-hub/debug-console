/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEMO_BASE: string
  readonly VITE_AGENT_BASE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
