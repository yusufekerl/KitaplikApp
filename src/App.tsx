import { HashRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/Layout/Sidebar'
import { Library } from './pages/Library'
import { ReadingQueuePage } from './pages/ReadingQueuePage'
import { CategoriesPage } from './pages/CategoriesPage'

export default function App() {
  return (
    <HashRouter>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Routes>
            <Route path="/"          element={<Library />} />
            <Route path="/queue"     element={<ReadingQueuePage />} />
            <Route path="/categories" element={<CategoriesPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
