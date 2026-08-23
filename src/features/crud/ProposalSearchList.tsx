import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '../../components/DataTable'
import type { PageInfo, SortState } from '../../components/table'
import { isNotFound } from '../../api/client'
import { listProposals, searchProposalByNo } from '../../api/demoApi'
import type { ProposalResponse } from '../../api/types'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useResource } from '../../hooks/useResource'
import { IssueDateFilter } from './IssueDateFilter'
import { emptyRangeHint, useIssueDateRange } from './issueDateRange'
import { useListParams, useQueryParam } from './listParams'
import { PROPOSAL_COLUMNS } from './proposalColumns'
import styles from './crud.module.css'

/**
 * Teklif listesi, düzenleme tarihi süzgeci ve teklif numarasına göre arama.
 * Sayfalama, sıralama ve veri tamamen sunucudan gelir.
 *
 * Arama ucu tek teklif döner ve sayfalanmaz: teklif numarası tekil. İki cevap
 * biçimi burada tek şekle indiriliyor, böylece `DataTable` farkı bilmiyor —
 * arama sonucunda `page` boş kalıyor ve sayfalama şeridi kendiliğinden
 * çizilmiyor.
 *
 * İki süzgeç birlikte çalışmıyor: `/api/proposals/search` yalnızca `proposalNo`
 * kabul ediyor, tarih parametresi almıyor. Arama kutusuna yazıldığı anda tarih
 * kutuları pasifleşiyor ve tarihler isteğe hiç girmiyor — geçersiz bileşim
 * gönderilmiyor. Adresteki aralık **silinmiyor**; kutu boşalınca geri geliyor.
 */

const DEFAULT_SORT: SortState = { key: 'issueDate', direction: 'desc' }
const SEARCH_DELAY_MS = 300

/** Liste ile aramanın ortak şekli. Arama sonucunda sayfa bilgisi yok. */
interface ProposalRows {
  rows: readonly ProposalResponse[]
  page: PageInfo | null
}

export function ProposalSearchList() {
  const navigate = useNavigate()
  const { page, size, sort, sortParam, setPage, setSize, setSort } = useListParams(DEFAULT_SORT)
  const proposalNo = useQueryParam('proposalNo')
  const range = useIssueDateRange()

  const [input, setInput] = useState(proposalNo.value)
  const search = useDebouncedValue(input, SEARCH_DELAY_MS).trim()

  // Adres anında güncellenir (paylaşılabilir kalsın), istek geciktirilir.
  function handleSearchChange(value: string) {
    setInput(value)
    proposalNo.set(value)
  }

  // Pasiflik geciktirilmiş değere değil ham girdiye bakıyor: kutu ilk tuşta
  // pasifleşsin, 300 ms sonra değil.
  const searching = input !== ''

  const { state, reload } = useResource<ProposalRows>(
    async (signal) => {
      if (search === '') {
        const listed = await listProposals(
          { page, size, sort: sortParam, issueDateFrom: range.from, issueDateTo: range.to },
          signal,
        )
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
    [page, size, sortParam, search, range.from, range.to],
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
        <IssueDateFilter range={range} disabled={searching} />
      </div>

      {searching && (
        <p className={styles.hint}>Teklif numarasıyla ararken tarih aralığı uygulanmaz.</p>
      )}

      <DataTable
        columns={PROPOSAL_COLUMNS}
        rows={state.data?.rows ?? []}
        rowKey={(row) => row.id}
        caption="Teklifler"
        loading={state.status === 'loading'}
        error={state.error}
        onRetry={reload}
        emptyTitle={search === '' ? 'Teklif yok' : 'Teklif bulunamadı'}
        emptyHint={
          search === ''
            ? emptyRangeHint(range, 'Bu sayfada gösterilecek kayıt bulunmuyor.')
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
