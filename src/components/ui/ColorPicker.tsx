import { clsx } from 'clsx'

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#14B8A6', '#3B82F6', '#6366F1', '#8B5CF6',
  '#EC4899', '#78716C', '#64748B', '#1F2937',
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={clsx(
              'w-7 h-7 rounded-full transition-all',
              value === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110',
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-gray-500">Özel renk:</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-7 rounded border border-gray-200 cursor-pointer p-0.5"
        />
        <span className="text-xs text-gray-400 font-mono">{value}</span>
      </div>
    </div>
  )
}
