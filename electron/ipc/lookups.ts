import { ipcMain } from 'electron'
import type { SqlJsDatabase as Database } from '../db/SqlJsDatabase'
import { getAllFromLookup } from '../db/queries/lookups'

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

function wrap<T>(fn: () => T): Result<T> {
  try {
    return { ok: true, data: fn() }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function registerLookupsHandlers(db: Database.Database) {
  ipcMain.handle('authors:getAll',     () => wrap(() => getAllFromLookup(db, 'authors')))
  ipcMain.handle('translators:getAll', () => wrap(() => getAllFromLookup(db, 'translators')))
  ipcMain.handle('publishers:getAll',  () => wrap(() => getAllFromLookup(db, 'publishers')))
  ipcMain.handle('genres:getAll',      () => wrap(() => getAllFromLookup(db, 'genres')))
}
