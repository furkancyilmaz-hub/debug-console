import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '../../components/table'
import type { SortState } from '../../components/table'

/**
 * Liste ekranlarının durumu adres çubuğunda durur: sayfa, boyut, sıralama ve
 * arama. Yenileme aynı ekranı açar, bağlantı paylaşılabilir.
 *
 * Parametre adları backend'inkiyle birebir aynı — arada çeviri katmanı yok.
 */

const SORT_DIRECTIONS = ['asc', 'desc'] as const

/** `"fullName,asc"` → obje. Bozuk değer sessizce yok sayılır. */
export function parseSort(value: string | null): SortState | null {
  if (value === null) {
    return null
  }
  const [key, direction] = value.split(',')
  if (key === undefined || key === '' || direction === undefined) {
    return null
  }
  const match = SORT_DIRECTIONS.find((candidate) => candidate === direction)
  return match === undefined ? null : { key, direction: match }
}

/** Obje → Spring'in beklediği `"fullName,asc"`. */
export function formatSort(sort: SortState): string {
  return `${sort.key},${sort.direction}`
}

function readPage(value: string | null): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0
}

function readSize(value: string | null): number {
  const parsed = Number(value)
  const match = PAGE_SIZES.find((candidate) => candidate === parsed)
  return match ?? DEFAULT_PAGE_SIZE
}

/**
 * Adres çubuğuna yazmanın tek yolu. Boş değer parametreyi siler, geçmişe yeni
 * kayıt eklenmez.
 *
 * Fonksiyonel güncelleme sayesinde geri çağrı `searchParams`'a bağlı olmuyor;
 * her render'da kimlik değiştirmiyor.
 */
function useParamWriter(): (changes: Record<string, string | null>) => void {
  const [, setSearchParams] = useSearchParams()

  return useCallback(
    (changes: Record<string, string | null>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === '') {
              next.delete(key)
            } else {
              next.set(key, value)
            }
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )
}

export interface ListParams {
  page: number
  size: number
  sort: SortState
  /** İsteğe giden hâli; `useResource` bağımlılığı olarak da bu kullanılır. */
  sortParam: string
  setPage: (page: number) => void
  setSize: (size: number) => void
  setSort: (sort: SortState) => void
}

/** Her listenin ortak durumu: sayfa, boyut, sıralama. */
export function useListParams(defaultSort: SortState): ListParams {
  const [searchParams] = useSearchParams()
  const update = useParamWriter()

  const sort = parseSort(searchParams.get('sort')) ?? defaultSort

  // Boyut ve sıralama değişince sayfa başa döner; yoksa kullanıcı sonuçların
  // dışında bir sayfada kalır.
  const setPage = useCallback((page: number) => update({ page: String(page) }), [update])
  const setSize = useCallback(
    (size: number) => update({ size: String(size), page: null }),
    [update],
  )
  const setSort = useCallback(
    (next: SortState) => update({ sort: formatSort(next), page: null }),
    [update],
  )

  return {
    page: readPage(searchParams.get('page')),
    size: readSize(searchParams.get('size')),
    sort,
    sortParam: formatSort(sort),
    setPage,
    setSize,
    setSort,
  }
}

export interface QueryParam {
  value: string
  set: (value: string) => void
}

/**
 * Filtre ve görünüm gibi tekil parametreler. Değişince sayfa başa döner —
 * daraltılan sonuçta eski sayfa numarası anlamsız.
 */
export function useQueryParam(name: string): QueryParam {
  const [searchParams] = useSearchParams()
  const update = useParamWriter()

  const set = useCallback(
    (value: string) => update({ [name]: value, page: null }),
    [update, name],
  )

  return { value: searchParams.get(name) ?? '', set }
}
