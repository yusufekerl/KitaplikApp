import { create } from 'zustand'
import type { Book, BookFilters } from '../types'
import { booksApi } from '../lib/window'

interface BookStore {
  books: Book[]
  filters: BookFilters
  loading: boolean
  error: string | null
  fetchBooks: () => Promise<void>
  setFilters: (f: Partial<BookFilters>) => void
  resetFilters: () => void
}

const DEFAULT_FILTERS: BookFilters = {
  search: '',
  categoryId: null,
  genreId: null,
  status: null,
  sortBy: 'created_at',
  sortDir: 'desc',
}

export const useBookStore = create<BookStore>((set, get) => ({
  books: [],
  filters: { ...DEFAULT_FILTERS },
  loading: false,
  error: null,

  fetchBooks: async () => {
    set({ loading: true, error: null })
    const result = await booksApi().getAll(get().filters)
    if (result.ok) {
      set({ books: result.data, loading: false })
    } else {
      set({ error: result.error, loading: false })
    }
  },

  setFilters: (partial) => {
    set((s) => ({ filters: { ...s.filters, ...partial } }))
    get().fetchBooks()
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS } })
    get().fetchBooks()
  },
}))
