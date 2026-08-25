import { useNavigate } from 'react-router-dom'
import { DataTable } from '../../components/DataTable'
import type { SortState } from '../../components/table'
import { listCustomers, searchCustomersByCity } from '../../api/demoApi'
import { useResource } from '../../hooks/useResource'
import { CriteriaBar } from './CriteriaBar'
import { CUSTOMER_COLUMNS } from './customerColumns'
import { useCriteria, useListParams } from './listParams'
import styles from './crud.module.css'

/**
 * Şehre göre aranabilen düz müşteri listesi. Kutuya yazmak istek doğurmuyor:
 * şehir "Sorgula" ile uygulanıyor, o anda adres çubuğuna yazılıyor ve isteğe
 * giriyor. Adres böylece hep ekrandaki sonucun kriterini taşıyor.
 *
 * Arama ucunun ikinci modu (`proposalId` + `identityNo`) burada değil teklif
 * detayında: o mod bir teklife bağlı, bu ekranda ise ortada bir teklif yok.
 */

const DEFAULT_SORT: SortState = { key: 'fullName', direction: 'asc' }
const FIELDS = ['city'] as const

export function CustomerSearchList() {
  const navigate = useNavigate()
  const { page, size, sort, sortParam, setPage, setSize, setSort } = useListParams(DEFAULT_SORT)
  const criteria = useCriteria(FIELDS)
  const city = criteria.applied.city

  const { state, reload } = useResource(
    async (signal) => {
      const params = { page, size, sort: sortParam }
      const result =
        city === ''
          ? await listCustomers(params, signal)
          : await searchCustomersByCity(city, params, signal)
      return result.data
    },
    [page, size, sortParam, city],
  )

  const total = state.data?.totalElements

  return (
    <>
      <CriteriaBar pending={criteria.pending} onSubmit={criteria.submit}>
        <label className={styles.search}>
          <span className={styles.label}>Şehir</span>
          <input
            type="search"
            value={criteria.draft.city}
            placeholder="Şehre göre ara"
            onChange={(event) => criteria.set('city', event.target.value)}
          />
        </label>
        {city !== '' && total !== undefined && <span className={styles.label}>{total} sonuç</span>}
      </CriteriaBar>

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
