import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { AnalysisProvider } from './features/analysis/AnalysisProvider'
import { AnalysisHome } from './features/analysis/AnalysisHome'
import { CustomerDetailPage } from './features/crud/CustomerDetailPage'
import { CustomersOverviewPage } from './features/crud/CustomersOverviewPage'
import { CustomersPage } from './features/crud/CustomersPage'
import { ProposalDetailPage } from './features/crud/ProposalDetailPage'
import { ProposalFormPage } from './features/crud/ProposalFormPage'
import { ProposalsPage } from './features/crud/ProposalsPage'
import { RequestInspector } from './features/crud/RequestInspector'
import { RequestLogProvider } from './features/crud/RequestLogProvider'
import styles from './App.module.css'

/**
 * Uygulama kabuğu.
 *
 * `AnalysisProvider` `<Routes>`'un üstünde duruyor: CRUD ekranlarına geçince
 * `AnalysisHome` sökülür ama analiz durumu ve SSE bağlantısı ayakta kalır.
 * `RequestLogProvider` de aynı sebeple burada: denetçi sekme değişince kaydını
 * kaybetmemeli.
 *
 * Kaydırma `<main>`'in içinde; denetçi dock'u alta sabit kalsın diye kabuk
 * yüksekliği viewport'a kilitli.
 */

function tabClass({ isActive }: { isActive: boolean }): string {
  return isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab
}

export default function App() {
  return (
    <AnalysisProvider>
      <RequestLogProvider>
        <div className={styles.app}>
          <header className={styles.topbar}>
            <div className={styles.brand}>
              <i className={styles.brandMark}>⬡</i>
              Poliçe Konsolu
            </div>
            <nav className={styles.nav}>
              <NavLink to="/proposals" className={tabClass}>
                Teklifler
              </NavLink>
              <NavLink to="/customers" className={tabClass}>
                Müşteriler
              </NavLink>
              <NavLink to="/analysis" className={tabClass}>
                Analiz
              </NavLink>
            </nav>
            <div className={styles.services}>
              <span className={styles.service}>hedef servis · analiz ajanı</span>
            </div>
          </header>

          <main className={styles.main}>
            <div className={styles.page}>
              <Routes>
                <Route path="/" element={<Navigate to="/proposals" replace />} />
                <Route path="/proposals" element={<ProposalsPage />} />
                {/* Statik segmentler `:id`'den önce; adres `/proposals/new` iken
                    detay ekranı açılmasın. */}
                <Route path="/proposals/new" element={<ProposalFormPage />} />
                <Route path="/proposals/:id" element={<ProposalDetailPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/customers/overview" element={<CustomersOverviewPage />} />
                <Route path="/customers/:id" element={<CustomerDetailPage />} />
                <Route path="/analysis" element={<AnalysisHome />} />
                <Route path="/analysis/:analysisId" element={<AnalysisHome />} />
                <Route path="*" element={<Navigate to="/proposals" replace />} />
              </Routes>
            </div>
          </main>

          <RequestInspector />
        </div>
      </RequestLogProvider>
    </AnalysisProvider>
  )
}
