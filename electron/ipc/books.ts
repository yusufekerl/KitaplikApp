import { ipcMain } from 'electron'
import type { SqlJsDatabase as Database } from '../db/SqlJsDatabase'
import {
  getAllBooks,
  getBookById,
  getBooksCount,
  createBook,
  updateBook,
  deleteBook,
  type BookFilters,
  type CreateBookInput,
} from '../db/queries/books'

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

function wrap<T>(fn: () => T): Result<T> {
  try {
    return { ok: true, data: fn() }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function registerBooksHandlers(db: Database.Database) {
  ipcMain.handle('books:getAll', (_, filters?: BookFilters) =>
    wrap(() => getAllBooks(db, filters ?? {}))
  )

  ipcMain.handle('books:getCount', () =>
    wrap(() => getBooksCount(db))
  )

  ipcMain.handle('books:getById', (_, id: number) =>
    wrap(() => {
      const book = getBookById(db, id)
      if (!book) throw new Error('Kitap bulunamadı')
      return book
    })
  )

  ipcMain.handle('books:create', (_, data: CreateBookInput) =>
    wrap(() => createBook(db, data))
  )

  ipcMain.handle('books:update', (_, id: number, data: Partial<CreateBookInput>) =>
    wrap(() => updateBook(db, id, data))
  )

  ipcMain.handle('books:delete', (_, id: number) =>
    wrap(() => deleteBook(db, id))
  )
}
