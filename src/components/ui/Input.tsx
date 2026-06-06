import { type InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors',
            'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            error
              ? 'border-red-300 focus:ring-2 focus:ring-red-200'
              : 'border-gray-200 dark:border-gray-600 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
