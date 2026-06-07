import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Book, CreateBookInput } from '../../types'
import { useCategoryStore } from '../../store/categoryStore'
import { CategoryBadge } from '../Category/CategoryBadge'
import { authorsApi, translatorsApi, publishersApi, genresApi } from '../../lib/window'
import { Input } from '../ui/Input'
import { Combobox } from '../ui/Combobox'
import { Button } from '../ui/Button'
import { useTranslation } from '../../hooks/useTranslation'

type FormValues = {
  title: string
  authorName: string
  translatorName?: string | null
  publisherName?: string | null
  genreName?: string | null
  categoryIds: number[]
  edition_info?: string | null
  page_count?: number | null
  reading_status: 'read' | 'reading' | 'unread'
  purchase_date?: string | null
  reading_date?: string | null
  purchase_city?: string | null
  description?: string | null
  notes?: string | null
}

interface BookFormProps {
  initialData?: Book | null
  onSubmit: (data: CreateBookInput) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

function toFormValues(book: Book): FormValues {
  return {
    title:          book.title,
    authorName:     book.author_name,
    translatorName: book.translator_name ?? '',
    publisherName:  book.publisher_name ?? '',
    genreName:      book.genre_name ?? '',
    categoryIds:    book.categories.map((c) => c.id),
    edition_info:   book.edition_info ?? '',
    page_count:     book.page_count,
    reading_status: book.reading_status,
    purchase_date:  book.purchase_date ?? '',
    reading_date:   book.reading_date ?? '',
    purchase_city:  book.purchase_city ?? '',
    description:    book.description ?? '',
    notes:          book.notes ?? '',
  }
}

export function BookForm({ initialData, onSubmit, onCancel, loading }: BookFormProps) {
  const { t } = useTranslation()
  const { categories } = useCategoryStore()
  const [authors, setAuthors]         = useState<string[]>([])
  const [translators, setTranslators] = useState<string[]>([])
  const [publishers, setPublishers]   = useState<string[]>([])
  const [genres, setGenres]           = useState<string[]>([])

  const schema = z.object({
    title:          z.string().min(1, t.form.validationTitle),
    authorName:     z.string().min(1, t.form.validationAuthor),
    translatorName: z.string().optional().nullable(),
    publisherName:  z.string().optional().nullable(),
    genreName:      z.string().optional().nullable(),
    categoryIds:    z.array(z.number()),
    edition_info:   z.string().optional().nullable(),
    page_count:     z.coerce.number().int().positive().optional().nullable(),
    reading_status: z.enum(['read', 'reading', 'unread']),
    purchase_date:  z.string().optional().nullable(),
    reading_date:   z.string().optional().nullable(),
    purchase_city:  z.string().optional().nullable(),
    description:    z.string().optional().nullable(),
    notes:          z.string().optional().nullable(),
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? toFormValues(initialData) : { reading_status: 'unread', categoryIds: [] },
  })

  const readingStatus = watch('reading_status')

  useEffect(() => {
    authorsApi().getAll().then((r) => { if (r.ok) setAuthors(r.data.map((a) => a.name)) })
    translatorsApi().getAll().then((r) => { if (r.ok) setTranslators(r.data.map((a) => a.name)) })
    publishersApi().getAll().then((r) => { if (r.ok) setPublishers(r.data.map((a) => a.name)) })
    genresApi().getAll().then((r) => { if (r.ok) setGenres(r.data.map((a) => a.name)) })
  }, [])

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      ...values,
      translatorName: values.translatorName?.trim() || null,
      publisherName:  values.publisherName?.trim()  || null,
      genreName:      values.genreName?.trim()      || null,
      edition_info:   values.edition_info?.trim()   || null,
      purchase_date:  values.purchase_date || null,
      reading_date:   values.reading_date  || null,
      purchase_city:  values.purchase_city?.trim()  || null,
      description:    values.description?.trim()    || null,
      notes:          values.notes?.trim()           || null,
    } as CreateBookInput)
  })

  const fieldClass = 'flex flex-col gap-1'
  const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300'
  const selectClass = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'

  return (
    <form onSubmit={submit} className="space-y-4">
      <Controller
        name="title"
        control={control}
        render={({ field }) => (
          <Input label={t.form.title} error={errors.title?.message} {...field} />
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="authorName"
          control={control}
          render={({ field }) => (
            <Combobox
              label={t.form.author}
              options={authors}
              value={field.value}
              onChange={field.onChange}
              placeholder={t.form.placeholderAuthor}
              error={errors.authorName?.message}
            />
          )}
        />
        <Controller
          name="translatorName"
          control={control}
          render={({ field }) => (
            <Combobox
              label={t.form.translator}
              options={translators}
              value={field.value ?? ''}
              onChange={field.onChange}
              placeholder={t.form.placeholderTranslator}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="publisherName"
          control={control}
          render={({ field }) => (
            <Combobox
              label={t.form.publisher}
              options={publishers}
              value={field.value ?? ''}
              onChange={field.onChange}
              placeholder={t.form.placeholderPublisher}
            />
          )}
        />
        <Controller
          name="genreName"
          control={control}
          render={({ field }) => (
            <Combobox
              label={t.form.genre}
              options={genres}
              value={field.value ?? ''}
              onChange={field.onChange}
              placeholder={t.form.placeholderGenre}
            />
          )}
        />
      </div>

      <Input
        label={t.form.edition}
        placeholder={t.form.placeholderEdition}
        {...register('edition_info')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t.form.pageCount}
          type="number"
          min={1}
          error={errors.page_count?.message}
          {...register('page_count')}
        />
        <div className={fieldClass}>
          <label className={labelClass}>{t.form.status}</label>
          <select className={selectClass} {...register('reading_status')}>
            <option value="unread">{t.form.statusUnread}</option>
            <option value="reading">{t.form.statusReading}</option>
            <option value="read">{t.form.statusRead}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label={t.form.purchaseDate} type="date" {...register('purchase_date')} />
        <Input label={t.form.purchaseCity} placeholder={t.form.placeholderCity} {...register('purchase_city')} />
      </div>

      {(readingStatus === 'read' || readingStatus === 'reading') && (
        <Input label={t.form.readingDate} type="date" {...register('reading_date')} />
      )}

      <div className={fieldClass}>
        <label className={labelClass}>{t.form.category}</label>
        <Controller
          name="categoryIds"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">{t.form.noCategories}</p>
              )}
              {categories.map((c) => {
                const checked = field.value.includes(c.id)
                return (
                  <label
                    key={c.id}
                    className={clsx(
                      'flex items-center gap-1.5 px-2 py-1 rounded-lg border cursor-pointer transition-colors select-none',
                      checked
                        ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={(e) => {
                        field.onChange(
                          e.target.checked
                            ? [...field.value, c.id]
                            : field.value.filter((id) => id !== c.id)
                        )
                      }}
                    />
                    <CategoryBadge name={c.name} color={c.color} />
                  </label>
                )
              })}
            </div>
          )}
        />
      </div>

      <div className={fieldClass}>
        <label className={labelClass}>{t.form.description}</label>
        <textarea
          className={`${selectClass} resize-none`}
          rows={3}
          placeholder={t.form.placeholderDesc}
          {...register('description')}
        />
      </div>

      <div className={fieldClass}>
        <label className={labelClass}>{t.form.notes}</label>
        <textarea
          className={`${selectClass} resize-none`}
          rows={3}
          placeholder={t.form.placeholderNotes}
          {...register('notes')}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>{t.form.cancel}</Button>
        <Button type="submit" disabled={loading}>
          {loading ? t.form.saving : initialData ? t.form.update : t.form.save}
        </Button>
      </div>
    </form>
  )
}
