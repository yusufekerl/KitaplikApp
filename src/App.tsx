import { HashRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/Layout/Sidebar'
import { Library } from './pages/Library'
import { ReadingQueuePage } from './pages/ReadingQueuePage'
import { CategoriesPage } from './pages/CategoriesPage'
import { useSettingsStore } from './store/settingsStore'

export default function App() {
  const { theme } = useSettingsStore()

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <HashRouter>
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <Routes>
              <Route path="/"           element={<Library />} />
              <Route path="/queue"      element={<ReadingQueuePage />} />
              <Route path="/categories" element={<CategoriesPage />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </div>
  )
}
