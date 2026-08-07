import { Badge } from '../../components/Badge'
import { Empty } from '../../components/Empty'
import type { AnalysisEvent } from '../../api/types'
import type { TimelineEntry } from './analysisContext'
import styles from './analysis.module.css'

interface StageTimelineProps {
  events: TimelineEntry[]
}

function toneOf(event: AnalysisEvent): 'ok' | 'danger' | 'info' | 'neutral' {
  switch (event.type) {
    case 'REPORT':
      return 'ok'
    case 'ERROR':
      return 'danger'
    case 'STAGE_FINISHED':
      return 'info'
    default:
      return 'neutral'
  }
}

/** SSE akışından gelen aşamalar, geldikleri sırada. */
export function StageTimeline({ events }: StageTimelineProps) {
  if (events.length === 0) {
    return <Empty title="Henüz olay yok" hint="Analiz başlayınca aşamalar burada akar." />
  }

  return (
    <ol className={styles.timeline}>
      {events.map(({ id, event }) => (
        <li key={id} className={styles.event}>
          <Badge tone={toneOf(event)}>{event.type}</Badge>
          <span className={styles.eventStage}>{event.stage ?? '—'}</span>
          <span className={styles.eventMeta}>
            {event.kind !== null && (
              <Badge tone={event.kind === 'MODEL' ? 'warn' : 'neutral'}>{event.kind}</Badge>
            )}
            {event.durationMs !== null && <span>{event.durationMs} ms</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}
