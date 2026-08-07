/**
 * Backend adreslerini bilen tek modül. Bileşenler bu dosyayı da import etmez;
 * yalnızca `demoApi.ts` ve `agentApi.ts` okur.
 */

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} tanımlı değil. .env.example dosyasına bak.`)
  }
  return value
}

/** Hedef servis (`demo-crud-api`). */
export const DEMO_BASE = required(import.meta.env.VITE_DEMO_BASE, 'VITE_DEMO_BASE')

/** Analiz ajanı (`api-debug-agent`). */
export const AGENT_BASE = required(import.meta.env.VITE_AGENT_BASE, 'VITE_AGENT_BASE')
