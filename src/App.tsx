import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { AnalysisProvider } from './features/analysis/AnalysisProvider'
import { AnalysisHome } from './features/analysis/AnalysisHome'
import { CrudHome } from './features/crud/CrudHome'
import styles from './App.module.css'

/**
 * Uygulama kabuğu.
 *
 * `AnalysisProvider` `<Routes>`'un üstünde duruyor: CRUD sekmesine geçince
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
            <h1>debug-console</h1>
            <span className={styles.brandHint}>hedef servis · analiz ajanı</span>
          </div>
          <nav className={styles.nav}>
            <NavLink to="/crud" className={tabClass}>
              CRUD
            </NavLink>
            <NavLink to="/analysis" className={tabClass}>
              Analiz
            </NavLink>
          </nav>
        </header>

        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<Navigate to="/crud" replace />} />
            <Route path="/crud" element={<CrudHome />} />
            <Route path="/analysis" element={<AnalysisHome />} />
            <Route path="/analysis/:analysisId" element={<AnalysisHome />} />
            <Route path="*" element={<Navigate to="/crud" replace />} />
          </Routes>
        </main>
      </div>
    </AnalysisProvider>
  )
}
