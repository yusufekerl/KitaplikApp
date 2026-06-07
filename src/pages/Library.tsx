import { useState, useCallback, useEffect, useRef } from 'react'
import { useBookStore } from '../store/bookStore'
import { useCategories } from '../hooks/useCategories'
import { useReadingQueue } from '../hooks/useReadingQueue'
import { BookCard } from '../components/Book/BookCard'
import { BookDetail } from '../components/Book/BookDetail'
import { BookForm } from '../components/Book/BookForm'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Button } from '../components/ui/Button'
import { booksApi, genresApi, publishersApi, translatorsApi } from '../lib/window'
import type { Book, CreateBookInput, ReadingStatus, LookupItem } from '../types'
import { useTranslation } from '../hooks/useTranslation'

export function Library() {
  const { t } = useTranslation()
  const { books, filters, loading, fetchBooks, setFilters } = useBookStore()
  const { categories, fetchCategories } = useCategories()
  const { add: addToQueue, queue } = useReadingQueue()

  const [genres, setGenres] = useState<LookupItem[]>([])
  const [publishers, setPublishers] = useState<LookupItem[]>([])
  const [translators, setTranslators] = useState<LookupItem[]>([])
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [editBook, setEditBook] = useState<Book | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  const listRef = useRef<HTMLDivElement>(null)
  const savedScrollTop = useRef<number | null>(null)

  const refreshGenres = useCallback(() => {
    genresApi().getAll().then((r) => { if (r.ok) setGenres(r.data) })
  }, [])

  const refreshPublishers = useCallback(() => {
    publishersApi().getAll().then((r) => { if (r.ok) setPublishers(r.data) })
  }, [])

  const refreshTranslators = useCallback(() => {
    translatorsApi().getAll().then((r) => { if (r.ok) setTranslators(r.data) })
  }, [])

  const refreshTotalCount = useCallback(() => {
    booksApi().getCount().then((r) => { if (r.ok) setTotalCount(r.data) })
  }, [])

  useEffect(() => {
    fetchBooks()
    fetchCategories()
    refreshGenres()
    refreshPublishers()
    refreshTranslators()
    refreshTotalCount()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Liste yenilendiğinde (kitap eklendi/güncellendi/silindi), kullanıcının
  // bulunduğu kaydırma konumunu koru — yeni kitap listenin başında belirince
  // sayfa otomatik olarak en başa atlamasın.
  const refreshBooksKeepingScroll = useCallback(() => {
    savedScrollTop.current = listRef.current?.scrollTop ?? null
    fetchBooks()
  }, [fetchBooks])

  useEffect(() => {
    if (savedScrollTop.current !== null && listRef.current) {
      listRef.current.scrollTop = savedScrollTop.current
      savedScrollTop.current = null
    }
  }, [books])

  const handleCreate = useCallback(async (data: CreateBookInput) => {
    setFormLoading(true)
    const result = await booksApi().create(data)
    setFormLoading(false)
    if (result.ok) {
      setAddOpen(false)
      refreshBooksKeepingScroll()
      fetchCategories()
      refreshGenres()
      refreshPublishers()
      refreshTranslators()
      refreshTotalCount()
    }
  }, [refreshBooksKeepingScroll, fetchCategories, refreshGenres, refreshPublishers, refreshTranslators, refreshTotalCount])

  const handleUpdate = useCallback(async (data: CreateBookInput) => {
    if (!editBook) return
    setFormLoading(true)
    const result = await booksApi().update(editBook.id, data)
    setFormLoading(false)
    if (result.ok) {
      setEditBook(null)
      refreshBooksKeepingScroll()
      refreshGenres()
      refreshPublishers()
      refreshTranslators()
      if (selectedBook?.id === editBook.id) setSelectedBook(result.data)
    }
  }, [editBook, refreshBooksKeepingScroll, selectedBook, refreshGenres, refreshPublishers, refreshTranslators])

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
    refreshBooksKeepingScroll()
    refreshGenres()
    refreshPublishers()
    refreshTranslators()
    refreshTotalCount()
  }, [confirmDeleteBook, refreshBooksKeepingScroll, refreshGenres, refreshPublishers, refreshTranslators, refreshTotalCount])

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
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex-wrap">
          <input
            type="search"
            placeholder={t.library.search}
            className="flex-1 min-w-[12rem] max-w-sm px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
            value={filters.publisherId ?? ''}
            onChange={(e) => setFilters({ publisherId: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">{t.library.allPublishers}</option>
            {publishers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={filters.translatorId ?? ''}
            onChange={(e) => setFilters({ translatorId: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">{t.library.allTranslators}</option>
            {translators.map((tr) => (
              <option key={tr.id} value={tr.id}>{tr.name}</option>
            ))}
          </select>

          <select
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={`${filters.sortBy ?? 'created_at'}:${filters.sortDir ?? 'desc'}`}
            onChange={(e) => {
              const [sortBy, sortDir] = e.target.value.split(':') as [typeof filters.sortBy, typeof filters.sortDir]
              setFilters({ sortBy, sortDir })
            }}
          >
            <option value="created_at:desc">{t.library.sortNewest}</option>
            <option value="created_at:asc">{t.library.sortOldest}</option>
            <option value="title:asc">{t.library.sortTitleAZ}</option>
            <option value="title:desc">{t.library.sortTitleZA}</option>
            <option value="author:asc">{t.library.sortAuthorAZ}</option>
            <option value="page_count:asc">{t.library.sortPagesAsc}</option>
            <option value="page_count:desc">{t.library.sortPagesDesc}</option>
          </select>

          {totalCount !== null && (
            <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {t.library.totalBooks(totalCount)}
            </p>
          )}

          <div className="ml-auto">
            <Button onClick={() => setAddOpen(true)}>{t.library.addBook}</Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div ref={listRef} className="flex-1 overflow-y-auto px-6 py-5">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
        </div>

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
