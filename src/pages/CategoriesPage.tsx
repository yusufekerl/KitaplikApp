import { useState } from 'react'
import { useCategories } from '../hooks/useCategories'
import { useCategoryStore } from '../store/categoryStore'
import { categoriesApi } from '../lib/window'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ColorPicker } from '../components/ui/ColorPicker'
import type { Category } from '../types'
import { useTranslation } from '../hooks/useTranslation'

const DEFAULT_COLOR = '#6366f1'

interface CategoryFormState {
  name: string
  color: string
}

export function CategoriesPage() {
  const { t } = useTranslation()
  const { categories, fetchCategories } = useCategories()
  const { fetchCategories: refreshStore } = useCategoryStore()

  const [modalOpen, setModalOpen]   = useState(false)
  const [editing, setEditing]       = useState<Category | null>(null)
  const [formState, setFormState]   = useState<CategoryFormState>({ name: '', color: DEFAULT_COLOR })
  const [loading, setLoading]       = useState(false)
  const [nameError, setNameError]   = useState('')

  const openAdd = () => {
    setEditing(null)
    setFormState({ name: '', color: DEFAULT_COLOR })
    setNameError('')
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setFormState({ name: cat.name, color: cat.color })
    setNameError('')
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!formState.name.trim()) {
      setNameError(t.categories.validationName)
      return
    }
    setLoading(true)
    let result
    if (editing) {
      result = await categoriesApi().update(editing.id, formState)
    } else {
      result = await categoriesApi().create(formState)
    }
    setLoading(false)
    if (result.ok) {
      setModalOpen(false)
      fetchCategories()
      refreshStore()
    } else {
      setNameError(result.error)
    }
  }

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(t.categories.confirmDelete(cat.name))) return
    await categoriesApi().delete(cat.id)
    fetchCategories()
    refreshStore()
  }

  return (
    <div className="px-6 py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t.categories.title}</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t.categories.subtitle}</p>
        </div>
        <Button onClick={openAdd}>{t.categories.add}</Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <p className="text-sm">{t.categories.empty}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm px-4 py-3"
            >
              <div
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{cat.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{cat.color}</p>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 px-2 py-0.5 rounded-md">
                {t.categories.bookCount(cat.book_count ?? 0)}
              </span>
              <Button size="sm" variant="ghost" onClick={() => openEdit(cat)}>{t.categories.edit}</Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(cat)}
                className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                {t.categories.delete}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t.categories.editTitle : t.categories.newTitle}
        width="sm"
      >
        <div className="space-y-4">
          <Input
            label={t.categories.nameLabel}
            value={formState.name}
            onChange={(e) => { setFormState((s) => ({ ...s, name: e.target.value })); setNameError('') }}
            error={nameError}
            placeholder={t.categories.placeholder}
            autoFocus
          />
          <ColorPicker
            label={t.categories.colorLabel}
            value={formState.color}
            onChange={(color) => setFormState((s) => ({ ...s, color }))}
          />
          <div
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{ backgroundColor: `${formState.color}18` }}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: formState.color }} />
            <span className="text-sm font-medium" style={{ color: formState.color }}>
              {formState.name || t.categories.preview}
            </span>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>{t.categories.cancel}</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? t.categories.saving : editing ? t.categories.update : t.categories.save}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
