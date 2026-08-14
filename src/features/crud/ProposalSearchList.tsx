import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../../components/Badge'
import { DataTable } from '../../components/DataTable'
import type { Column, PageInfo, SortState } from '../../components/table'
import { isNotFound } from '../../api/client'
import { listProposals, searchProposalByNo } from '../../api/demoApi'
import type { ProposalResponse } from '../../api/types'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useResource } from '../../hooks/useResource'
import { useListParams, useQueryParam } from './listParams'
import { formatMoney } from './format'
import { PROPOSAL_STATUS_LABEL, PROPOSAL_STATUS_TONE } from './status'
import styles from './crud.module.css'

/**
 * Teklif listesi ve teklif numarasına göre arama. Sayfalama, sıralama ve veri
 * tamamen sunucudan gelir.
 *
 * Arama ucu tek teklif döner ve sayfalanmaz: teklif numarası tekil. İki cevap
 * biçimi burada tek şekle indiriliyor, böylece `DataTable` farkı bilmiyor —
 * arama sonucunda `page` boş kalıyor ve sayfalama şeridi kendiliğinden
 * çizilmiyor.
 */

const DEFAULT_SORT: SortState = { key: 'issueDate', direction: 'desc' }
const SEARCH_DELAY_MS = 300

// Kolonlar ekranın kendi bilgisi; `DataTable` bunları tanımıyor.
const COLUMNS: readonly Column<ProposalResponse>[] = [
  {
    key: 'proposalNo',
    header: 'Teklif no',
    sortable: true,
    render: (row) => <code>{row.proposalNo}</code>,
  },
  {
    key: 'status',
    header: 'Durum',
    sortable: true,
    width: '10rem',
    render: (row) => (
      <Badge tone={PROPOSAL_STATUS_TONE[row.status]}>{PROPOSAL_STATUS_LABEL[row.status]}</Badge>
    ),
  },
  {
    key: 'issueDate',
    header: 'Düzenleme',
    sortable: true,
    width: '10rem',
    render: (row) => <code>{row.issueDate}</code>,
  },
  {
    key: 'totalPremium',
    header: 'Prim',
    sortable: true,
    align: 'right',
    width: '11rem',
    render: (row) => formatMoney(row.totalPremium),
  },
]

/** Liste ile aramanın ortak şekli. Arama sonucunda sayfa bilgisi yok. */
interface ProposalRows {
  rows: readonly ProposalResponse[]
  page: PageInfo | null
}

export function ProposalSearchList() {
  const navigate = useNavigate()
  const { page, size, sort, sortParam, setPage, setSize, setSort } = useListParams(DEFAULT_SORT)
  const proposalNo = useQueryParam('proposalNo')

  const [input, setInput] = useState(proposalNo.value)
  const search = useDebouncedValue(input, SEARCH_DELAY_MS).trim()

  // Adres anında güncellenir (paylaşılabilir kalsın), istek geciktirilir.
  function handleSearchChange(value: string) {
    setInput(value)
    proposalNo.set(value)
  }

  const { state, reload } = useResource<ProposalRows>(
    async (signal) => {
      if (search === '') {
        const listed = await listProposals({ page, size, sort: sortParam }, signal)
        return { rows: listed.data.content, page: listed.data }
      }
      try {
        const found = await searchProposalByNo(search, signal)
        return { rows: [found.data], page: null }
      } catch (error) {
        // Bulunamayan teklif arıza değil, boş sonuç: hata kutusu yerine
        // tablonun kendi "kayıt yok" durumu gösterilsin.
        if (isNotFound(error)) {
          return { rows: [], page: null }
        }
        throw error
      }
    },
    [page, size, sortParam, search],
  )

  return (
    <>
      <div className={styles.bar}>
        <label className={styles.search}>
          <span className={styles.label}>Teklif no</span>
          <input
            type="search"
            value={input}
            placeholder="Teklif numarasına göre ara"
            onChange={(event) => handleSearchChange(event.target.value)}
          />
        </label>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={state.data?.rows ?? []}
        rowKey={(row) => row.id}
        caption="Teklifler"
        loading={state.status === 'loading'}
        error={state.error}
        onRetry={reload}
        emptyTitle={search === '' ? 'Teklif yok' : 'Teklif bulunamadı'}
        emptyHint={
          search === ''
            ? 'Bu sayfada gösterilecek kayıt bulunmuyor.'
            : 'Bu numarada bir teklif yok. Numarayı kontrol edin.'
        }
        onRowClick={(row) => navigate(`/proposals/${row.id}`)}
        sort={sort}
        onSortChange={setSort}
        page={state.data?.page ?? null}
        onPageChange={setPage}
        onSizeChange={setSize}
      />
    </>
  )
}
