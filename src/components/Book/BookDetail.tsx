import type { Book } from '../../types'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/Badge'
import { CategoryBadge } from '../Category/CategoryBadge'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { enUS } from 'date-fns/locale'
import { useTranslation } from '../../hooks/useTranslation'

interface BookDetailProps {
  book: Book
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onAddToQueue: () => void
  isInQueue: boolean
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex gap-4">
      <span className="w-36 shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide pt-0.5">
        {label}
      </span>
      <span className="text-sm text-gray-800 dark:text-gray-200">
        {(value !== null && value !== undefined && value !== '') ? value : '—'}
      </span>
    </div>
  )
}

function formatDate(d: string | null, lang: string): string | null {
  if (!d) return null
  try {
    return format(new Date(d), 'd MMMM yyyy', { locale: lang === 'tr' ? tr : enUS })
  } catch {
    return d
  }
}

export function BookDetail({
  book,
  onClose,
  onEdit,
  onDelete,
  onAddToQueue,
  isInQueue,
}: BookDetailProps) {
  const { t, lang } = useTranslation()

  return (
    <div className="w-96 shrink-0 bg-white dark:bg-gray-800 border-l border-gray-100 dark:border-gray-700 flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title={t.detail.close}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          {book.reading_status !== 'read' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onAddToQueue}
              disabled={isInQueue}
              title={isInQueue ? t.detail.alreadyInQueue : t.detail.addToQueueTitle}
            >
              {isInQueue ? t.detail.inQueue : t.detail.addToQueueBtn}
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={onEdit}>{t.detail.edit}</Button>
          <Button size="sm" variant="danger" onClick={onDelete}>{t.detail.delete}</Button>
        </div>
      </div>

      <div
        className="h-1.5 w-full shrink-0"
        style={{ backgroundColor: book.categories[0]?.color ?? '#E5E7EB' }}
      />

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">{book.title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{book.author_name}</p>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <StatusBadge status={book.reading_status} size="md" />
            {book.categories.map((c) => (
              <CategoryBadge key={c.id} name={c.name} color={c.color} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Row label={t.detail.author}       value={book.author_name} />
          <Row label={t.detail.translator}   value={book.translator_name} />
          <Row label={t.detail.publisher}    value={book.publisher_name} />
          <Row label={t.detail.genre}        value={book.genre_name} />
          <Row label={t.detail.edition}      value={book.edition_info} />
          <Row label={t.detail.pages}        value={book.page_count ? t.detail.pageCount(book.page_count) : null} />
          <Row label={t.detail.purchaseDate} value={formatDate(book.purchase_date, lang)} />
          <Row label={t.detail.purchaseCity} value={book.purchase_city} />
          <Row label={t.detail.readingDate}  value={formatDate(book.reading_date, lang)} />
          <Row label={t.detail.status}       value={t.status[book.reading_status]} />
        </div>

        {book.description && (
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">{t.detail.description}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{book.description}</p>
          </div>
        )}

        {book.notes && (
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">{t.detail.notes}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{book.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
