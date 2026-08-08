import type { SegmentItem } from '../../components/Segmented'

/**
 * Müşteri listesinin üç görünümü. Görünüm değişince şehir ve sayfa
 * parametreleri düşer: her görünüm kendi filtresiyle baştan açılır.
 */

export type CustomerView = 'list' | 'payments' | 'overview'

export const PAYMENTS_VIEW = 'payments'

/** `?view=` değerinden görünüm; tanınmayan değer düz listeye düşer. */
export function readCustomerView(value: string): CustomerView {
  return value === PAYMENTS_VIEW ? 'payments' : 'list'
}

export function customerSegments(active: CustomerView): readonly SegmentItem[] {
  return [
    { key: 'list', label: 'Liste', to: '/customers', active: active === 'list' },
    {
      key: 'payments',
      label: 'Ödeme özeti',
      to: `/customers?view=${PAYMENTS_VIEW}`,
      active: active === 'payments',
    },
    {
      key: 'overview',
      label: 'Genel bakış',
      to: '/customers/overview',
      active: active === 'overview',
    },
  ]
}
