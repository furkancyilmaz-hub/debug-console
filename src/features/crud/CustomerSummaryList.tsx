import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '../../components/DataTable'
import type { PageInfo, SortState } from '../../components/table'
import { isNotFound } from '../../api/client'
import { searchProposalByNo } from '../../api/demoApi'
import type { CustomerListParams } from '../../api/demoApi'
import type { CustomerResponse, Page, RequestResult } from '../../api/types'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useResource } from '../../hooks/useResource'
import { CUSTOMER_PAYMENT_COLUMNS } from './customerColumns'
import { useListParams, useQueryParam } from './listParams'
import styles from './crud.module.css'

/**
 * Ödeme bilgisiyle birlikte gelen müşteri listesi. Kaynağı çağıran belirler;
 * tablo iki görünümde de aynı.
 *
 * Teklife göre süzülebiliyor. Süzgeç burada, iki görünümün ortağı olan bu
 * bileşende: aynı teklif hem ödeme özetinde hem genel bakışta açılabiliyor,
 * satır sayısı ikisinde de aynı kalırken sorgu sayısı ayrışıyor.
 *
 * Kullanıcı teklif **numarası** yazıyor, liste ucu ise kimlik istiyor; numara
 * arama ucundan kimliğe çevriliyor. Adreste numara duruyor — paylaşılan bağlantı
 * insanın okuduğu değeri taşısın.
 */

const DEFAULT_SORT: SortState = { key: 'fullName', direction: 'asc' }
const SEARCH_DELAY_MS = 300

interface CustomerSummaryListProps {
  /** Modül düzeyinde tanımlı bir uç olmalı: kimliği her render'da değişmemeli. */
  load: (
    params: CustomerListParams,
    signal: AbortSignal,
  ) => Promise<RequestResult<Page<CustomerResponse>>>
  caption: string
}

/**
 * Süzgeçli ve süzgeçsiz sonucun ortak şekli. `page` yalnızca teklif
 * bulunamadığında `null`: o durumda sahte bir sayfa uydurmak yerine sayfalama
 * şeridi hiç çizilmiyor.
 */
interface CustomerRows {
  rows: readonly CustomerResponse[]
  page: PageInfo | null
}

export function CustomerSummaryList({ load, caption }: CustomerSummaryListProps) {
  const navigate = useNavigate()
  const { page, size, sort, sortParam, setPage, setSize, setSort } = useListParams(DEFAULT_SORT)
  const proposalNo = useQueryParam('proposalNo')

  // Girdinin kaynağı yerel state; adres çubuğundan tohumlanıyor. Doğrudan URL'e
  // bağlanırsa hızlı yazımda router'ın güncellemesi yetişmiyor ve kutu her tuşta
  // sıfırlanıyor.
  const [input, setInput] = useState(proposalNo.value)
  const search = useDebouncedValue(input, SEARCH_DELAY_MS).trim()

  // Adres anında güncellenir (paylaşılabilir kalsın), istek geciktirilir.
  function handleSearchChange(value: string) {
    setInput(value)
    proposalNo.set(value)
  }

  const { state, reload } = useResource<CustomerRows>(
    async (signal) => {
      const params = { page, size, sort: sortParam }

      if (search === '') {
        const listed = await load(params, signal)
        return { rows: listed.data.content, page: listed.data }
      }

      try {
        const proposal = await searchProposalByNo(search, signal)
        const filtered = await load({ ...params, proposalId: proposal.data.id }, signal)
        return { rows: filtered.data.content, page: filtered.data }
      } catch (error) {
        // Bulunamayan teklif arıza değil, boş sonuç: hata kutusu yerine tablonun
        // kendi "kayıt yok" durumu gösterilsin.
        if (isNotFound(error)) {
          return { rows: [], page: null }
        }
        throw error
      }
    },
    [load, page, size, sortParam, search],
  )

  // `page === null` yalnızca yukarıdaki 404 yolundan geliyor; müşterisi olmayan
  // bir teklifin sayfası dolu gelir, satırı olmaz. İki boş durum bu yüzden ayrışabiliyor.
  const proposalMissing = state.data?.page === null
  const total = state.data?.page?.totalElements

  return (
    <>
      <div className={styles.bar}>
        <label className={styles.search}>
          <span className={styles.label}>Teklif no</span>
          <input
            type="search"
            value={input}
            onChange={(event) => handleSearchChange(event.target.value)}
          />
        </label>
        {search !== '' && total !== undefined && (
          <span className={styles.label}>{total} sonuç</span>
        )}
      </div>

      <DataTable
        columns={CUSTOMER_PAYMENT_COLUMNS}
        rows={state.data?.rows ?? []}
        rowKey={(row) => row.id}
        caption={caption}
        loading={state.status === 'loading'}
        error={state.error}
        onRetry={reload}
        emptyTitle={proposalMissing ? 'Teklif bulunamadı' : 'Müşteri yok'}
        emptyHint={
          proposalMissing
            ? 'Bu numarada bir teklif yok. Numarayı kontrol edin.'
            : search === ''
              ? 'Bu sayfada gösterilecek kayıt bulunmuyor.'
              : 'Bu teklife bağlı müşteri bulunmuyor.'
        }
        onRowClick={(row) => navigate(`/customers/${row.id}`)}
        sort={sort}
        onSortChange={setSort}
        page={state.data?.page ?? null}
        onPageChange={setPage}
        onSizeChange={setSize}
      />
    </>
  )
}
