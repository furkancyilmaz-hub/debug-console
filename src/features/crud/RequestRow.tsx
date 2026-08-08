import { memo } from 'react'
import { Badge } from '../../components/Badge'
import { CopyButton } from '../../components/CopyButton'
import type { RequestLogEntry } from '../../api/requestLog'
import {
  SOURCE_LABEL,
  barPercent,
  clockLabel,
  isSlow,
  statusLabel,
  statusTone,
} from './requestLogView'
import styles from './RequestInspector.module.css'

/**
 * Denetçideki tek satır. `memo` var: yeni bir istek geldiğinde yalnızca yeni
 * satır ve çubuk referansı değiştiyse hepsi yeniden çizilir.
 */

interface RequestRowProps {
  entry: RequestLogEntry
  /** Çubuk ölçeğinin referansı: kayıtlardaki en yavaş çağrı. */
  slowest: number
  open: boolean
  onToggle: (id: number) => void
}

function Row({ entry, slowest, open, onToggle }: RequestRowProps) {
  const slow = isSlow(entry)
  const rowClass = [styles.row, slow ? styles.rowSlow : null, open ? styles.rowOpen : null]
    .filter((name) => name !== null)
    .join(' ')

  return (
    <div className={styles.rowWrap}>
      <button type="button" className={rowClass} onClick={() => onToggle(entry.id)} aria-expanded={open}>
        <span className={styles.time}>{clockLabel(entry.at)}</span>
        <span className={styles.source}>{SOURCE_LABEL[entry.source]}</span>
        <span className={styles.method}>{entry.method}</span>
        <span className={styles.path} title={entry.path}>
          {entry.path}
        </span>
        <span className={styles.status}>
          <Badge tone={statusTone(entry.status)}>{statusLabel(entry.status)}</Badge>
        </span>
        <span className={styles.track}>
          <i
            className={slow ? `${styles.trackFill} ${styles.trackFillSlow}` : styles.trackFill}
            style={{ width: `${barPercent(entry.latencyMs, slowest)}%` }}
          />
        </span>
        <span className={styles.latency}>{entry.latencyMs} ms</span>
      </button>

      {open && (
        <div className={styles.detail}>
          <code className={styles.correlation}>
            X-Correlation-Id: {entry.correlationId ?? 'yok'}
          </code>
          {entry.correlationId !== null && <CopyButton value={entry.correlationId} label="kopyala" />}
        </div>
      )}
    </div>
  )
}

export const RequestRow = memo(Row)
