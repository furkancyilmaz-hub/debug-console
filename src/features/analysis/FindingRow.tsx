import { memo } from 'react'
import { Badge } from '../../components/Badge'
import type { Finding } from '../../api/types'
import { FindingDetail } from './FindingDetail'
import { confidenceTone } from './reportView'
import styles from './report.module.css'

interface FindingRowProps {
  finding: Finding
  open: boolean
  showAi: boolean
  /** Kâğıtta akordeon yok: yazdırırken satır tıklanmadan da açık çizilir. */
  forceOpen: boolean
  onToggle: (findingId: string) => void
}

/**
 * Listedeki tek bulgu satırı. `memo` var: bir satır açılıp kapandığında
 * diğerlerinin gövdesi yeniden çizilmiyor.
 *
 * Satırdaki her şey ölçüm — endpoint, tablo çifti, tekrar sayısı, güven.
 * Model metni burada görünmüyor, yalnızca açılan gövdede.
 */
function Row({ finding, open, showAi, forceOpen, onToggle }: FindingRowProps) {
  const bodyId = `finding-body-${finding.findingId}`
  const expanded = open || forceOpen
  const headClass = expanded ? `${styles.head} ${styles.headOpen}` : styles.head
  const countClass =
    finding.confidence === 'HIGH' ? `${styles.count} ${styles.countHigh}` : styles.count

  return (
    <div className={styles.finding}>
      <button
        type="button"
        className={headClass}
        onClick={() => onToggle(finding.findingId)}
        aria-expanded={expanded}
        aria-controls={bodyId}
      >
        <span className={styles.caret}>{expanded ? '▼' : '▶'}</span>
        <span className={styles.endpoint} title={finding.endpoint}>
          {finding.endpoint}
        </span>
        <span className={styles.relation}>
          {finding.parentTable} → {finding.childTable}
        </span>
        <span className={countClass}>{finding.repeatCount.toLocaleString('tr-TR')}×</span>
        <span className={styles.confidence}>
          <Badge tone={confidenceTone(finding.confidence)}>{finding.confidence}</Badge>
        </span>
      </button>

      {expanded && (
        <div className={styles.body} id={bodyId}>
          <FindingDetail finding={finding} showAi={showAi} printing={forceOpen} />
        </div>
      )}
    </div>
  )
}

export const FindingRow = memo(Row)
