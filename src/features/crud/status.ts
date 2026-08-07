import type { BadgeTone } from '../../components/Badge'
import type { CustomerStatus, ProposalStatus } from '../../api/types'

/**
 * Durum kodlarının ekrandaki karşılığı. Etiket ve renk tek yerde; iki ekran
 * aynı duruma farklı isim vermesin.
 */

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  DRAFT: 'Taslak',
  APPROVED: 'Onaylı',
  REJECTED: 'Reddedildi',
}

export const PROPOSAL_STATUS_TONE: Record<ProposalStatus, BadgeTone> = {
  DRAFT: 'neutral',
  APPROVED: 'ok',
  REJECTED: 'warn',
}

export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  ACTIVE: 'Aktif',
  PASSIVE: 'Pasif',
}

export const CUSTOMER_STATUS_TONE: Record<CustomerStatus, BadgeTone> = {
  ACTIVE: 'ok',
  PASSIVE: 'neutral',
}
