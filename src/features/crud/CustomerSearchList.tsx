import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '../../components/DataTable'
import type { SortState } from '../../components/table'
import { listCustomers, searchCustomersByCity } from '../../api/demoApi'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useResource } from '../../hooks/useResource'
import { CUSTOMER_COLUMNS } from './customerColumns'
import { useListParams, useQueryParam } from './listParams'
import styles from './crud.module.css'

/**
 * Şehre göre aranabilen düz müşteri listesi. Arama kutusu adres çubuğunu anında
 * günceller ama isteği bekletir: yazarken her tuşta sunucuya gidilmez.
 */

const DEFAULT_SORT: SortState = { key: 'fullName', direction: 'asc' }
const SEARCH_DELAY_MS = 300

export function CustomerSearchList() {
  const navigate = useNavigate()
  const { page, size, sort, sortParam, setPage, setSize, setSort } = useListParams(DEFAULT_SORT)
  const city = useQueryParam('city')

  // Girdinin kaynağı yerel state; adres çubuğundan tohumlanıyor. Doğrudan URL'e
  // bağlanırsa hızlı yazımda router'ın güncellemesi yetişmiyor ve kutu her
  // tuşta sıfırlanıyor.
  const [cityInput, setCityInput] = useState(city.value)
  const search = useDebouncedValue(cityInput, SEARCH_DELAY_MS)

  // Adres anında güncellenir (paylaşılabilir kalsın), istek geciktirilir.
  function handleCityChange(value: string) {
    setCityInput(value)
    city.set(value)
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
    <>
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
        columns={CUSTOMER_COLUMNS}
        rows={state.data?.content ?? []}
        rowKey={(row) => row.id}
        caption="Müşteriler"
        loading={state.status === 'loading'}
        error={state.error}
        onRetry={reload}
        emptyTitle="Müşteri yok"
        emptyHint="Farklı bir şehir deneyin."
        onRowClick={(row) => navigate(`/customers/${row.id}`)}
        sort={sort}
        onSortChange={setSort}
        page={state.data}
        onPageChange={setPage}
        onSizeChange={setSize}
      />
    </>
  )
}
