import type { SegmentItem } from '../../components/Segmented'

/**
 * Teklif listesinin iki görünümü. Görünüm değişince arama parametresi düşer:
 * her görünüm kendi filtresiyle baştan açılır (`customerViews.ts` ile aynı kural).
 */

export type ProposalView = 'list' | 'customers'

export const CUSTOMERS_VIEW = 'customers'

/** `?view=` değerinden görünüm; tanınmayan değer düz listeye düşer. */
export function readProposalView(value: string): ProposalView {
  return value === CUSTOMERS_VIEW ? 'customers' : 'list'
}

export function proposalSegments(active: ProposalView): readonly SegmentItem[] {
  return [
    { key: 'list', label: 'Liste', to: '/proposals', active: active === 'list' },
    {
      key: 'customers',
      label: 'Müşterili',
      to: `/proposals?view=${CUSTOMERS_VIEW}`,
      active: active === 'customers',
    },
  ]
}
