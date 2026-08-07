# debug-console

Üç projeli kurulumun tek arayüzü. İki backend'e birden konuşur:

| Hedef | Port | Proxy öneki |
|---|---|---|
| `demo-crud-api` | 8080 | `/demo` |
| `api-debug-agent` | 8081 | `/agent` |

İki ekran:

- **CRUD** — hedef servisin arayüzü. Kullanıcı gezdikçe trafik oluşur.
- **Analiz** — zaman aralığı seçip agent'ı çalıştırır, aşamaları SSE ile izler,
  raporu gösterir.

## Çalıştırma

```bash
npm install
npm run dev      # :5173
```

Backend adresleri `.env` üzerinden gelir; `.env.example`'a bak. Tarayıcı yalnızca
`/demo` ve `/agent` öneklerini bilir, gerçek adresleri dev sunucusunun proxy'si
çözer.

```bash
npm run build
npx tsc --noEmit
npm run lint
```

## Yapı

```
src/
├── api/          # client.ts, demoApi.ts, agentApi.ts, types.ts, config.ts
├── components/   # Panel, Badge, Spinner, Loading, ErrorBox, Empty,
│                 # Skeleton, CopyButton, DescriptionList
├── features/
│   ├── crud/     # uç listesi, istek denetçisi
│   └── analysis/ # analiz akışı, aşama zaman çizelgesi, rapor özeti
├── hooks/        # useResource, useMutation, useDebouncedValue
└── App.tsx
```

Backend adresleri yalnızca `src/api/` katmanında bilinir. Veri çekme tek yoldan
geçer (`useResource` / `useMutation`); bileşenlerde çıplak `fetch` yok.

İsterler `docs/features/`, adımlar `docs/tasks/` içinde. Projeler arası sözleşme
`.claude/contract.md`'de.
