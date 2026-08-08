/**
 * `FormField`'in yanındaki yardımcılar. Ayrı dosyada duruyorlar: bileşen dosyası
 * yalnızca bileşen export etsin (`table.ts` ile aynı düzen).
 */

export interface FieldAria {
  id: string
  name: string
  'aria-invalid': boolean
  'aria-describedby': string | undefined
}

export function fieldId(field: string): string {
  return `field-${field}`
}

/** Kontrole yayılacak nitelikler; hata metniyle aynı kimlikleri üretir. */
export function fieldAria(field: string, error: string | null): FieldAria {
  const id = fieldId(field)
  return {
    id,
    name: field,
    'aria-invalid': error !== null,
    'aria-describedby': error === null ? undefined : `${id}-error`,
  }
}

/** Hatalı alana odaklanır; submit'te ilk hatayı göstermek için. */
export function focusField(field: string): void {
  document.getElementById(fieldId(field))?.focus()
}
