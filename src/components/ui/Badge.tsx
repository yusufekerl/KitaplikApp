import { clsx } from 'clsx'
import { STATUS_LABEL, STATUS_COLOR, type ReadingStatus } from '../../types'

interface BadgeProps {
  status: ReadingStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        STATUS_COLOR[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
