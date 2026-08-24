import type { StageRow, StageStatus } from '../../hooks/useAnalysisStream'

/**
 * Aşama satırının saf hesapları. `useAnalysisStream` `payload`'ı ham `unknown`
 * olarak saklıyor; okunabilir metne çevirmek burada.
 *
 * Dosya adı `StageList.tsx` ile çakışmasın diye `stages.ts` — Windows'un harf
 * duyarsız dosya sistemi aynı tuzağı T002_0, T002_1 ve T002_2'de kurmuştu.
 */

interface NoteField {
  key: string
  /** `count` sonlu bir sayı bekler; `flag` yalnızca `true` iken basılır. */
  kind: 'count' | 'flag'
  label: string
}

/**
 * `STAGE_FINISHED` payload'ındaki alanların Türkçe karşılıkları — **ve basılma
 * sıraları**.
 *
 * Sıra buradan geliyor, payload'dan değil. Agent özet haritasını
 * `Map.copyOf(Map.of(...))` ile kuruyor (`AnalysisEvent.stageFinished`); JDK'nın
 * `ImmutableCollections.MapN`'i JVM açılışındaki `SALT`'a göre yineliyor, yani
 * JSON anahtar sırası **her agent yeniden başlatmasında değişiyor**. Ölçüldü:
 * aynı iki anahtar art arda koşularda `[queries, correlationIds]` ve
 * `[correlationIds, queries]` olarak geldi. Payload sırasına uyulursa aşama
 * notu bir koşuda `2.161 sorgu · 78 sorgulu istek`, diğerinde tersi çıkıyordu.
 *
 * Alan adları çalışan agent'a karşı ölçüldü:
 *
 *     loglar          {"requests":95,"logLines":5000,"truncated":true}
 *     ayrıştırma      {"correlationIds":78,"queries":2161}
 *     tespit          {"findings":9}
 *     zenginleştirme  {"enriched":9}
 *
 * Liste yine de **tanımadığı anahtarı sessizce atlıyor**: agent yeni bir alan
 * eklerse ekran bozulmaz, o alan görünmez olur.
 *
 * `correlationIds` bilerek **listede yok**. O sayı SQL üreten farklı isteklerin
 * adedi ve `requests` ile hiç tutmuyor: `demo-crud-api` `/internal/` yollarına
 * `REQUEST_COMPLETED` yazmıyor (`CorrelationIdFilter.isNotRecorded`) ama o
 * isteklerin SQL'i `app_log`'a düşüyor — yani ajanın kendi log sorguları, yani
 * önceki analizler sayıya giriyor. Kullanıcının hiç yapmadığı isteği "istek"
 * diye göstermektense hiç göstermiyoruz; mockup'ta da bu slot istek sayısı
 * değildi. `cleanRequestCount` aynı asimetriyi `Math.max(0, …)` ile karşılıyor.
 */
const NOTE_FIELDS: readonly NoteField[] = [
  { key: 'logLines', kind: 'count', label: 'satır' },
  { key: 'requests', kind: 'count', label: 'istek' },
  { key: 'queries', kind: 'count', label: 'sorgu' },
  { key: 'findings', kind: 'count', label: 'bulgu' },
  { key: 'enriched', kind: 'count', label: 'zenginleştirildi' },
  // Rapordaki uyarı bloğu analiz bitince çıkıyor; pencerenin dolduğunu o zamana
  // kadar yalnızca bu parça söylüyor.
  { key: 'truncated', kind: 'flag', label: 'pencere doldu' },
]

function asRecord(payload: unknown): Record<string, unknown> | null {
  return typeof payload === 'object' && payload !== null && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : null
}

/**
 * Aşamanın tek satırlık özeti: `5.000 satır · 95 istek · pencere doldu`.
 * Okunabilir hiçbir alan yoksa `null`.
 */
export function stageNote(payload: unknown): string | null {
  const record = asRecord(payload)
  if (record === null) {
    return null
  }

  const parts: string[] = []
  for (const field of NOTE_FIELDS) {
    const value = record[field.key]
    if (field.kind === 'count') {
      if (typeof value === 'number' && Number.isFinite(value)) {
        parts.push(`${value.toLocaleString('tr-TR')} ${field.label}`)
      }
      continue
    }
    if (value === true) {
      parts.push(field.label)
    }
  }

  return parts.length > 0 ? parts.join(' · ') : null
}

/** Çubukların referansı: ölçülmüş aşamaların toplamı (mockup ile aynı). */
export function totalDurationMs(stages: readonly StageRow[]): number {
  let total = 0
  for (const row of stages) {
    total += row.durationMs ?? 0
  }
  return total
}

/** Ölçülmemiş aşama çubuk çizmez; en kısası bile görünsün diye %2 taban var. */
export function barPercent(durationMs: number | null, totalMs: number): number {
  if (durationMs === null || totalMs <= 0) {
    return 0
  }
  return Math.max(2, Math.round((durationMs / totalMs) * 100))
}

export function durationLabel(durationMs: number | null): string {
  return durationMs === null ? '' : `${(durationMs / 1000).toFixed(2)} sn`
}

const STATUS_ICON: Record<StageStatus, string> = {
  pending: '·',
  running: '',
  done: '✓',
  failed: '!',
}

const STATUS_LABEL: Record<StageStatus, string> = {
  pending: 'bekliyor',
  running: 'çalışıyor',
  done: 'bitti',
  failed: 'başarısız',
}

/** `running` boş döner: onun yerine `<Spinner/>` basılıyor. */
export function stageIcon(status: StageStatus): string {
  return STATUS_ICON[status]
}

export function stageStatusLabel(status: StageStatus): string {
  return STATUS_LABEL[status]
}
