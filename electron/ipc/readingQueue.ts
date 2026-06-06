import { ipcMain } from 'electron'
import type { SqlJsDatabase as Database } from '../db/SqlJsDatabase'
import {
  getAllQueue,
  addToQueue,
  removeFromQueue,
  reorderQueue,
} from '../db/queries/readingQueue'

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

function wrap<T>(fn: () => T): Result<T> {
  try {
    return { ok: true, data: fn() }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function registerReadingQueueHandlers(db: Database.Database) {
  ipcMain.handle('queue:getAll', () =>
    wrap(() => getAllQueue(db))
  )

  ipcMain.handle('queue:add', (_, bookId: number) =>
    wrap(() => addToQueue(db, bookId))
  )

  ipcMain.handle('queue:remove', (_, bookId: number) =>
    wrap(() => removeFromQueue(db, bookId))
  )

  ipcMain.handle('queue:reorder', (_, orderedIds: number[]) =>
    wrap(() => reorderQueue(db, orderedIds))
  )
}
