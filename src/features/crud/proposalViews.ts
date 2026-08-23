import type { SegmentItem } from '../../components/Segmented'
import type { IssueDateRange } from './issueDateRange'

/**
 * Teklif listesinin iki görünümü. Görünüm değişince arama parametresi düşer:
 * her görünüm kendi filtresiyle baştan açılır (`customerViews.ts` ile aynı kural).
 *
 * Tarih aralığı bu kuralın **istisnası**. `proposalNo` yalnızca düz listede
 * anlamlı, ama düzenleme tarihi süzgecini iki uç da kabul ediyor
 * (`contract.md` §2b) ve aynı aralığı iki görünümde karşılaştırmak ölçüm
 * akışının kendisi: aynı satır kümesi, farklı sorgu sayısı. Aralık taşınmasa
 * kullanıcı her geçişte yeniden yazardı.
 */

export type ProposalView = 'list' | 'customers'

export const CUSTOMERS_VIEW = 'customers'

/** `?view=` değerinden görünüm; tanınmayan değer düz listeye düşer. */
export function readProposalView(value: string): ProposalView {
  return value === CUSTOMERS_VIEW ? 'customers' : 'list'
}

function segmentPath(view: ProposalView, range: IssueDateRange): string {
  const query = new URLSearchParams()
  if (view === 'customers') {
    query.set('view', CUSTOMERS_VIEW)
  }
  if (range.from !== '') {
    query.set('issueDateFrom', range.from)
  }
  if (range.to !== '') {
    query.set('issueDateTo', range.to)
  }
  const search = query.toString()
  return search === '' ? '/proposals' : `/proposals?${search}`
}

export function proposalSegments(
  active: ProposalView,
  range: IssueDateRange,
): readonly SegmentItem[] {
  return [
    { key: 'list', label: 'Liste', to: segmentPath('list', range), active: active === 'list' },
    {
      key: 'customers',
      label: 'Müşterili',
      to: segmentPath('customers', range),
      active: active === 'customers',
    },
  ]
}
