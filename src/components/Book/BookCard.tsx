import type { Book } from '../../types'
import { StatusBadge } from '../ui/Badge'

interface BookCardProps {
  book: Book
  onClick: () => void
}

export function BookCard({ book, onClick }: BookCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all overflow-hidden group"
    >
      <div className="flex">
        <div
          className="w-1 shrink-0 rounded-l-xl"
          style={{ backgroundColor: book.categories[0]?.color ?? '#E5E7EB' }}
        />
        <div className="flex-1 px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
              {book.title}
            </h3>
            <StatusBadge status={book.reading_status} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{book.author_name}</p>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {book.genre_name && (
              <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 px-2 py-0.5 rounded-md">
                {book.genre_name}
              </span>
            )}
            {book.page_count && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{book.page_count} sf.</span>
            )}
            {book.publisher_name && (
              <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{book.publisher_name}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
