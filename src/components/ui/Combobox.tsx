import { useState, useRef, useEffect, forwardRef } from 'react'
import { clsx } from 'clsx'

interface ComboboxProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
}

export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(
  ({ options, value, onChange, placeholder, label, error, disabled }, _ref) => {
    const [input, setInput] = useState(value)
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Dışarı tıklama dinleyicisi her zaman en güncel input/onChange'i okusun diye ref kullanılır —
    // aksi halde eskimiş (stale) kapanış değerleriyle çağrılıp form değerini sıfırlayabilir.
    const latest = useRef({ input, onChange })
    latest.current = { input, onChange }

    useEffect(() => { setInput(value) }, [value])

    const filtered = input
      ? options.filter((o) => o.toLowerCase().includes(input.toLowerCase()))
      : options

    useEffect(() => {
      if (!open) return
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false)
          latest.current.onChange(latest.current.input)
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [open])

    const inputId = label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div ref={containerRef} className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            type="text"
            value={input}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(e) => {
              setInput(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              setTimeout(() => { setOpen(false); onChange(input) }, 150)
            }}
            className={clsx(
              'w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors',
              'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              error
                ? 'border-red-300 focus:ring-2 focus:ring-red-200'
                : 'border-gray-200 dark:border-gray-600 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40',
            )}
          />
          {open && filtered.length > 0 && (
            <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-44 overflow-y-auto">
              {filtered.map((opt) => (
                <li key={opt}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300"
                    onMouseDown={() => {
                      onChange(opt)
                      setInput(opt)
                      setOpen(false)
                    }}
                  >
                    {opt}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    )
  }
)
Combobox.displayName = 'Combobox'
