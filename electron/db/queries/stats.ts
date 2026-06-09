import type { SqlJsDatabase as Database } from '../SqlJsDatabase'

export interface Stats {
  totalBooks: number
  readBooks: number
  readingBooks: number
  unreadBooks: number
  booksThisYear: number
  totalPagesRead: number
  topGenre: string | null
  monthlyBreakdown: { month: number; count: number }[]
}

export function getStats(db: Database.Database, year: number): Stats {
  const yearStr = String(year)

  const statusRow = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN reading_status = 'read'    THEN 1 ELSE 0 END) AS read_count,
      SUM(CASE WHEN reading_status = 'reading' THEN 1 ELSE 0 END) AS reading_count,
      SUM(CASE WHEN reading_status = 'unread'  THEN 1 ELSE 0 END) AS unread_count
    FROM books
  `).get() as { total: number; read_count: number; reading_count: number; unread_count: number } | undefined

  const thisYearRow = db.prepare(`
    SELECT
      COUNT(*)      AS book_count,
      SUM(COALESCE(page_count, 0)) AS page_sum
    FROM books
    WHERE reading_date LIKE ?
  `).get(`${yearStr}%`) as { book_count: number; page_sum: number } | undefined

  const topGenreRow = db.prepare(`
    SELECT g.name, COUNT(*) AS cnt
    FROM books b
    JOIN genres g ON g.id = b.genre_id
    WHERE b.reading_date LIKE ?
    GROUP BY b.genre_id
    ORDER BY cnt DESC
    LIMIT 1
  `).get(`${yearStr}%`) as { name: string } | undefined

  const monthlyRaw = db.prepare(`
    SELECT CAST(strftime('%m', reading_date) AS INTEGER) AS month, COUNT(*) AS count
    FROM books
    WHERE reading_date LIKE ?
    GROUP BY month
    ORDER BY month
  `).all(`${yearStr}%`) as { month: number; count: number }[]

  const monthMap = new Map(monthlyRaw.map((r) => [r.month, r.count]))
  const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    count: monthMap.get(i + 1) ?? 0,
  }))

  return {
    totalBooks:    statusRow?.total        ?? 0,
    readBooks:     statusRow?.read_count   ?? 0,
    readingBooks:  statusRow?.reading_count ?? 0,
    unreadBooks:   statusRow?.unread_count ?? 0,
    booksThisYear: thisYearRow?.book_count ?? 0,
    totalPagesRead: thisYearRow?.page_sum  ?? 0,
    topGenre:      topGenreRow?.name       ?? null,
    monthlyBreakdown,
  }
}

export function getYearlyGoal(db: Database.Database, year: number): number | null {
  const row = db.prepare(`SELECT value FROM user_settings WHERE key = ?`).get(`yearly_goal_${year}`) as
    | { value: string }
    | undefined
  if (!row) return null
  const n = parseInt(row.value, 10)
  return isNaN(n) ? null : n
}

export function setYearlyGoal(db: Database.Database, year: number, goal: number): void {
  db.prepare(`INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)`).run(
    `yearly_goal_${year}`,
    String(goal),
  )
}
