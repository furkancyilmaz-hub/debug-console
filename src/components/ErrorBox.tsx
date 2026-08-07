import { Badge } from './Badge'
import { NETWORK_ERROR_STATUS } from '../api/client'
import type { ApiError } from '../api/client'
import styles from './StateBlock.module.css'

interface ErrorBoxProps {
  error: ApiError
  onRetry?: () => void
}

/**
 * Tek hata gösterimi. Metni `ApiError`'dan kendisi üretir — ekranlar kendi hata
 * cümlesini yazmaz, iki backend'in farklı hata biçimlerini de bilmez.
 */
export function ErrorBox({ error, onRetry }: ErrorBoxProps) {
  const offline = error.status === NETWORK_ERROR_STATUS

  return (
    <div className={`${styles.block} ${styles.error}`} role="alert">
      <div className={styles.errorHead}>
        <Badge tone="danger">{offline ? 'bağlantı yok' : `HTTP ${error.status}`}</Badge>
        <span className={styles.errorMessage}>{error.message}</span>
      </div>

      {error.violations.length > 0 && (
        <ul className={styles.violations}>
          {error.violations.map((violation) => (
            <li key={violation.field}>
              <code>{violation.field}</code> — {violation.message}
            </li>
          ))}
        </ul>
      )}

      {onRetry !== undefined && (
        <button type="button" className={styles.retry} onClick={onRetry}>
          Tekrar dene
        </button>
      )}
    </div>
  )
}
