import { Badge } from '../../components/Badge'
import { CopyButton } from '../../components/CopyButton'
import type { RequestResult } from '../../api/types'
import styles from './crud.module.css'

interface RequestInspectorProps {
  result: RequestResult<unknown>
}

/**
 * Son çağrının ölçülen bilgisi. Süreyi console kendisi tutuyor;
 * `X-Correlation-Id` yanıt başlığından okunuyor — bu başlık ancak proxy
 * üzerinden same-origin gelindiği için okunabilir.
 */
export function RequestInspector({ result }: RequestInspectorProps) {
  return (
    <div className={styles.inspector}>
      <Badge tone={result.status < 400 ? 'ok' : 'danger'}>HTTP {result.status}</Badge>
      <Badge>{result.durationMs} ms</Badge>
      {result.correlationId !== null ? (
        <>
          <Badge tone="info">
            <code>{result.correlationId}</code>
          </Badge>
          <CopyButton value={result.correlationId} label="Correlation id'yi kopyala" />
        </>
      ) : (
        <Badge tone="warn">correlation id yok</Badge>
      )}
    </div>
  )
}
