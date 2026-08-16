import { CopyButton } from '../../components/CopyButton'
import { DescriptionList } from '../../components/DescriptionList'
import type { AnalysisReport } from '../../api/types'
import { cleanRequestCount } from './reportView'
import styles from './report.module.css'

interface ReportSummaryProps {
  report: AnalysisReport
}

function formatInstant(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('tr-TR')
}

function count(value: number): string {
  return value.toLocaleString('tr-TR')
}

/**
 * Raporun ölçülmüş özeti.
 *
 * `temiz istek` raporda hazır gelmiyor, türetiliyor — ve burada duruyor çünkü
 * yanlış pozitif üretmediğimizi gösteren sayı bu: aynı veriyi dönen iki uçtan
 * biri bulgu üretip diğeri üretmiyorsa fark bu kutucukta okunuyor.
 *
 * Mockup'taki `ayrıştırılamadı` kutucuğu **bilerek yok**: agent o sayıyı
 * ölçmüyor (`AnalysisCounts` = logLines/requests/queries/findings), ekran da
 * olmayan sayıyı uydurmuyor.
 */
export function ReportSummary({ report }: ReportSummaryProps) {
  const { counts } = report

  return (
    <div>
      {report.logsTruncated && (
        <p className={styles.truncatedNote}>
          Log penceresi doldu: aralıkta bu analizin görmediği satırlar var. Aşağıdaki
          sayılar ve tekrar adetleri gerçek değeri değil, alt sınırı gösteriyor. Daha
          dar bir aralık seçin.
        </p>
      )}

      <div className={styles.summary}>
        <div className={styles.tile}>
          <div className={styles.tileValue}>{count(counts.requests)}</div>
          <div className={styles.tileKey}>istek</div>
        </div>
        <div className={styles.tile}>
          <div className={styles.tileValue}>{count(counts.queries)}</div>
          <div className={styles.tileKey}>sorgu</div>
        </div>
        <div className={styles.tile}>
          <div className={`${styles.tileValue} ${counts.findings > 0 ? styles.tileHot : ''}`}>
            {count(counts.findings)}
          </div>
          <div className={styles.tileKey}>bulgu</div>
        </div>
        <div className={styles.tile}>
          <div className={`${styles.tileValue} ${styles.tileGood}`}>
            {count(cleanRequestCount(report))}
          </div>
          <div className={styles.tileKey}>temiz istek</div>
        </div>
      </div>

      <div className={styles.meta}>
        <DescriptionList
          items={[
            { term: 'Durum', value: report.status },
            {
              term: 'Analiz id',
              value: (
                <>
                  <code>{report.analysisId}</code> <CopyButton value={report.analysisId} />
                </>
              ),
            },
            {
              term: 'Aralık',
              value: `${formatInstant(report.from)} — ${formatInstant(report.to)}`,
            },
            { term: 'Başlangıç', value: formatInstant(report.startedAt) },
            { term: 'Süre', value: `${report.durationMs} ms` },
            ...(report.error !== null ? [{ term: 'Hata', value: report.error }] : []),
          ]}
        />
      </div>
    </div>
  )
}
