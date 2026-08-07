import type { ReactNode } from 'react'
import type { ApiError } from '../api/client'
import type { Column, PageInfo, SortState } from './table'
import { DataTableHead } from './DataTableHead'
import { Empty } from './Empty'
import { ErrorBox } from './ErrorBox'
import { Pagination } from './Pagination'
import styles from './DataTable.module.css'

/**
 * Kolon tanımıyla sürülen generic tablo.
 *
 * Kolonlar ekran dosyasında durur, burada değil: aynı bileşen teklif tablosunu
 * da müşteri tablosunu da sürüyor.
 *
 * `<thead>` hiçbir durumda sökülmez. Yükleniyor, boş ve hata yalnızca gövdeyi
 * değiştirir — tablo yapısı yerinde kalır, ekran zıplamaz.
 */

interface DataTableProps<T> {
  columns: readonly Column<T>[]
  rows: readonly T[]
  /** Gerçek kimlik; liste render'ında index anahtar olarak kullanılmaz. */
  rowKey: (row: T) => string | number
  /** Ekran okuyucular için tablo adı; görsel olarak gizli. */
  caption: string
  loading?: boolean
  error?: ApiError | null
  onRetry?: () => void
  emptyTitle?: string
  emptyHint?: string
  onRowClick?: (row: T) => void
  sort?: SortState | null
  onSortChange?: (sort: SortState) => void
  page?: PageInfo | null
  onPageChange?: (page: number) => void
  onSizeChange?: (size: number) => void
}

const SKELETON_ROW_LIMIT = 10

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  loading = false,
  error = null,
  onRetry,
  emptyTitle,
  emptyHint,
  onRowClick,
  sort = null,
  onSortChange,
  page = null,
  onPageChange,
  onSizeChange,
}: DataTableProps<T>) {
  const clickable = onRowClick !== undefined

  function stateRow(content: ReactNode): ReactNode {
    return (
      <tr>
        <td className={styles.stateCell} colSpan={columns.length}>
          {content}
        </td>
      </tr>
    )
  }

  function skeletonBody(): ReactNode {
    const count = Math.min(page?.size ?? 5, SKELETON_ROW_LIMIT)
    return Array.from({ length: count }, (_, position) => (
      <tr key={`skeleton-row-${position}`} aria-hidden="true">
        {columns.map((column) => (
          <td key={column.key} className={styles.cell}>
            <span className={styles.skeleton} />
          </td>
        ))}
      </tr>
    ))
  }

  function dataRow(row: T): ReactNode {
    return (
      <tr
        key={rowKey(row)}
        className={clickable ? styles.clickable : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable ? () => onRowClick(row) : undefined}
        onKeyDown={
          clickable
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onRowClick(row)
                }
              }
            : undefined
        }
      >
        {columns.map((column) => (
          <td
            key={column.key}
            className={column.align === 'right' ? `${styles.cell} ${styles.numeric}` : styles.cell}
          >
            {column.render(row)}
          </td>
        ))}
      </tr>
    )
  }

  function body(): ReactNode {
    if (error !== null) {
      return stateRow(<ErrorBox error={error} onRetry={onRetry} />)
    }
    if (rows.length > 0) {
      return rows.map(dataRow)
    }
    return loading ? skeletonBody() : stateRow(<Empty title={emptyTitle} hint={emptyHint} />)
  }

  return (
    <div className={styles.card}>
      <table className={styles.table} aria-busy={loading}>
        <caption className={styles.caption}>{caption}</caption>
        <DataTableHead columns={columns} sort={sort} onSortChange={onSortChange} />
        {/* Eldeki satırlar yenilenirken yerinde kalır, yalnızca sönükleşir. */}
        <tbody className={loading && rows.length > 0 ? styles.stale : undefined}>{body()}</tbody>
      </table>

      {page !== null && onPageChange !== undefined && (
        <Pagination page={page} onPageChange={onPageChange} onSizeChange={onSizeChange} />
      )}
    </div>
  )
}
