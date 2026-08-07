import styles from './Skeleton.module.css'

interface SkeletonProps {
  lines?: number
}

/** Yerleşimi bozmadan bekleten gri satırlar. */
export function Skeleton({ lines = 3 }: SkeletonProps) {
  // Satırların kimliği sabit; index değil, üretilmiş bir anahtar kullanılıyor.
  const keys = Array.from({ length: lines }, (_, position) => `skeleton-line-${position}`)

  return (
    <div className={styles.stack} aria-hidden="true">
      {keys.map((key, position) => (
        <div
          key={key}
          className={styles.line}
          style={{ width: position === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}
