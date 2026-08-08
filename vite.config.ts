import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Backend adresleri burada ve `src/api/config.ts`'te bilinir; başka hiçbir yerde.
 * Tarayıcı `/demo` ve `/agent` öneklerine istek atar, proxy öneki soyup hedefe
 * yollar. Proxy yalnızca CORS için değil: demo-api'de CORS yapılandırması yok ve
 * `X-Correlation-Id` yanıt başlığı ancak same-origin'de okunabiliyor.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const target = (value: string | undefined, fallback: string): string =>
    value && value.length > 0 ? value : fallback

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Port sabit: agent'ın CORS izin listesinde yalnızca 5173 var. Port
      // doluyken Vite sessizce 5174'e kaysa proxy tarayıcının `Origin`
      // başlığını olduğu gibi iletir ve agent 403 "Invalid CORS request"
      // döner — kimlik hatası gibi görünen, aslında port hatası olan bir
      // arıza. Sessiz kayma yerine açık hata.
      strictPort: true,
      proxy: {
        '/demo': {
          target: target(env.DEMO_TARGET, 'http://localhost:8080'),
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/demo/, ''),
        },
        '/agent': {
          target: target(env.AGENT_TARGET, 'http://localhost:8081'),
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/agent/, ''),
        },
      },
    },
  }
})
