import type { ReactNode } from 'react'
import type { ApiError } from '../../api/client'
import { Breadcrumb } from '../../components/Breadcrumb'
import type { Crumb } from '../../components/Breadcrumb'
import { DescriptionList } from '../../components/DescriptionList'
import type { DescriptionItem } from '../../components/DescriptionList'
import { Empty } from '../../components/Empty'
import { ErrorBox } from '../../components/ErrorBox'
import { Loading } from '../../components/Loading'
import { PageHead } from '../../components/PageHead'
import { Panel } from '../../components/Panel'
import styles from './crud.module.css'

/**
 * Detay ekranlarının iskeleti: yol, başlık, özet alanları, altında ilişkili
 * kayıtlar. Özetin yükleniyor/boş/hata halleri burada karşılanıyor; ilişkili
 * kayıtlarınki `DataTable`'ın kendi işi.
 */

interface DetailLayoutProps {
  crumbs: Crumb[]
  title: string
  description?: string
  summaryTitle: string
  /** Veri gelmeden `null`. */
  summary: DescriptionItem[] | null
  loading: boolean
  error: ApiError | null
  onRetry: () => void
  /** İlişkili kayıtların bölümü. */
  children: ReactNode
}

export function DetailLayout({
  crumbs,
  title,
  description,
  summaryTitle,
  summary,
  loading,
  error,
  onRetry,
  children,
}: DetailLayoutProps) {
  function summaryBody(): ReactNode {
    if (error !== null) {
      return <ErrorBox error={error} onRetry={onRetry} />
    }
    if (summary !== null) {
      return <DescriptionList items={summary} />
    }
    return loading ? <Loading /> : <Empty title="Kayıt bulunamadı" />
  }

  return (
    <div className={styles.screen}>
      <Breadcrumb items={crumbs} />
      <PageHead title={title} description={description} />
      <Panel title={summaryTitle}>{summaryBody()}</Panel>
      {children}
    </div>
  )
}
