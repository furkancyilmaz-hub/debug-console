import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Finding } from '../../api/types'
import { FindingRow } from './FindingRow'
import { sortedFindings } from './reportView'
import styles from './report.module.css'

interface FindingListProps {
  findings: readonly Finding[]
  showAi: boolean
}

/** Açık bulgu adreste durur; paylaşılan bağlantı o bulguyu açık getirir. */
const OPEN_PARAM = 'finding'

/**
 * Bulgu listesi. `repeatCount` azalan sırada — en çok tekrar eden desen en
 * üstte, liste uzasa da ilk satır en ağır bulgu oluyor.
 *
 * Açık satır bileşen state'inde değil adreste: `?finding=<findingId>`.
 * `AnalysisHome` gezinirken `location.search`'ü koruduğu için `?from`/`?to`
 * ile çakışmıyor.
 */
export function FindingList({ findings, showAi }: FindingListProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const openId = searchParams.get(OPEN_PARAM)

  const rows = useMemo(() => sortedFindings(findings), [findings])

  const toggle = useCallback(
    (findingId: string): void => {
      const next = new URLSearchParams(searchParams)
      if (next.get(OPEN_PARAM) === findingId) {
        next.delete(OPEN_PARAM)
      } else {
        next.set(OPEN_PARAM, findingId)
      }
      // `replace`: akordeon açıp kapamak geçmişi doldurmasın, geri tuşu
      // analizden çıkmaya yarasın.
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  if (rows.length === 0) {
    return null
  }

  return (
    <div className={styles.findings}>
      {rows.map((finding) => (
        <FindingRow
          key={finding.findingId}
          finding={finding}
          open={finding.findingId === openId}
          showAi={showAi}
          onToggle={toggle}
        />
      ))}
    </div>
  )
}
