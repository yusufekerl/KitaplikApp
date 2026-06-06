import { useState, useCallback } from 'react'
import { useBookStore } from '../store/bookStore'
import { useCategories } from '../hooks/useCategories'
import { useReadingQueue } from '../hooks/useReadingQueue'
import { BookCard } from '../components/Book/BookCard'
import { BookDetail } from '../components/Book/BookDetail'
import { BookForm } from '../components/Book/BookForm'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { booksApi } from '../lib/window'
import type { Book, CreateBookInput, ReadingStatus } from '../types'
import { genresApi } from '../lib/window'
import { useEffect } from 'react'
import type { LookupItem } from '../types'

const STATUS_OPTIONS: { value: ReadingStatus | ''; label: string }[] = [
  { value: '', label: 'Tümü' },
  { value: 'unread', label: 'Okunmadı' },
  { value: 'reading', label: 'Okunuyor' },
  { value: 'read', label: 'Okundu' },
]

export function Library() {
  const { books, filters, loading, fetchBooks, setFilters } = useBookStore()
  const { categories, fetchCategories } = useCategories()
  const { add: addToQueue, queue } = useReadingQueue()

  const [genres, setGenres] = useState<LookupItem[]>([])
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [editBook, setEditBook] = useState<Book | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchBooks()
    fetchCategories()
    genresApi().getAll().then((r) => { if (r.ok) setGenres(r.data) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = useCallback(async (data: CreateBookInput) => {
    setFormLoading(true)
    const result = await booksApi().create(data)
    setFormLoading(false)
    if (result.ok) {
      setAddOpen(false)
      fetchBooks()
      fetchCategories()
    }
  }, [fetchBooks, fetchCategories])

  const handleUpdate = useCallback(async (data: CreateBookInput) => {
    if (!editBook) return
    setFormLoading(true)
    const result = await booksApi().update(editBook.id, data)
    setFormLoading(false)
    if (result.ok) {
      setEditBook(null)
      fetchBooks()
      if (selectedBook?.id === editBook.id) setSelectedBook(result.data)
    }
  }, [editBook, fetchBooks, selectedBook])

  const handleDelete = useCallback(async () => {
    if (!selectedBook) return
    if (!window.confirm(`"${selectedBook.title}" silinsin mi?`)) return
    await booksApi().delete(selectedBook.id)
    setSelectedBook(null)
    fetchBooks()
  }, [selectedBook, fetchBooks])

  const handleAddToQueue = useCallback(async () => {
    if (!selectedBook) return
    await addToQueue(selectedBook.id)
  }, [selectedBook, addToQueue])

  const isInQueue = (bookId: number) => queue.some((q) => q.book_id === bookId)

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-100">
          <input
            type="search"
            placeholder="Kitap veya yazar ara…"
            className="flex-1 max-w-xs px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={filters.search ?? ''}
            onChange={(e) => setFilters({ search: e.target.value })}
          />

          <select
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400"
            value={filters.status ?? ''}
            onChange={(e) => setFilters({ status: (e.target.value as ReadingStatus) || null })}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400"
            value={filters.categoryId ?? ''}
            onChange={(e) => setFilters({ categoryId: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400"
            value={filters.genreId ?? ''}
            onChange={(e) => setFilters({ genreId: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">Tüm Türler</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          <select
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400"
            value={`${filters.sortBy ?? 'created_at'}_${filters.sortDir ?? 'desc'}`}
            onChange={(e) => {
              const [sortBy, sortDir] = e.target.value.split('_') as [typeof filters.sortBy, typeof filters.sortDir]
              setFilters({ sortBy, sortDir })
            }}
          >
            <option value="created_at_desc">Eklenme (yeni)</option>
            <option value="created_at_asc">Eklenme (eski)</option>
            <option value="title_asc">Başlık A–Z</option>
            <option value="title_desc">Başlık Z–A</option>
            <option value="author_asc">Yazar A–Z</option>
            <option value="page_count_asc">Sayfa (az)</option>
            <option value="page_count_desc">Sayfa (çok)</option>
          </select>

          <div className="ml-auto">
            <Button onClick={() => setAddOpen(true)}>+ Kitap Ekle</Button>
          </div>
        </div>

        {/* Book grid */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-12">Yükleniyor…</p>
          ) : books.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm">Kitap bulunamadı.</p>
              <Button className="mt-4" onClick={() => setAddOpen(true)}>İlk kitabı ekle</Button>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-4">{books.length} kitap</p>
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
      </div>

      {/* Detail panel */}
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

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Yeni Kitap" width="lg">
        <BookForm
          onSubmit={handleCreate}
          onCancel={() => setAddOpen(false)}
          loading={formLoading}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editBook}
        onClose={() => setEditBook(null)}
        title="Kitabı Düzenle"
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
    </div>
  )
}
