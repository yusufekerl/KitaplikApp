import { type ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-sm',
        variant === 'primary'   && 'bg-indigo-600 text-white hover:bg-indigo-700',
        variant === 'secondary' && 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
        variant === 'ghost'     && 'text-gray-600 hover:bg-gray-100',
        variant === 'danger'    && 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
