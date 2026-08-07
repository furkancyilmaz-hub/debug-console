import { Badge } from '../../components/Badge'
import { CopyButton } from '../../components/CopyButton'
import { DescriptionList } from '../../components/DescriptionList'
import type { BadgeTone } from '../../components/Badge'
import type { AnalysisReport, AnalysisStatus } from '../../api/types'
import styles from './analysis.module.css'

interface ReportSummaryProps {
  report: AnalysisReport
}

const STATUS_TONE: Record<AnalysisStatus, BadgeTone> = {
  RUNNING: 'info',
  COMPLETED: 'ok',
  FAILED: 'danger',
}

function formatInstant(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

/**
 * Raporun ölçülmüş özeti. Bulgu listesinin kendisi sonraki göreve ait; burada
 * yalnızca sayılar var.
 */
export function ReportSummary({ report }: ReportSummaryProps) {
  const { counts } = report

  return (
    <div>
      <div className={styles.counts}>
        <Badge tone={STATUS_TONE[report.status]}>{report.status}</Badge>
        <Badge>{counts.logLines} log satırı</Badge>
        <Badge>{counts.requests} istek</Badge>
        <Badge>{counts.queries} sorgu</Badge>
        <Badge tone={counts.findings > 0 ? 'warn' : 'ok'}>{counts.findings} bulgu</Badge>
      </div>

      <DescriptionList
        items={[
          {
            term: 'Analiz id',
            value: (
              <>
                <code>{report.analysisId}</code> <CopyButton value={report.analysisId} />
              </>
            ),
          },
          { term: 'Aralık', value: `${formatInstant(report.from)} — ${formatInstant(report.to)}` },
          { term: 'Başlangıç', value: formatInstant(report.startedAt) },
          { term: 'Süre', value: `${report.durationMs} ms` },
          ...(report.error !== null ? [{ term: 'Hata', value: report.error }] : []),
        ]}
      />

      <p className={styles.note}>
        Bulgu listesi ve düzeltme önerileri sonraki adımda eklenecek.
      </p>
    </div>
  )
}
