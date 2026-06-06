import type { SqlJsDatabase as Database } from '../SqlJsDatabase'

export interface ReadingQueueItem {
  id: number
  book_id: number
  position: number
  added_at: string
  title: string
  author_name: string
  reading_status: 'read' | 'reading' | 'unread'
  category_color: string | null
  category_name: string | null
}

export function getAllQueue(db: Database.Database): ReadingQueueItem[] {
  return db.prepare(`
    SELECT
      q.id, q.book_id, q.position, q.added_at,
      b.title, b.reading_status,
      a.name AS author_name,
      c.color AS category_color,
      c.name  AS category_name
    FROM reading_queue q
    JOIN books b ON q.book_id = b.id
    JOIN authors a ON b.author_id = a.id
    LEFT JOIN categories c ON b.category_id = c.id
    ORDER BY q.position ASC
  `).all() as ReadingQueueItem[]
}

export function addToQueue(db: Database.Database, bookId: number): void {
  const row = db
    .prepare('SELECT COALESCE(MAX(position), 0) as max FROM reading_queue')
    .get() as { max: number }
  db.prepare('INSERT INTO reading_queue (book_id, position) VALUES (?, ?)').run(bookId, row.max + 1)
}

export function removeFromQueue(db: Database.Database, bookId: number): void {
  db.prepare('DELETE FROM reading_queue WHERE book_id = ?').run(bookId)
  const remaining = db.prepare('SELECT id FROM reading_queue ORDER BY position ASC').all() as { id: number }[]
  const update = db.prepare('UPDATE reading_queue SET position = ? WHERE id = ?')
  const reorder = db.transaction(() => {
    remaining.forEach((row, i) => update.run(i + 1, row.id))
  })
  reorder()
}

export function reorderQueue(db: Database.Database, orderedBookIds: number[]): void {
  const update = db.prepare('UPDATE reading_queue SET position = ? WHERE book_id = ?')
  const reorder = db.transaction((ids: number[]) => {
    ids.forEach((bookId, index) => update.run(index + 1, bookId))
  })
  reorder(orderedBookIds)
}

export function isInQueue(db: Database.Database, bookId: number): boolean {
  const row = db
    .prepare('SELECT 1 FROM reading_queue WHERE book_id = ?')
    .get(bookId)
  return row !== undefined
}
