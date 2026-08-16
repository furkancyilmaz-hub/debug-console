import type { AnalysisReport, Finding } from '../../api/types'
import { cleanRequestCount, hasText, repeatLabel, sortedFindings, sqlLines } from './reportView'

/**
 * Raporun markdown karşılığı — sunum sonrası paylaşmak için.
 *
 * Ekrandaki sırayı koruyor: önce ölçüm, sonra model metni. Kopyalanan metin de
 * "AI ne dedi" ile başlamasın; asıl güç sayılarda.
 */

function formatInstant(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('tr-TR')
}

/** Tek satırlık sorgu markdown'da da sarmalanmış gelsin. */
function sqlBlock(finding: Finding): string {
  const body = sqlLines(finding.normalizedQuery)
    .map((line) => (line.keyword === null ? line.rest : `${line.keyword} ${line.rest}`.trim()))
    .join('\n')
  return ['```sql', body, '```'].join('\n')
}

function findingSection(finding: Finding, index: number, includeAi: boolean): string {
  const lines: string[] = [
    `## ${index + 1}. ${finding.endpoint}`,
    '',
    `- Tablo çifti: \`${finding.parentTable}\` → \`${finding.childTable}\``,
    `- İlişki: \`${finding.foreignKey}\``,
    `- ${repeatLabel(finding)}`,
    `- Güven: ${finding.confidence}`,
    `- correlationId: \`${finding.correlationId}\``,
    '',
    sqlBlock(finding),
  ]

  if (finding.bindValues.length > 0) {
    lines.push('', `Bağlanan değerler: ${finding.bindValues.join(', ')}`)
  }

  // Model metni yalnızca varsa ve ekranda açıkken; boş alan başlık bırakmıyor.
  if (includeAi && hasText(finding.explanation)) {
    lines.push('', `**AI yorumu:** ${finding.explanation.trim()}`)
  }

  // Ekranla aynı kural: modelin yazmadığı alan başlığını da götürüyor.
  if (includeAi && finding.suggestion !== null) {
    const { action, expectedResult, risk, alternatives } = finding.suggestion
    lines.push('', `**Öneri:** \`${action}\``, '')
    lines.push(`- Beklenen: ${expectedResult}`)
    if (hasText(risk)) {
      lines.push(`- Risk: ${risk.trim()}`)
    }
    if (hasText(alternatives)) {
      lines.push(`- Alternatif: ${alternatives.trim()}`)
    }
  }

  return lines.join('\n')
}

/**
 * @param includeAi ekrandaki "AI yorumları" anahtarını izler — kullanıcı ne
 *                  görüyorsa onu kopyalıyor
 */
export function reportMarkdown(report: AnalysisReport, includeAi: boolean): string {
  const { counts } = report
  const clean = cleanRequestCount(report)

  const head: string[] = [
    `# N+1 analizi — ${report.analysisId}`,
    '',
    `Aralık: ${formatInstant(report.from)} — ${formatInstant(report.to)}`,
    `Durum: ${report.status} · ${(report.durationMs / 1000).toFixed(2)} sn`,
    '',
    '| istek | sorgu | bulgu | temiz istek |',
    '| --- | --- | --- | --- |',
    `| ${counts.requests} | ${counts.queries} | ${counts.findings} | ${clean} |`,
  ]

  // Uyarı tablonun hemen altında: kopyalanan metni okuyan kişi sayıları
  // gördükten sonra değil, onlara güvenmeden önce bunu okumalı.
  if (report.logsTruncated) {
    head.push(
      '',
      '> Log penceresi doldu: yukarıdaki sayılar ve tekrar adetleri alt sınırdır,' +
        ' gerçek değer daha yüksek.',
    )
  }

  if (report.error !== null) {
    head.push('', `> Hata: ${report.error}`)
  }

  const sections = sortedFindings(report.findings).map((finding, index) =>
    findingSection(finding, index, includeAi),
  )

  if (sections.length === 0) {
    sections.push('Bu aralıkta N+1 deseni bulunmadı.')
  }

  if (!includeAi) {
    sections.push(
      'AI yorumları kapalıyken kopyalandı. Bulgular, sayılar ve güven düzeyleri' +
        ' değişmedi — tespit deterministik çalışıyor.',
    )
  }

  return [head.join('\n'), ...sections].join('\n\n') + '\n'
}
