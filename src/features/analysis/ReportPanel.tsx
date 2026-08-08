import { useMemo, useState } from 'react'
import { CopyButton } from '../../components/CopyButton'
import type { AnalysisReport } from '../../api/types'
import { AnalysisEmptyResult } from './AnalysisEmptyResult'
import { FindingList } from './FindingList'
import { ReportSummary } from './ReportSummary'
import { reportMarkdown } from './reportMarkdown'
import styles from './report.module.css'

interface ReportPanelProps {
  report: AnalysisReport
}

/**
 * Raporun tamamı: özet, bulgu listesi, paylaşım.
 *
 * "AI yorumları" anahtarı kapatıldığında ölçüm blokları, sayılar ve güven
 * düzeyleri hiç değişmiyor; yalnızca model metni ve öneri kartları kalkıyor.
 * Tespitin deterministik olduğu iddiası ekranda böyle kanıtlanıyor — ayrıca
 * agent'ta `llm.enabled: false` ile gelen nullable yolun görsel karşılığı bu.
 */
export function ReportPanel({ report }: ReportPanelProps) {
  const [showAi, setShowAi] = useState(true)

  // Kopyalanacak metin her render'da baştan kurulmasın; rapor uzun olabiliyor.
  const markdown = useMemo(() => reportMarkdown(report, showAi), [report, showAi])

  return (
    <div>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.switch}
          role="switch"
          aria-checked={showAi}
          onClick={() => setShowAi((on) => !on)}
        >
          <span className={showAi ? `${styles.track} ${styles.trackOn}` : styles.track} />
          AI yorumları
        </button>

        <span className={styles.copyReport}>
          <CopyButton value={markdown} label="Raporu kopyala" />
        </span>
      </div>

      <ReportSummary report={report} />
      <FindingList findings={report.findings} showAi={showAi} />
      <AnalysisEmptyResult report={report} />

      {!showAi && report.counts.findings > 0 && (
        <p className={styles.aiOffNote}>
          AI yorumları kapalı. Bulgular, sayılar ve güven düzeyleri değişmedi — tespit
          tamamen deterministik çalışıyor, model yalnızca açıklama ekliyor.
        </p>
      )}
    </div>
  )
}
