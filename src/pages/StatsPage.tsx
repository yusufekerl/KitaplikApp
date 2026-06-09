import { useEffect, useState, type ReactNode } from 'react'
import { useStatsStore } from '../store/statsStore'
import { exportApi } from '../lib/window'
import { useTranslation } from '../hooks/useTranslation'

const MONTH_NAMES = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function StatsPage() {
  const { stats, yearlyGoal, year, loading, fetchStats, fetchGoal, setGoal } = useStatsStore()
  const { lang } = useTranslation()
  const [goalInput, setGoalInput] = useState('')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  useEffect(() => {
    fetchStats()
    fetchGoal()
  }, [])

  useEffect(() => {
    if (yearlyGoal !== null) setGoalInput(String(yearlyGoal))
  }, [yearlyGoal])

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSaveGoal() {
    const n = parseInt(goalInput, 10)
    if (isNaN(n) || n < 1) return
    await setGoal(n)
    showToast(lang === 'tr' ? 'Hedef kaydedildi.' : 'Goal saved.', true)
  }

  async function handleExcel() {
    const result = await exportApi().toExcel()
    if (!result.ok) return showToast(result.error, false)
    if (result.data) showToast(lang === 'tr' ? `Kaydedildi: ${result.data}` : `Saved: ${result.data}`, true)
  }

  async function handleBackup() {
    const result = await exportApi().backup()
    if (!result.ok) return showToast(result.error, false)
    if (result.data) showToast(lang === 'tr' ? `Yedek alındı: ${result.data}` : `Backup saved: ${result.data}`, true)
  }

  const monthNames = lang === 'tr' ? MONTH_NAMES : MONTH_NAMES_EN

  const goalPercent =
    yearlyGoal && yearlyGoal > 0 && stats
      ? Math.min(100, Math.round(((stats.booksThisYear ?? 0) / yearlyGoal) * 100))
      : 0

  const maxMonthCount = stats
    ? Math.max(1, ...stats.monthlyBreakdown.map((m) => m.count))
    : 1

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {lang === 'tr' ? 'İstatistikler' : 'Statistics'} — {year}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {lang === 'tr' ? 'Okuma hedefi ve kitaplık istatistikleri' : 'Reading goal and library statistics'}
        </p>
      </div>

      {/* Yıllık Hedef */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          {lang === 'tr' ? 'Yıllık Okuma Hedefi' : 'Yearly Reading Goal'}
        </h2>

        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            placeholder={lang === 'tr' ? 'Hedef kitap sayısı' : 'Target book count'}
            className="w-36 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            onClick={handleSaveGoal}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            {lang === 'tr' ? 'Kaydet' : 'Save'}
          </button>
        </div>

        {yearlyGoal !== null && stats !== null && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{stats.booksThisYear} / {yearlyGoal} {lang === 'tr' ? 'kitap' : 'books'}</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{goalPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${goalPercent}%` }}
              />
            </div>
            {goalPercent >= 100 && (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                {lang === 'tr' ? 'Hedefe ulaştın!' : 'Goal reached!'}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Özet Kartlar */}
      {loading ? (
        <p className="text-sm text-gray-400">{lang === 'tr' ? 'Yükleniyor…' : 'Loading…'}</p>
      ) : stats && (
        <>
          <section>
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
              {lang === 'tr' ? 'Genel Bakış' : 'Overview'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard
                label={lang === 'tr' ? 'Toplam Kitap' : 'Total Books'}
                value={stats.totalBooks}
                color="text-gray-700 dark:text-gray-200"
              />
              <StatCard
                label={lang === 'tr' ? 'Okundu' : 'Read'}
                value={stats.readBooks}
                color="text-green-600 dark:text-green-400"
              />
              <StatCard
                label={lang === 'tr' ? 'Okunuyor' : 'Reading'}
                value={stats.readingBooks}
                color="text-blue-600 dark:text-blue-400"
              />
              <StatCard
                label={lang === 'tr' ? 'Bekliyor' : 'Unread'}
                value={stats.unreadBooks}
                color="text-gray-500 dark:text-gray-400"
              />
              <StatCard
                label={lang === 'tr' ? `${year} Yılında` : `Read in ${year}`}
                value={stats.booksThisYear}
                color="text-indigo-600 dark:text-indigo-400"
              />
              <StatCard
                label={lang === 'tr' ? `${year} Sayfası` : `Pages in ${year}`}
                value={stats.totalPagesRead.toLocaleString()}
                color="text-purple-600 dark:text-purple-400"
              />
            </div>
            {stats.topGenre && (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                {lang === 'tr'
                  ? `${year} yılında en çok okunan tür: `
                  : `Most read genre in ${year}: `}
                <span className="font-medium text-gray-700 dark:text-gray-300">{stats.topGenre}</span>
              </p>
            )}
          </section>

          {/* Aylık Dağılım */}
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
              {lang === 'tr' ? `${year} Aylık Dağılım` : `${year} Monthly Breakdown`}
            </h2>
            <div className="flex items-end gap-1.5 h-28">
              {stats.monthlyBreakdown.map((m) => {
                const pct = Math.round((m.count / maxMonthCount) * 100)
                return (
                  <div key={m.month} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{m.count > 0 ? m.count : ''}</span>
                    <div
                      className="w-full rounded-t-sm bg-indigo-400 dark:bg-indigo-500 transition-all duration-300 min-h-[2px]"
                      style={{ height: `${Math.max(2, pct)}%` }}
                      title={`${monthNames[m.month - 1]}: ${m.count}`}
                    />
                    <span className="text-xs text-gray-400 dark:text-gray-500">{monthNames[m.month - 1]}</span>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}

      {/* Araçlar */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
          {lang === 'tr' ? 'Araçlar' : 'Tools'}
        </h2>
        <div className="flex flex-wrap gap-3">
          <ToolButton
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            }
            label={lang === 'tr' ? 'Excel\'e Aktar' : 'Export to Excel'}
            description={lang === 'tr' ? 'Tüm kitapları .xlsx dosyasına aktar' : 'Export all books to .xlsx'}
            onClick={handleExcel}
            color="bg-green-600 hover:bg-green-700"
          />
          <ToolButton
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            }
            label={lang === 'tr' ? 'Yedek Al' : 'Backup Database'}
            description={lang === 'tr' ? 'Veritabanını .db dosyası olarak kaydet' : 'Save database as .db file'}
            onClick={handleBackup}
            color="bg-indigo-600 hover:bg-indigo-700"
          />
        </div>
      </section>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-sm text-white transition-opacity ${
            toast.ok ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

function ToolButton({
  icon, label, description, onClick, color,
}: {
  icon: ReactNode
  label: string
  description: string
  onClick: () => void
  color: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 px-4 py-3 rounded-lg text-white ${color} transition-colors text-left min-w-[180px]`}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs opacity-80 mt-0.5">{description}</span>
      </span>
    </button>
  )
}
