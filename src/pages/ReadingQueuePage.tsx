import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useReadingQueue } from '../hooks/useReadingQueue'
import { StatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import type { ReadingQueueItem } from '../types'
import { useTranslation } from '../hooks/useTranslation'

interface SortableItemProps {
  item: ReadingQueueItem
  onRemove: (bookId: number) => void
}

function SortableItem({ item, onRemove }: SortableItemProps) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.book_id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm px-4 py-3"
    >
      <button
        {...listeners}
        {...attributes}
        className="text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing"
        title={t.queue.reorderHint}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </button>

      <span className="w-6 text-sm font-bold text-gray-300 dark:text-gray-600 text-center">{item.position}</span>

      <div
        className="w-1 h-10 rounded-full shrink-0"
        style={{ backgroundColor: item.category_color ?? '#E5E7EB' }}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{item.author_name}</p>
      </div>

      <StatusBadge status={item.reading_status} />

      <Button
        size="sm"
        variant="ghost"
        onClick={() => onRemove(item.book_id)}
        title={t.queue.removeHint}
        className="text-gray-400 hover:text-red-500"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Button>
    </div>
  )
}

export function ReadingQueuePage() {
  const { t } = useTranslation()
  const { queue, loading, remove, reorder } = useReadingQueue()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = queue.findIndex((q) => q.book_id === active.id)
    const newIndex = queue.findIndex((q) => q.book_id === over.id)
    const newOrder = arrayMove(queue, oldIndex, newIndex)
    reorder(newOrder.map((q) => q.book_id))
  }

  return (
    <div className="px-6 py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t.queue.title}</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          {queue.length === 0 ? t.queue.empty : t.queue.bookCount(queue.length)} · {t.queue.hint}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">{t.queue.loading}</p>
      ) : queue.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <p className="text-sm">{t.queue.emptyMessage}</p>
          <p className="text-xs mt-1">{t.queue.emptyHint}</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={queue.map((q) => q.book_id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {queue.map((item) => (
                <SortableItem key={item.book_id} item={item} onRemove={remove} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
