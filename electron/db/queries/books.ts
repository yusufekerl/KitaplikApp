import type { SqlJsDatabase as Database } from '../SqlJsDatabase'
import { findOrCreateLookup } from './lookups'

export interface BookWithRelations {
  id: number
  title: string
  author_id: number
  translator_id: number | null
  publisher_id: number | null
  genre_id: number | null
  category_id: number | null
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
  category_name: string | null
  category_color: string | null
}

export interface BookFilters {
  search?: string
  categoryId?: number
  genreId?: number
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
  categoryId?: number | null
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
    g.name  AS genre_name,
    c.name  AS category_name,
    c.color AS category_color
  FROM books b
  JOIN authors a ON b.author_id = a.id
  LEFT JOIN translators t ON b.translator_id = t.id
  LEFT JOIN publishers  p ON b.publisher_id  = p.id
  LEFT JOIN genres      g ON b.genre_id      = g.id
  LEFT JOIN categories  c ON b.category_id   = c.id
`

const SORT_MAP: Record<string, string> = {
  title:        'b.title COLLATE NOCASE',
  created_at:   'b.created_at',
  purchase_date:'b.purchase_date',
  reading_date: 'b.reading_date',
  page_count:   'b.page_count',
  author:       'a.name COLLATE NOCASE',
}

export function getAllBooks(db: Database.Database, filters: BookFilters = {}): BookWithRelations[] {
  const conditions: string[] = ['1=1']
  const params: unknown[] = []

  if (filters.search) {
    conditions.push('(b.title LIKE ? OR a.name LIKE ?)')
    params.push(`%${filters.search}%`, `%${filters.search}%`)
  }
  if (filters.categoryId !== undefined && filters.categoryId !== null) {
    conditions.push('b.category_id = ?')
    params.push(filters.categoryId)
  }
  if (filters.genreId !== undefined && filters.genreId !== null) {
    conditions.push('b.genre_id = ?')
    params.push(filters.genreId)
  }
  if (filters.status) {
    conditions.push('b.reading_status = ?')
    params.push(filters.status)
  }

  const sortField = SORT_MAP[filters.sortBy || 'created_at'] ?? 'b.created_at'
  const sortDir   = filters.sortDir === 'asc' ? 'ASC' : 'DESC'

  const sql = `${BASE_QUERY} WHERE ${conditions.join(' AND ')} ORDER BY ${sortField} ${sortDir}`
  return db.prepare(sql).all(...params) as BookWithRelations[]
}

export function getBookById(db: Database.Database, id: number): BookWithRelations | undefined {
  return db.prepare(`${BASE_QUERY} WHERE b.id = ?`).get(id) as BookWithRelations | undefined
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
      title, author_id, translator_id, publisher_id, genre_id, category_id,
      edition_info, page_count, reading_status,
      purchase_date, reading_date, purchase_city, description, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.title.trim(),
    authorId,
    translatorId,
    publisherId,
    genreId,
    data.categoryId ?? null,
    data.edition_info?.trim() || null,
    data.page_count ?? null,
    data.reading_status,
    data.purchase_date || null,
    data.reading_date || null,
    data.purchase_city?.trim() || null,
    data.description?.trim() || null,
    data.notes?.trim() || null,
  )

  return getBookById(db, result.lastInsertRowid as number)!
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
      category_id = ?, edition_info = ?, page_count = ?, reading_status = ?,
      purchase_date = ?, reading_date = ?, purchase_city = ?, description = ?, notes = ?
    WHERE id = ?
  `).run(
    (data.title ?? current.title).trim(),
    authorId,
    translatorId,
    publisherId,
    genreId,
    data.categoryId !== undefined ? (data.categoryId ?? null) : current.category_id,
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

  return getBookById(db, id)!
}

export function deleteBook(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM books WHERE id = ?').run(id)
}
