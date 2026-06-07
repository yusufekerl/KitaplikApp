import { useState, useCallback, useEffect } from 'react'
import { useBookStore } from '../store/bookStore'
import { useCategories } from '../hooks/useCategories'
import { useReadingQueue } from '../hooks/useReadingQueue'
import { BookCard } from '../components/Book/BookCard'
import { BookDetail } from '../components/Book/BookDetail'
import { BookForm } from '../components/Book/BookForm'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Button } from '../components/ui/Button'
import { booksApi, genresApi } from '../lib/window'
import type { Book, CreateBookInput, ReadingStatus, LookupItem } from '../types'
import { useTranslation } from '../hooks/useTranslation'

export function Library() {
  const { t } = useTranslation()
  const { books, filters, loading, fetchBooks, setFilters } = useBookStore()
  const { categories, fetchCategories } = useCategories()
  const { add: addToQueue, queue } = useReadingQueue()

  const [genres, setGenres] = useState<LookupItem[]>([])
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [editBook, setEditBook] = useState<Book | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  const refreshGenres = useCallback(() => {
    genresApi().getAll().then((r) => { if (r.ok) setGenres(r.data) })
  }, [])

  useEffect(() => {
    fetchBooks()
    fetchCategories()
    refreshGenres()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = useCallback(async (data: CreateBookInput) => {
    setFormLoading(true)
    const result = await booksApi().create(data)
    setFormLoading(false)
    if (result.ok) {
      setAddOpen(false)
      fetchBooks()
      fetchCategories()
      refreshGenres()
    }
  }, [fetchBooks, fetchCategories, refreshGenres])

  const handleUpdate = useCallback(async (data: CreateBookInput) => {
    if (!editBook) return
    setFormLoading(true)
    const result = await booksApi().update(editBook.id, data)
    setFormLoading(false)
    if (result.ok) {
      setEditBook(null)
      fetchBooks()
      refreshGenres()
      if (selectedBook?.id === editBook.id) setSelectedBook(result.data)
    }
  }, [editBook, fetchBooks, selectedBook, refreshGenres])

  const [confirmDeleteBook, setConfirmDeleteBook] = useState<Book | null>(null)

  const handleDelete = useCallback(() => {
    if (!selectedBook) return
    setConfirmDeleteBook(selectedBook)
  }, [selectedBook])

  const confirmDelete = useCallback(async () => {
    if (!confirmDeleteBook) return
    await booksApi().delete(confirmDeleteBook.id)
    setConfirmDeleteBook(null)
    setSelectedBook(null)
    fetchBooks()
    refreshGenres()
  }, [confirmDeleteBook, fetchBooks, refreshGenres])

  const handleAddToQueue = useCallback(async () => {
    if (!selectedBook) return
    await addToQueue(selectedBook.id)
  }, [selectedBook, addToQueue])

  const isInQueue = (bookId: number) => queue.some((q) => q.book_id === bookId)

  const STATUS_OPTIONS: { value: ReadingStatus | ''; label: string }[] = [
    { value: '', label: t.status.all },
    { value: 'unread', label: t.status.unread },
    { value: 'reading', label: t.status.reading },
    { value: 'read', label: t.status.read },
  ]

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex-wrap">
          <input
            type="search"
            placeholder={t.library.search}
            className="flex-1 min-w-0 max-w-xs px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            value={filters.search ?? ''}
            onChange={(e) => setFilters({ search: e.target.value })}
          />

          <select
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={filters.status ?? ''}
            onChange={(e) => setFilters({ status: (e.target.value as ReadingStatus) || null })}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={filters.categoryId ?? ''}
            onChange={(e) => setFilters({ categoryId: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">{t.library.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={filters.genreId ?? ''}
            onChange={(e) => setFilters({ genreId: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">{t.library.allGenres}</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          <select
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={`${filters.sortBy ?? 'created_at'}_${filters.sortDir ?? 'desc'}`}
            onChange={(e) => {
              const [sortBy, sortDir] = e.target.value.split('_') as [typeof filters.sortBy, typeof filters.sortDir]
              setFilters({ sortBy, sortDir })
            }}
          >
            <option value="created_at_desc">{t.library.sortNewest}</option>
            <option value="created_at_asc">{t.library.sortOldest}</option>
            <option value="title_asc">{t.library.sortTitleAZ}</option>
            <option value="title_desc">{t.library.sortTitleZA}</option>
            <option value="author_asc">{t.library.sortAuthorAZ}</option>
            <option value="page_count_asc">{t.library.sortPagesAsc}</option>
            <option value="page_count_desc">{t.library.sortPagesDesc}</option>
          </select>

          <div className="ml-auto">
            <Button onClick={() => setAddOpen(true)}>{t.library.addBook}</Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-12">{t.library.loading}</p>
          ) : books.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm">{t.library.notFound}</p>
              <Button className="mt-4" onClick={() => setAddOpen(true)}>{t.library.addFirst}</Button>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{t.library.bookCount(books.length)}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {books.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onClick={() => setSelectedBook(book)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {selectedBook && (
        <BookDetail
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onEdit={() => setEditBook(selectedBook)}
          onDelete={handleDelete}
          onAddToQueue={handleAddToQueue}
          isInQueue={isInQueue(selectedBook.id)}
        />
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t.library.newBook} width="lg">
        <BookForm
          onSubmit={handleCreate}
          onCancel={() => setAddOpen(false)}
          loading={formLoading}
        />
      </Modal>

      <Modal
        open={!!editBook}
        onClose={() => setEditBook(null)}
        title={t.library.editBook}
        width="lg"
      >
        {editBook && (
          <BookForm
            initialData={editBook}
            onSubmit={handleUpdate}
            onCancel={() => setEditBook(null)}
            loading={formLoading}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmDeleteBook}
        title={t.common.confirmTitle}
        message={confirmDeleteBook ? t.library.confirmDelete(confirmDeleteBook.title) : ''}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteBook(null)}
      />
    </div>
  )
}
