import styles from './Spinner.module.css'

/** Yalnız dönen halka. Metinli hali için `<Loading/>` kullan. */
export function Spinner() {
  return <span className={styles.spinner} role="presentation" aria-hidden="true" />
}
