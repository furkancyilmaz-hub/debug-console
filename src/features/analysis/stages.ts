import type { StageRow, StageStatus } from '../../hooks/useAnalysisStream'

/**
 * Aşama satırının saf hesapları. `useAnalysisStream` `payload`'ı ham `unknown`
 * olarak saklıyor; okunabilir metne çevirmek burada.
 *
 * Dosya adı `StageList.tsx` ile çakışmasın diye `stages.ts` — Windows'un harf
 * duyarsız dosya sistemi aynı tuzağı T002_0, T002_1 ve T002_2'de kurmuştu.
 */

/**
 * `STAGE_FINISHED` payload'ındaki sayıların Türkçe karşılıkları.
 *
 * Sözleşme (§4) `payload` için yalnızca "özet sayılar" diyor, anahtar adlarını
 * sabitlemiyor. Aşağıdaki adlar çalışan agent'a karşı **ölçüldü**:
 *
 *     loglar          {"logLines":179,"requests":8}
 *     ayrıştırma      {"correlationIds":10,"queries":77}
 *     tespit          {"findings":3}
 *     zenginleştirme  {"enriched":0}
 *
 * Harita yine de **tanımadığı anahtarı sessizce atlıyor**: agent yeni bir alan
 * eklerse ekran bozulmaz, o alan görünmez olur. `calls` ölçülmedi, model katmanı
 * kapalıyken çalışmadığı için mockup'a bakılarak bırakıldı.
 */
const NOTE_LABEL: Record<string, string> = {
  logLines: 'satır',
  requests: 'istek',
  correlationIds: 'istek',
  queries: 'sorgu',
  findings: 'bulgu',
  enriched: 'zenginleştirildi',
  calls: 'çağrı',
}

/** Sayı değil ad taşıyan alan — mockup'taki "sonnet · 1 çağrı" gibi. */
const NAME_KEYS: readonly string[] = ['model']

function asRecord(payload: unknown): Record<string, unknown> | null {
  return typeof payload === 'object' && payload !== null && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : null
}

/**
 * Aşamanın tek satırlık özeti: `892 satır · 4 ayrıştırılamadı`.
 * Okunabilir hiçbir alan yoksa `null`.
 */
export function stageNote(payload: unknown): string | null {
  const record = asRecord(payload)
  if (record === null) {
    return null
  }

  const parts: string[] = []
  // Anahtar sırası backend'in JSON sırası; sıralamayı ona bırakıyoruz.
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      const label = NOTE_LABEL[key]
      if (label !== undefined) {
        parts.push(`${value.toLocaleString('tr-TR')} ${label}`)
      }
      continue
    }
    if (typeof value === 'string' && value !== '' && NAME_KEYS.includes(key)) {
      parts.push(value)
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
