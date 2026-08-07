import {
  listCustomerDetail,
  listCustomerOverview,
  listCustomers,
  listPayments,
  listProposals,
} from '../../api/demoApi'
import type { Page, PageParams, RequestResult } from '../../api/types'

/**
 * Hedef servisin liste uçları. Sıra ve adlandırma **tarafsız**: hangisinin nasıl
 * yüklediği burada yazmaz. Bunu ortaya çıkarmak raporun işi.
 */

/** Ekranda gösterilecek sadeleşmiş satır. Tablo bileşeni sonraki göreve ait. */
export interface DisplayRow {
  id: number
  primary: string
  secondary: string
}

export interface EndpointResult {
  /** Ham sonuç; denetçi ve JSON görünümü bunu kullanır. */
  result: RequestResult<Page<unknown>>
  rows: DisplayRow[]
}

export interface EndpointDef {
  id: string
  label: string
  method: string
  path: string
  load: (params: PageParams, signal: AbortSignal) => Promise<EndpointResult>
}

export const ENDPOINTS: readonly EndpointDef[] = [
  {
    id: 'customers',
    label: 'Müşteriler',
    method: 'GET',
    path: '/api/customers',
    load: async (params, signal) => {
      const result = await listCustomers(params, signal)
      return {
        result,
        rows: result.data.content.map((customer) => ({
          id: customer.id,
          primary: customer.fullName,
          secondary: `${customer.city} · ${customer.status}`,
        })),
      }
    },
  },
  {
    id: 'customers-detail',
    label: 'Müşteriler — detay',
    method: 'GET',
    path: '/api/customers/detail',
    load: async (params, signal) => {
      const result = await listCustomerDetail(params, signal)
      return {
        result,
        rows: result.data.content.map((customer) => ({
          id: customer.id,
          primary: customer.fullName,
          secondary: `${customer.payments.length} ödeme`,
        })),
      }
    },
  },
  {
    id: 'customers-overview',
    label: 'Müşteriler — genel bakış',
    method: 'GET',
    path: '/api/customers/overview',
    load: async (params, signal) => {
      const result = await listCustomerOverview(params, signal)
      return {
        result,
        rows: result.data.content.map((customer) => ({
          id: customer.id,
          primary: customer.fullName,
          secondary: `${customer.payments.length} ödeme`,
        })),
      }
    },
  },
  {
    id: 'proposals',
    label: 'Teklifler',
    method: 'GET',
    path: '/api/proposals',
    load: async (params, signal) => {
      const result = await listProposals(params, signal)
      return {
        result,
        rows: result.data.content.map((proposal) => ({
          id: proposal.id,
          primary: proposal.proposalNo,
          secondary: `${proposal.status} · ${proposal.totalPremium}`,
        })),
      }
    },
  },
  {
    id: 'payments',
    label: 'Ödemeler',
    method: 'GET',
    path: '/api/payments',
    load: async (params, signal) => {
      const result = await listPayments(params, signal)
      return {
        result,
        rows: result.data.content.map((payment) => ({
          id: payment.id,
          primary: `${payment.amount}`,
          secondary: `${payment.dueDate} · ${payment.status}`,
        })),
      }
    },
  },
]

export function findEndpoint(id: string | null): EndpointDef {
  return ENDPOINTS.find((endpoint) => endpoint.id === id) ?? ENDPOINTS[0]
}
