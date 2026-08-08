import type { ReactNode } from 'react'
import { fieldId } from './field'
import styles from './FormField.module.css'

/**
 * Etiket + kontrol + alan bazlı hata. Hata metni kontrolün hemen altında durur
 * ve `aria-describedby` ile ona bağlanır.
 *
 * Kontrolün kendisi çağıranda kalıyor (input, select, textarea fark eder);
 * erişilebilirlik nitelikleri `fieldAria` ile alınır.
 */

interface FormFieldProps {
  field: string
  label: string
  error: string | null
  children: ReactNode
}

export function FormField({ field, label, error, children }: FormFieldProps) {
  const id = fieldId(field)

  return (
    <div className={styles.row}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children}
      {error !== null && (
        <p className={styles.error} id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
