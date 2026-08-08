import type { BadgeTone } from '../../components/Badge'
import type { AnalysisReport, Confidence, Finding } from '../../api/types'

/**
 * Rapor ekranının saf hesapları. Bileşenler yalnızca render ediyor; sıralama,
 * türetilen sayı ve SQL kırma burada.
 *
 * Sarmalayıcı bileşenin adı `ReportPanel.tsx`: Windows'un harf duyarsız dosya
 * sisteminde `reportView.ts` ile `ReportView.tsx` yan yana okunmuyor —
 * `requestLogView.ts`/`RequestInspector.tsx` ikilisiyle aynı ayrım.
 */

/**
 * Bulgular tekrar sayısına göre azalan sırada. Eşitlikte `findingId` —
 * sıralama kararlı olsun, aynı rapor iki kez farklı dizilmesin.
 *
 * Kopya üzerinde çalışıyor: `findings` prop olarak geliyor, `sort` yerinde
 * sıralar ve context'teki raporu bozardı.
 */
export function sortedFindings(findings: readonly Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    if (a.repeatCount !== b.repeatCount) {
      return b.repeatCount - a.repeatCount
    }
    return a.findingId.localeCompare(b.findingId)
  })
}

/**
 * Bulgusuz kalan istek sayısı. Raporda hazır gelmiyor; `counts.requests` ile
 * bulgu üreten farklı `correlationId` sayısının farkı.
 *
 * Bu sayı SP004'ün "yanlış pozitif üretmiyoruz" iddiasını taşıyor: aynı veriyi
 * dönen iki uçtan biri bulgu üretip diğeri üretmiyorsa fark burada görünüyor.
 *
 * Alt sınır sıfıra çekiliyor: `requests` istek loglarından, `correlationId`
 * sorgu loglarından geliyor — ayrı kaynaklar, biri diğerini aşabilir.
 */
export function cleanRequestCount(report: AnalysisReport): number {
  const withFindings = new Set(report.findings.map((finding) => finding.correlationId))
  return Math.max(0, report.counts.requests - withFindings.size)
}

/**
 * Mockup'la aynı eşleme: `HIGH` turuncu, `MEDIUM` gri.
 *
 * Bilerek `danger` yok — güven Java'nın ölçtüğü bir değer, bir alarm değil.
 * Kırmızı rozet düşük güveni hata gibi gösterirdi.
 */
export function confidenceTone(confidence: Confidence): BadgeTone {
  return confidence === 'HIGH' ? 'warn' : 'neutral'
}

/** Tek satırlık normalize sorgunun okunabilir parçası. */
export interface SqlLine {
  /** Satırı açan anahtar kelime; yoksa `null`. */
  keyword: string | null
  rest: string
}

/**
 * Anahtar kelime öncesinde satır kırılıyor. Yalnızca `select` / `from` /
 * `where`: normalize sorgu tek satır geliyor ve bu üçü onu okunur hâle
 * getirmeye yetiyor.
 *
 * Anahtar kelime ayrı alanda dönüyor ki bileşen `<b>` ile vurgulayabilsin —
 * mockup bunu regex ile HTML'e gömüyordu, burada `dangerouslySetInnerHTML`
 * gerekmesin diye veri olarak taşınıyor.
 */
export function sqlLines(normalizedQuery: string): SqlLine[] {
  const query = normalizedQuery.trim()
  if (query === '') {
    return []
  }

  // Regex her çağrıda yeniden kuruluyor: `g` bayraklı bir literal modül
  // seviyesinde paylaşılsa `lastIndex`'i çağrılar arasında taşırdı.
  const keywords = /\b(select|from|where)\b/gi
  const lines: SqlLine[] = []
  let cursor = 0
  let keyword: string | null = null

  // `matchAll` yerine `exec` döngüsü: kırma noktaları arasındaki metni de
  // taşımak gerekiyor, yalnızca eşleşmeleri değil.
  let match = keywords.exec(query)
  while (match !== null) {
    const rest = query.slice(cursor, match.index).trim()
    // İlk anahtar kelime sorgunun başındaysa öncesinde boş satır oluşmasın.
    if (keyword !== null || rest !== '') {
      lines.push({ keyword, rest })
    }
    keyword = match[0]
    cursor = match.index + match[0].length
    match = keywords.exec(query)
  }

  lines.push({ keyword, rest: query.slice(cursor).trim() })
  return lines
}

/**
 * `214 tekrar · 214 farklı değer · tam N+1`.
 *
 * Oran da yazılıyor: tekrar sayısı benzersiz bind sayısına eşitse her tekrar
 * ayrı bir id için, yani tam N+1. Değilse aynı id'ler tekrar sorgulanmış —
 * bu da bir sorun ama farklı bir sorun, sayı bunu ayırt ettiriyor.
 */
export function repeatLabel(finding: Finding): string {
  const { repeatCount, distinctBindCount } = finding
  const head = `${repeatCount.toLocaleString('tr-TR')} tekrar · ${distinctBindCount.toLocaleString('tr-TR')} farklı değer`

  if (distinctBindCount === 0) {
    return head
  }
  if (repeatCount === distinctBindCount) {
    return `${head} · tam N+1`
  }
  return `${head} · ${(repeatCount / distinctBindCount).toFixed(1)}× tekrarlı`
}

/** Modelin yazdığı metin gerçekten var mı — boş string de yok sayılıyor. */
export function hasText(value: string | null): value is string {
  return value !== null && value.trim() !== ''
}
