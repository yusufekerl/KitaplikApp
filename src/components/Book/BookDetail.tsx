import type { Book } from '../../types'
import { STATUS_LABEL } from '../../types'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/Badge'
import { CategoryBadge } from '../Category/CategoryBadge'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface BookDetailProps {
  book: Book
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onAddToQueue: () => void
  isInQueue: boolean
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex gap-4">
      <span className="w-36 shrink-0 text-xs font-medium text-gray-400 uppercase tracking-wide pt-0.5">
        {label}
      </span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  )
}

function formatDate(d: string | null): string | null {
  if (!d) return null
  try {
    return format(new Date(d), 'd MMMM yyyy', { locale: tr })
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
  return (
    <div className="w-96 shrink-0 bg-white border-l border-gray-100 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Kapat"
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
              title={isInQueue ? 'Zaten sırada' : 'Okuma sırasına ekle'}
            >
              {isInQueue ? '✓ Sırada' : '+ Sıraya Ekle'}
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={onEdit}>Düzenle</Button>
          <Button size="sm" variant="danger" onClick={onDelete}>Sil</Button>
        </div>
      </div>

      {/* Color strip + title */}
      <div
        className="h-1.5 w-full shrink-0"
        style={{ backgroundColor: book.category_color ?? '#E5E7EB' }}
      />

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Title block */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 leading-snug">{book.title}</h2>
          <p className="text-sm text-gray-500 mt-1">{book.author_name}</p>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <StatusBadge status={book.reading_status} size="md" />
            {book.category_name && book.category_color && (
              <CategoryBadge name={book.category_name} color={book.category_color} />
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <Row label="Yazar"       value={book.author_name} />
          <Row label="Çevirmen"    value={book.translator_name} />
          <Row label="Yayınevi"    value={book.publisher_name} />
          <Row label="Tür"         value={book.genre_name} />
          <Row label="Baskı / Yıl" value={book.edition_info} />
          <Row label="Sayfa"       value={book.page_count ? `${book.page_count} sayfa` : null} />
          <Row label="Alındığı Tarih" value={formatDate(book.purchase_date)} />
          <Row label="Alındığı Şehir" value={book.purchase_city} />
          <Row label="Okunma Tarihi"  value={formatDate(book.reading_date)} />
          <Row label="Durum"       value={STATUS_LABEL[book.reading_status]} />
        </div>

        {book.description && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Açıklama</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{book.description}</p>
          </div>
        )}

        {book.notes && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Notlar</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{book.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
