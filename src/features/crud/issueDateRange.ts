import type { LocalDate } from '../../api/types'
import type { CriteriaValues } from './criteriaDraft'

/**
 * Teklif listelerinin düzenleme tarihi süzgeci (`contract.md` §2b). İki uç da
 * `/api/proposals` ve `/api/proposals/detail` tarafından kabul ediliyor; ikisi
 * opsiyonel ve birbirinden bağımsız, verilmeyen uç sınırsız sayılıyor, sınırlar
 * dahil.
 *
 * Süzgecin durumu kriterlerle birlikte `useCriteria`'da; burada yalnızca
 * uygulanmış değerin doğrulaması ve boş durum metni var. Doğrulama taslağa
 * değil uygulanana bakıyor: kullanıcı kutuyu doldururken değil, "Sorgula"
 * dedikten sonra anlamlı.
 */

export const ISSUE_DATE_FIELDS = ['issueDateFrom', 'issueDateTo'] as const

export type IssueDateField = (typeof ISSUE_DATE_FIELDS)[number]

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Adres çubuğundan gelen değer. Bozuk olan sessizce düşer — `listParams.ts`'teki
 * `parseSort`, `readPage` ve `readSize` ile aynı kural. Paylaşılan ya da elle
 * düzenlenmiş bozuk bir bağlantı böylece süzgeçsiz listeyi açıyor; ham hâliyle
 * gönderilse uç `400` döndürürdü.
 *
 * Biçim tek başına yetmiyor: `2025-02-30` kalıba uyuyor ama takvimde yok ve
 * `Date` onu sessizce 2 Mart'a kaydırıyor. Gidiş-dönüş karşılaştırması bunu yakalar.
 */
function readLocalDate(value: string): LocalDate {
  if (!ISO_DATE.test(value)) {
    return ''
  }
  const parsed = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    return ''
  }
  return value
}

export interface IssueDateRange {
  /** Doğrulanmış değer; uygulanan aralık bozuksa boş. */
  from: LocalDate
  to: LocalDate
  /** İkisi de dolu ve başlangıç bitişten sonra. Sözleşmede boş sonuç, hata değil. */
  reversed: boolean
  /** En az bir uç verilmiş. */
  active: boolean
}

/** Uygulanmış kriterlerden isteğe gidecek aralık. */
export function appliedIssueDateRange(
  applied: CriteriaValues<IssueDateField>,
): IssueDateRange {
  const from = readLocalDate(applied.issueDateFrom)
  const to = readLocalDate(applied.issueDateTo)

  return {
    from,
    to,
    // `LocalDate` sıfır dolgulu olduğu için dize sırası takvim sırasıyla aynı.
    reversed: from !== '' && to !== '' && from > to,
    active: from !== '' || to !== '',
  }
}

/**
 * Tablonun boş durum açıklaması. Ters aralık ayrı bir cümle hak ediyor: sonuç
 * kümesi gerçekten boş, kullanıcının aralığı genişletmesi işe yaramaz.
 */
export function emptyRangeHint(range: IssueDateRange, fallback: string): string {
  if (range.reversed) {
    return 'Başlangıç bitişten sonra; bu aralık boş kalıyor.'
  }
  if (range.active) {
    return 'Bu tarih aralığında teklif yok. Aralığı genişletin.'
  }
  return fallback
}
