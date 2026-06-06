import type {
  Book,
  Category,
  LookupItem,
  ReadingQueueItem,
  BookFilters,
  CreateBookInput,
  ApiResult,
} from '../types'

interface ElectronAPI {
  books: {
    getAll:  (filters?: BookFilters) => Promise<ApiResult<Book[]>>
    getById: (id: number)            => Promise<ApiResult<Book>>
    create:  (data: CreateBookInput) => Promise<ApiResult<Book>>
    update:  (id: number, data: Partial<CreateBookInput>) => Promise<ApiResult<Book>>
    delete:  (id: number)            => Promise<ApiResult<void>>
  }
  categories: {
    getAll:  ()                                            => Promise<ApiResult<Category[]>>
    create:  (data: { name: string; color: string })      => Promise<ApiResult<Category>>
    update:  (id: number, data: { name?: string; color?: string }) => Promise<ApiResult<Category>>
    delete:  (id: number)                                 => Promise<ApiResult<void>>
  }
  authors:     { getAll: () => Promise<ApiResult<LookupItem[]>> }
  translators: { getAll: () => Promise<ApiResult<LookupItem[]>> }
  publishers:  { getAll: () => Promise<ApiResult<LookupItem[]>> }
  genres:      { getAll: () => Promise<ApiResult<LookupItem[]>> }
  readingQueue: {
    getAll:  ()                        => Promise<ApiResult<ReadingQueueItem[]>>
    add:     (bookId: number)          => Promise<ApiResult<void>>
    remove:  (bookId: number)          => Promise<ApiResult<void>>
    reorder: (ids: number[])           => Promise<ApiResult<void>>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export const booksApi      = () => window.electronAPI.books
export const categoriesApi = () => window.electronAPI.categories
export const authorsApi    = () => window.electronAPI.authors
export const translatorsApi= () => window.electronAPI.translators
export const publishersApi = () => window.electronAPI.publishers
export const genresApi     = () => window.electronAPI.genres
export const queueApi      = () => window.electronAPI.readingQueue
