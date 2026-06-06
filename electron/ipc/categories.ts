import { ipcMain } from 'electron'
import type { SqlJsDatabase as Database } from '../db/SqlJsDatabase'
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CreateCategoryInput,
} from '../db/queries/categories'

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

function wrap<T>(fn: () => T): Result<T> {
  try {
    return { ok: true, data: fn() }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function registerCategoriesHandlers(db: Database.Database) {
  ipcMain.handle('categories:getAll', () =>
    wrap(() => getAllCategories(db))
  )

  ipcMain.handle('categories:create', (_, data: CreateCategoryInput) =>
    wrap(() => createCategory(db, data))
  )

  ipcMain.handle('categories:update', (_, id: number, data: Partial<CreateCategoryInput>) =>
    wrap(() => updateCategory(db, id, data))
  )

  ipcMain.handle('categories:delete', (_, id: number) =>
    wrap(() => deleteCategory(db, id))
  )
}
