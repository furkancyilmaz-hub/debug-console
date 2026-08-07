import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { AnalysisProvider } from './features/analysis/AnalysisProvider'
import { AnalysisHome } from './features/analysis/AnalysisHome'
import { CustomersPage } from './features/crud/CustomersPage'
import { ProposalsPage } from './features/crud/ProposalsPage'
import styles from './App.module.css'

/**
 * Uygulama kabuğu.
 *
 * `AnalysisProvider` `<Routes>`'un üstünde duruyor: CRUD ekranlarına geçince
 * `AnalysisHome` sökülür ama analiz durumu ve SSE bağlantısı ayakta kalır.
 */

function tabClass({ isActive }: { isActive: boolean }): string {
  return isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab
}

export default function App() {
  return (
    <AnalysisProvider>
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
          <Routes>
            <Route path="/" element={<Navigate to="/proposals" replace />} />
            <Route path="/proposals" element={<ProposalsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/analysis" element={<AnalysisHome />} />
            <Route path="/analysis/:analysisId" element={<AnalysisHome />} />
            <Route path="*" element={<Navigate to="/proposals" replace />} />
          </Routes>
        </main>
      </div>
    </AnalysisProvider>
  )
}
