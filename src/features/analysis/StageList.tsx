import { Badge } from '../../components/Badge'
import { Empty } from '../../components/Empty'
import { Spinner } from '../../components/Spinner'
import type { StageRow } from '../../hooks/useAnalysisStream'
import { barPercent, durationLabel, stageIcon, stageNote, stageStatusLabel, totalDurationMs } from './stages'
import styles from './analysis.module.css'

interface StageListProps {
  stages: readonly StageRow[]
}

/**
 * Aşamalar, sözleşmedeki sırayla. Liste analiz başlar başlamaz dört satırla
 * doluyor; olaylar geldikçe satırlar `bekliyor → çalışıyor → bitti` oluyor.
 * Kullanıcı ilk saniyede işin ne kadarının kaldığını görüyor.
 *
 * Görsel kaynak: `docs/mockup.html` `.stage`.
 */
export function StageList({ stages }: StageListProps) {
  if (stages.length === 0) {
    return (
      <Empty
        title="Henüz analiz çalıştırılmadı"
        hint="CRUD ekranında birkaç sayfa gezin, sonra aralığı analiz edin."
      />
    )
  }

  const totalMs = totalDurationMs(stages)
  // Adresten devralınan bitmiş analizde aşama süreleri yok: akış çoktan kapanmış.
  const unwatched = totalMs === 0 && stages.every((row) => row.status !== 'pending')

  return (
    <>
      <ol className={styles.stages}>
        {stages.map((row) => {
          const note = stageNote(row.payload)
          const model = row.kind === 'MODEL'

          return (
            <li
              key={row.stage}
              className={model ? `${styles.stage} ${styles.stageModel}` : styles.stage}
            >
              <span className={styles.stageIcon} role="img" aria-label={stageStatusLabel(row.status)}>
                {row.status === 'running' ? <Spinner /> : stageIcon(row.status)}
              </span>

              <span className={styles.stageName}>{row.stage}</span>

              <span className={styles.stageKind}>
                {row.kind !== null && <Badge tone={model ? 'warn' : 'neutral'}>{row.kind}</Badge>}
              </span>

              <span className={styles.stageNote}>
                {note ?? (row.status === 'running' ? '…' : '')}
              </span>

              <span className={styles.track}>
                <i
                  className={styles.trackFill}
                  style={{ width: `${barPercent(row.durationMs, totalMs)}%` }}
                />
              </span>

              <span className={styles.stageMs}>{durationLabel(row.durationMs)}</span>
            </li>
          )
        })}
      </ol>

      {unwatched && (
        <p className={styles.note}>
          Bu analiz canlı izlenmedi; aşama süreleri akışla birlikte geçmiş.
        </p>
      )}
    </>
  )
}
