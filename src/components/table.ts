import type { ReactNode } from 'react'
import type { Page } from '../api/types'

/**
 * `DataTable`'ın sözleşmesi. Bileşen dosyasından ayrı duruyor ki hem tablo hem
 * başlık satırı aynı tipleri döngüsel import olmadan kullanabilsin.
 */

export type SortDirection = 'asc' | 'desc'

export interface SortState {
  key: string
  direction: SortDirection
}

export interface Column<T> {
  /** Sunucuya `sort=<key>,<dir>` olarak giden alan adı. */
  key: string
  header: string
  render: (row: T) => ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'right'
}

/** Sayfalama için gereken alanlar; tablo tüm `Page<T>`'yi istemiyor. */
export type PageInfo = Pick<Page<unknown>, 'number' | 'size' | 'totalElements' | 'totalPages'>

/** Sunucuya giden sayfa boyutları; seçici bunları listeler. */
export const PAGE_SIZES = [20, 50, 200] as const
export const DEFAULT_PAGE_SIZE = 20

export type AriaSort = 'ascending' | 'descending' | 'none'

export function ariaSort(active: SortState | null, key: string): AriaSort {
  if (active === null || active.key !== key) {
    return 'none'
  }
  return active.direction === 'asc' ? 'ascending' : 'descending'
}

/** Aynı kolona tekrar basınca yön döner; yeni kolonda artan başlar. */
export function nextSort(active: SortState | null, key: string): SortState {
  if (active !== null && active.key === key) {
    return { key, direction: active.direction === 'asc' ? 'desc' : 'asc' }
  }
  return { key, direction: 'asc' }
}
