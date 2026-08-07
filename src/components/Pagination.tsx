import { PAGE_SIZES } from './table'
import type { PageInfo } from './table'
import styles from './Pagination.module.css'

interface PaginationProps {
  page: PageInfo
  onPageChange: (page: number) => void
  onSizeChange?: (size: number) => void
}

/**
 * Sunucu tarafı sayfalamanın denetimi. Sayfa numarası ve boyut isteğe gider;
 * bileşen kendi başına hiçbir şey dilimlemez.
 */
export function Pagination({ page, onPageChange, onSizeChange }: PaginationProps) {
  const totalPages = Math.max(page.totalPages, 1)
  const current = page.number

  return (
    <nav className={styles.foot} aria-label="Sayfalama">
      <div className={styles.left}>
        {onSizeChange !== undefined && (
          <div className={styles.sizes} role="group" aria-label="Sayfa boyutu">
            {PAGE_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                className={size === page.size ? styles.sizeActive : undefined}
                aria-pressed={size === page.size}
                onClick={() => onSizeChange(size)}
              >
                {size}
              </button>
            ))}
          </div>
        )}
        <span>
          {page.totalElements} kayıt · sayfa {current + 1}/{totalPages}
        </span>
      </div>

      <div className={styles.pager}>
        <button type="button" disabled={current <= 0} onClick={() => onPageChange(current - 1)}>
          ‹ önceki
        </button>
        <button
          type="button"
          disabled={current >= totalPages - 1}
          onClick={() => onPageChange(current + 1)}
        >
          sonraki ›
        </button>
      </div>
    </nav>
  )
}
