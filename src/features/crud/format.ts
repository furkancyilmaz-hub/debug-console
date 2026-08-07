/** Ekranlarda tekrarlanan biçimlendirmeler. Formatter bir kez kuruluyor. */

const MONEY = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatMoney(value: number): string {
  return `${MONEY.format(value)} ₺`
}
