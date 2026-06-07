import type { SqlJsDatabase as Database } from '../SqlJsDatabase'
import { findOrCreateLookup, cleanupLookupIfOrphan } from './lookups'
import { reindexQueuePositions } from './readingQueue'

export interface BookCategory {
  id: number
  name: string
  color: string
}

export interface BookWithRelations {
  id: number
  title: string
  author_id: number
  translator_id: number | null
  publisher_id: number | null
  genre_id: number | null
  edition_info: string | null
  page_count: number | null
  reading_status: 'read' | 'reading' | 'unread'
  purchase_date: string | null
  reading_date: string | null
  purchase_city: string | null
  description: string | null
  notes: string | null
  created_at: string
  updated_at: string
  author_name: string
  translator_name: string | null
  publisher_name: string | null
  genre_name: string | null
  categories: BookCategory[]
}

export interface BookFilters {
  search?: string
  categoryId?: number
  genreId?: number
  publisherId?: number
  translatorId?: number
  status?: 'read' | 'reading' | 'unread'
  sortBy?: 'title' | 'created_at' | 'purchase_date' | 'reading_date' | 'page_count' | 'author'
  sortDir?: 'asc' | 'desc'
}

export interface CreateBookInput {
  title: string
  authorName: string
  translatorName?: string | null
  publisherName?: string | null
  genreName?: string | null
  categoryIds?: number[]
  edition_info?: string | null
  page_count?: number | null
  reading_status: 'read' | 'reading' | 'unread'
  purchase_date?: string | null
  reading_date?: string | null
  purchase_city?: string | null
  description?: string | null
  notes?: string | null
}

const BASE_QUERY = `
  SELECT
    b.*,
    a.name  AS author_name,
    t.name  AS translator_name,
    p.name  AS publisher_name,
    g.name  AS genre_name
  FROM books b
  JOIN authors a ON b.author_id = a.id
  LEFT JOIN translators t ON b.translator_id = t.id
  LEFT JOIN publishers  p ON b.publisher_id  = p.id
  LEFT JOIN genres      g ON b.genre_id      = g.id
`

const SORT_MAP: Record<string, string> = {
  title:        'b.title COLLATE NOCASE',
  created_at:   'b.created_at',
  purchase_date:'b.purchase_date',
  reading_date: 'b.reading_date',
  page_count:   'b.page_count',
  author:       'a.name COLLATE NOCASE',
}

/** Verilen kitap satırlarına ait kategorileri tek seferde çekip her satıra ekler. */
function attachCategories<T extends { id: number }>(
  db: Database.Database,
  rows: T[]
): (T & { categories: BookCategory[] })[] {
  if (rows.length === 0) return []

  const placeholders = rows.map(() => '?').join(', ')
  const links = db.prepare(`
    SELECT bc.book_id, c.id, c.name, c.color
    FROM book_categories bc
    JOIN categories c ON c.id = bc.category_id
    WHERE bc.book_id IN (${placeholders})
    ORDER BY c.name COLLATE NOCASE ASC
  `).all(...rows.map((r) => r.id)) as { book_id: number; id: number; name: string; color: string }[]

  const byBook = new Map<number, BookCategory[]>()
  for (const link of links) {
    const list = byBook.get(link.book_id) ?? []
    list.push({ id: link.id, name: link.name, color: link.color })
    byBook.set(link.book_id, list)
  }

  return rows.map((row) => ({ ...row, categories: byBook.get(row.id) ?? [] }))
}

/** Bir kitabın kategori bağlantılarını verilen kümeyle değiştirir. */
function setBookCategories(db: Database.Database, bookId: number, categoryIds: number[]): void {
  const unique = [...new Set(categoryIds)]
  db.prepare('DELETE FROM book_categories WHERE book_id = ?').run(bookId)
  const insert = db.prepare('INSERT INTO book_categories (book_id, category_id) VALUES (?, ?)')
  for (const categoryId of unique) insert.run(bookId, categoryId)
}

export function getAllBooks(db: Database.Database, filters: BookFilters = {}): BookWithRelations[] {
  const conditions: string[] = ['1=1']
  const params: unknown[] = []

  if (filters.search) {
    conditions.push('(b.title LIKE ? OR a.name LIKE ?)')
    params.push(`%${filters.search}%`, `%${filters.search}%`)
  }
  if (filters.categoryId !== undefined && filters.categoryId !== null) {
    conditions.push('b.id IN (SELECT book_id FROM book_categories WHERE category_id = ?)')
    params.push(filters.categoryId)
  }
  if (filters.genreId !== undefined && filters.genreId !== null) {
    conditions.push('b.genre_id = ?')
    params.push(filters.genreId)
  }
  if (filters.publisherId !== undefined && filters.publisherId !== null) {
    conditions.push('b.publisher_id = ?')
    params.push(filters.publisherId)
  }
  if (filters.translatorId !== undefined && filters.translatorId !== null) {
    conditions.push('b.translator_id = ?')
    params.push(filters.translatorId)
  }
  if (filters.status) {
    conditions.push('b.reading_status = ?')
    params.push(filters.status)
  }

  const sortField = SORT_MAP[filters.sortBy || 'created_at'] ?? 'b.created_at'
  const sortDir   = filters.sortDir === 'asc' ? 'ASC' : 'DESC'

  const sql = `${BASE_QUERY} WHERE ${conditions.join(' AND ')} ORDER BY ${sortField} ${sortDir}`
  const rows = db.prepare(sql).all(...params) as Omit<BookWithRelations, 'categories'>[]
  return attachCategories(db, rows) as BookWithRelations[]
}

export function getBooksCount(db: Database.Database): number {
  const row = db.prepare('SELECT COUNT(*) AS count FROM books').get() as { count: number }
  return row.count
}

export function getBookById(db: Database.Database, id: number): BookWithRelations | undefined {
  const row = db.prepare(`${BASE_QUERY} WHERE b.id = ?`).get(id) as Omit<BookWithRelations, 'categories'> | undefined
  if (!row) return undefined
  return attachCategories(db, [row])[0] as BookWithRelations
}

export function createBook(db: Database.Database, data: CreateBookInput): BookWithRelations {
  const authorId     = findOrCreateLookup(db, 'authors', data.authorName)
  const translatorId = data.translatorName?.trim()
    ? findOrCreateLookup(db, 'translators', data.translatorName)
    : null
  const publisherId  = data.publisherName?.trim()
    ? findOrCreateLookup(db, 'publishers', data.publisherName)
    : null
  const genreId      = data.genreName?.trim()
    ? findOrCreateLookup(db, 'genres', data.genreName)
    : null

  const result = db.prepare(`
    INSERT INTO books (
      title, author_id, translator_id, publisher_id, genre_id,
      edition_info, page_count, reading_status,
      purchase_date, reading_date, purchase_city, description, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.title.trim(),
    authorId,
    translatorId,
    publisherId,
    genreId,
    data.edition_info?.trim() || null,
    data.page_count ?? null,
    data.reading_status,
    data.purchase_date || null,
    data.reading_date || null,
    data.purchase_city?.trim() || null,
    data.description?.trim() || null,
    data.notes?.trim() || null,
  )

  const bookId = result.lastInsertRowid as number
  setBookCategories(db, bookId, data.categoryIds ?? [])

  return getBookById(db, bookId)!
}

export function updateBook(
  db: Database.Database,
  id: number,
  data: Partial<CreateBookInput>
): BookWithRelations {
  const current = getBookById(db, id)
  if (!current) throw new Error(`Kitap bulunamadı: ${id}`)

  const authorId = data.authorName?.trim()
    ? findOrCreateLookup(db, 'authors', data.authorName)
    : current.author_id

  const translatorId = data.translatorName !== undefined
    ? (data.translatorName?.trim() ? findOrCreateLookup(db, 'translators', data.translatorName) : null)
    : current.translator_id

  const publisherId = data.publisherName !== undefined
    ? (data.publisherName?.trim() ? findOrCreateLookup(db, 'publishers', data.publisherName) : null)
    : current.publisher_id

  const genreId = data.genreName !== undefined
    ? (data.genreName?.trim() ? findOrCreateLookup(db, 'genres', data.genreName) : null)
    : current.genre_id

  db.prepare(`
    UPDATE books SET
      title = ?, author_id = ?, translator_id = ?, publisher_id = ?, genre_id = ?,
      edition_info = ?, page_count = ?, reading_status = ?,
      purchase_date = ?, reading_date = ?, purchase_city = ?, description = ?, notes = ?
    WHERE id = ?
  `).run(
    (data.title ?? current.title).trim(),
    authorId,
    translatorId,
    publisherId,
    genreId,
    data.edition_info !== undefined ? (data.edition_info?.trim() || null) : current.edition_info,
    data.page_count !== undefined ? (data.page_count ?? null) : current.page_count,
    data.reading_status ?? current.reading_status,
    data.purchase_date !== undefined ? (data.purchase_date || null) : current.purchase_date,
    data.reading_date !== undefined ? (data.reading_date || null) : current.reading_date,
    data.purchase_city !== undefined ? (data.purchase_city?.trim() || null) : current.purchase_city,
    data.description !== undefined ? (data.description?.trim() || null) : current.description,
    data.notes !== undefined ? (data.notes?.trim() || null) : current.notes,
    id,
  )

  if (data.categoryIds !== undefined) setBookCategories(db, id, data.categoryIds)

  // Artık kullanılmayan eski yazar/çevirmen/yayınevi/tür kayıtlarını temizle
  // (öneri listelerinde hayalet kalmasınlar diye)
  if (authorId !== current.author_id)         cleanupLookupIfOrphan(db, 'authors', current.author_id)
  if (translatorId !== current.translator_id) cleanupLookupIfOrphan(db, 'translators', current.translator_id)
  if (publisherId !== current.publisher_id)   cleanupLookupIfOrphan(db, 'publishers', current.publisher_id)
  if (genreId !== current.genre_id)           cleanupLookupIfOrphan(db, 'genres', current.genre_id)

  return getBookById(db, id)!
}

export function deleteBook(db: Database.Database, id: number): void {
  const book = db.prepare(
    'SELECT author_id, translator_id, publisher_id, genre_id FROM books WHERE id = ?'
  ).get(id) as { author_id: number; translator_id: number | null; publisher_id: number | null; genre_id: number | null } | undefined

  if (!book) return

  db.prepare('DELETE FROM books WHERE id = ?').run(id)
  reindexQueuePositions(db)

  cleanupLookupIfOrphan(db, 'authors',     book.author_id)
  cleanupLookupIfOrphan(db, 'translators', book.translator_id)
  cleanupLookupIfOrphan(db, 'publishers',  book.publisher_id)
  cleanupLookupIfOrphan(db, 'genres',      book.genre_id)
}
