import { ariaSort, nextSort } from './table'
import type { Column, SortState } from './table'
import styles from './DataTable.module.css'

interface DataTableHeadProps<T> {
  columns: readonly Column<T>[]
  sort: SortState | null
  onSortChange?: (sort: SortState) => void
}

/**
 * Tablo başlık satırı. Sıralanabilir başlık gerçek bir `<button>`: klavye
 * desteği ve odak halkası kendiliğinden geliyor.
 */
export function DataTableHead<T>({ columns, sort, onSortChange }: DataTableHeadProps<T>) {
  return (
    <thead>
      <tr>
        {columns.map((column) => {
          const sortable = column.sortable === true && onSortChange !== undefined
          const active = sort !== null && sort.key === column.key

          return (
            <th
              key={column.key}
              scope="col"
              style={column.width !== undefined ? { width: column.width } : undefined}
              className={column.align === 'right' ? styles.numeric : undefined}
              aria-sort={sortable ? ariaSort(sort, column.key) : undefined}
            >
              {sortable ? (
                <button
                  type="button"
                  className={styles.sortButton}
                  onClick={() => onSortChange(nextSort(sort, column.key))}
                >
                  {column.header}
                  {active && (
                    <span className={styles.caret} aria-hidden="true">
                      {sort.direction === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </button>
              ) : (
                column.header
              )}
            </th>
          )
        })}
      </tr>
    </thead>
  )
}
