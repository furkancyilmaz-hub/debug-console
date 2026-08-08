import { Badge } from './Badge'
import styles from './StateBlock.module.css'

interface NoticeProps {
  tone: 'warn' | 'danger'
  /** Rozet metni: durumun tek kelimelik adı. */
  label: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

/**
 * HTTP hatası olmayan durum bildirimi: akış koptu, analiz takıldı, agent kendi
 * hatasını bildirdi. `ErrorBox` bir `ApiError` ister; burada öyle bir şey yok,
 * uydurma bir durum kodu basmaktansa ayrı kutu.
 */
export function Notice({ tone, label, message, actionLabel, onAction }: NoticeProps) {
  return (
    <div
      className={`${styles.notice} ${tone === 'danger' ? styles.noticeDanger : styles.noticeWarn}`}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <span className={styles.noticeHead}>
        <Badge tone={tone}>{label}</Badge>
        <span className={styles.errorMessage}>{message}</span>
      </span>

      {onAction !== undefined && actionLabel !== undefined && (
        <button type="button" className={styles.retry} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
