import { useNavigate } from 'react-router-dom'
import { DataTable } from '../../components/DataTable'
import type { PageInfo, SortState } from '../../components/table'
import { isNotFound } from '../../api/client'
import { listProposals, searchProposalByNo } from '../../api/demoApi'
import type { ProposalResponse } from '../../api/types'
import { useResource } from '../../hooks/useResource'
import { CriteriaBar } from './CriteriaBar'
import { IssueDateFilter } from './IssueDateFilter'
import { ISSUE_DATE_FIELDS, appliedIssueDateRange, emptyRangeHint } from './issueDateRange'
import { useCriteria, useListParams } from './listParams'
import { PROPOSAL_COLUMNS } from './proposalColumns'
import styles from './crud.module.css'

/**
 * Teklif listesi, düzenleme tarihi süzgeci ve teklif numarasına göre arama.
 * Sayfalama, sıralama ve veri tamamen sunucudan gelir.
 *
 * Üç kriter tek "Sorgula" ile uygulanıyor: adres tek seferde yazıldığı için ara
 * bir istek doğmuyor. Sayfa, boyut ve sıralama düğmenin dışında kalıyor.
 *
 * Arama ucu tek teklif döner ve sayfalanmaz: teklif numarası tekil. İki cevap
 * biçimi burada tek şekle indiriliyor, böylece `DataTable` farkı bilmiyor —
 * arama sonucunda `page` boş kalıyor ve sayfalama şeridi kendiliğinden
 * çizilmiyor.
 *
 * İki süzgeç birlikte çalışmıyor: `/api/proposals/search` yalnızca `proposalNo`
 * kabul ediyor, tarih parametresi almıyor. Arama kutusuna yazıldığı anda tarih
 * kutuları pasifleşiyor ve tarihler isteğe hiç girmiyor — geçersiz bileşim
 * gönderilmiyor. Pasiflik uygulanana değil **taslağa** bakıyor: kutu ilk tuşta
 * pasifleşsin, sorgulandığında değil. Adresteki aralık **silinmiyor**; kutu
 * boşalınca geri geliyor.
 */

const DEFAULT_SORT: SortState = { key: 'issueDate', direction: 'desc' }
const FIELDS = ['proposalNo', ...ISSUE_DATE_FIELDS] as const

/** Liste ile aramanın ortak şekli. Arama sonucunda sayfa bilgisi yok. */
interface ProposalRows {
  rows: readonly ProposalResponse[]
  page: PageInfo | null
}

export function ProposalSearchList() {
  const navigate = useNavigate()
  const { page, size, sort, sortParam, setPage, setSize, setSort } = useListParams(DEFAULT_SORT)
  const criteria = useCriteria(FIELDS)
  const search = criteria.applied.proposalNo
  const range = appliedIssueDateRange(criteria.applied)

  const searching = criteria.draft.proposalNo !== ''

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
      <CriteriaBar pending={criteria.pending} onSubmit={criteria.submit}>
        <label className={styles.search}>
          <span className={styles.label}>Teklif no</span>
          <input
            type="search"
            value={criteria.draft.proposalNo}
            placeholder="Teklif numarasına göre ara"
            onChange={(event) => criteria.set('proposalNo', event.target.value)}
          />
        </label>
        <IssueDateFilter values={criteria.draft} set={criteria.set} disabled={searching} />
      </CriteriaBar>

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
