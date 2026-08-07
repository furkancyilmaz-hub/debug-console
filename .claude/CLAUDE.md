# CLAUDE.md — debug-console

React + TypeScript SPA. **Projedeki tek arayüz.** İki backend'e birden konuşur:
`demo-api` (:8080) ve `api-debug-agent` (:8081).

İki ekran:
- **CRUD** — hedef servisin gerçek arayüzü: listeler, detaylar, form.
  Kullanıcı uygulamayı kullandıkça trafik oluşur; ayrıca istek atmaz.
- **Analiz** — zaman aralığı seçip agent'ı çalıştırır, raporu gösterir

CRUD ekranı endpoint'leri **tarafsız** listeler; hangisinin N+1 ürettiğini
ekranda yazma. Bunu ortaya çıkarmak raporun işi.

Backend sözleşmeleri `docs/contract.md`'de.

## Stack

React 18 + TypeScript + Vite. Component kütüphanesi kurma — değerlendirilecek olan
yazılan kod.

## Kurulmayacaklar

Component kütüphanesi (MUI, AntD), tablo kütüphanesi, form kütüphanesi, veri
çekme kütüphanesi (React Query). Tablo, sayfalama, doğrulama ve fetch hook'u
elle yazılacak — değerlendirilecek olan tam olarak o soyutlamalar.

React Router serbest; drill-down ve paylaşılabilir adres için gerekli.

## Kurallar

- `strict: true` açık kalır. Kapatma.
- `any` yok. Backend cevapları `src/api/types.ts`'te tipli.
- Backend adresleri yalnızca `src/api/` katmanında bilinir; bileşenlere URL yazma.
- Fetch çağrıları `src/api/client.ts` üzerinden geçer; her yerde ayrı `fetch`
  yazma.
- Olay bazlı state için `useReducer`. Birbirine bağlı üç ayrı `useState`
  görürsen reducer'a çevir.
- Veri çekme tek yoldan: `useResource` / `useMutation`. Bileşende çıplak `fetch`
  yok.
- Her asenkron çağrıda `AbortController` ve yarış koşulu koruması. Geç dönen
  eski cevap ekrana yazılmaz.
- Jenerik bileşenlerde `any` yok; `DataTable<T>` gerçekten generic olmalı.
- Yükleniyor / boş / hata durumları ortak bileşenlerden gelir; ekranlar kendi
  hata metnini uydurmaz.
- Efektlerde temizlik: `EventSource`, timer, abort controller — hepsi kapatılır.
- Liste render'ında `key` gerçek id olur, index değil.
- `localStorage` / `sessionStorage` kullanma.

## Yapı

```
src/
├── api/          # client.ts, demoApi.ts, agentApi.ts, types.ts
├── components/   # Panel, Badge, Spinner, ErrorBox, CopyButton
├── features/
│   ├── crud/     # listeler, detaylar, form, istek denetçisi
│   └── analysis/ # analiz akışı, bulgu listesi, rapor
├── hooks/
└── App.tsx
```

Bileşen dosyası tek bileşen export eder. 200 satırı geçen bileşeni böl.

## Komutlar

- `npm run dev` (:5173, proxy ile :8080 ve :8081)
- `npm run build`
- `npx tsc --noEmit`

Her değişiklikten sonra `tsc --noEmit` çalıştır.

## Çalışma şekli

Önce plan çıkar, onay bekle, sonra implement et.
İsterler `docs/features/`, adımlar `docs/tasks/` içinde.
