import { useState } from 'react'
import { Badge } from '../../components/Badge'
import { DataTable } from '../../components/DataTable'
import { PageHead } from '../../components/PageHead'
import type { Column, SortState } from '../../components/table'
import { listCustomers, searchCustomersByCity } from '../../api/demoApi'
import type { CustomerResponse } from '../../api/types'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useResource } from '../../hooks/useResource'
import { useListParams } from './listParams'
import { CUSTOMER_STATUS_LABEL, CUSTOMER_STATUS_TONE } from './status'
import styles from './crud.module.css'

/**
 * Müşteri listesi. Arama kutusu adres çubuğunu anında günceller ama isteği
 * beklet: yazarken her tuşta sunucuya gidilmez.
 */

const DEFAULT_SORT: SortState = { key: 'fullName', direction: 'asc' }
const SEARCH_DELAY_MS = 300

const COLUMNS: readonly Column<CustomerResponse>[] = [
  { key: 'fullName', header: 'Ad soyad', sortable: true, render: (row) => row.fullName },
  { key: 'city', header: 'Şehir', sortable: true, width: '14rem', render: (row) => row.city },
  {
    key: 'status',
    header: 'Durum',
    sortable: true,
    width: '10rem',
    render: (row) => (
      <Badge tone={CUSTOMER_STATUS_TONE[row.status]}>{CUSTOMER_STATUS_LABEL[row.status]}</Badge>
    ),
  },
]

export function CustomersPage() {
  const { page, size, sort, sortParam, city, setPage, setSize, setSort, setCity } =
    useListParams(DEFAULT_SORT)

  // Girdinin kaynağı yerel state; adres çubuğundan tohumlanıyor. Doğrudan URL'e
  // bağlanırsa hızlı yazımda router'ın güncellemesi yetişmiyor ve kutu her
  // tuşta sıfırlanıyor.
  const [cityInput, setCityInput] = useState(city)
  const search = useDebouncedValue(cityInput, SEARCH_DELAY_MS)

  // Adres anında güncellenir (paylaşılabilir kalsın), istek geciktirilir.
  function handleCityChange(value: string) {
    setCityInput(value)
    setCity(value)
  }

  const { state, reload } = useResource(
    async (signal) => {
      const params = { page, size, sort: sortParam }
      const result =
        search === ''
          ? await listCustomers(params, signal)
          : await searchCustomersByCity(search, params, signal)
      return result.data
    },
    [page, size, sortParam, search],
  )

  const total = state.data?.totalElements

  return (
    <div className={styles.screen}>
      <PageHead title="Müşteriler" description="Tekliflere bağlı sigortalılar" />

      <div className={styles.bar}>
        <label className={styles.search}>
          <span className={styles.label}>Şehir</span>
          <input
            type="search"
            value={cityInput}
            placeholder="Şehre göre ara"
            onChange={(event) => handleCityChange(event.target.value)}
          />
        </label>
        {cityInput !== '' && total !== undefined && (
          <span className={styles.label}>{total} sonuç</span>
        )}
      </div>

      <DataTable
        columns={COLUMNS}
        rows={state.data?.content ?? []}
        rowKey={(row) => row.id}
        caption="Müşteriler"
        loading={state.status === 'loading'}
        error={state.error}
        onRetry={reload}
        emptyTitle="Müşteri yok"
        emptyHint="Farklı bir şehir deneyin."
        sort={sort}
        onSortChange={setSort}
        page={state.data}
        onPageChange={setPage}
        onSizeChange={setSize}
      />
    </div>
  )
}
