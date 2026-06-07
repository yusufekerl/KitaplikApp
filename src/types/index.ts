export type ReadingStatus = 'read' | 'reading' | 'unread'

export interface BookCategory {
  id: number
  name: string
  color: string
}

export interface Book {
  id: number
  title: string
  author_id: number
  translator_id: number | null
  publisher_id: number | null
  genre_id: number | null
  edition_info: string | null
  page_count: number | null
  reading_status: ReadingStatus
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

export interface Category {
  id: number
  name: string
  color: string
  created_at: string
  book_count?: number
}

export interface LookupItem {
  id: number
  name: string
  created_at: string
}

export interface ReadingQueueItem {
  id: number
  book_id: number
  position: number
  added_at: string
  title: string
  author_name: string
  reading_status: ReadingStatus
  category_color: string | null
  category_name: string | null
}

export interface BookFilters {
  search?: string
  categoryId?: number | null
  genreId?: number | null
  publisherId?: number | null
  translatorId?: number | null
  status?: ReadingStatus | null
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
  reading_status: ReadingStatus
  purchase_date?: string | null
  reading_date?: string | null
  purchase_city?: string | null
  description?: string | null
  notes?: string | null
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string }

export const STATUS_LABEL: Record<ReadingStatus, string> = {
  read: 'Okundu',
  reading: 'Okunuyor',
  unread: 'Okunmadı',
}

export const STATUS_COLOR: Record<ReadingStatus, string> = {
  read: 'bg-green-100 text-green-800',
  reading: 'bg-blue-100 text-blue-800',
  unread: 'bg-gray-100 text-gray-600',
}
