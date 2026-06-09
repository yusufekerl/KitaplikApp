import { ipcMain } from 'electron'
import type { SqlJsDatabase as Database } from '../db/SqlJsDatabase'
import { getStats, getYearlyGoal, setYearlyGoal } from '../db/queries/stats'

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

function wrap<T>(fn: () => T): Result<T> {
  try {
    return { ok: true, data: fn() }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function registerStatsHandlers(db: Database.Database) {
  ipcMain.handle('stats:get', (_, year: number) =>
    wrap(() => getStats(db, year))
  )

  ipcMain.handle('stats:getGoal', (_, year: number) =>
    wrap(() => getYearlyGoal(db, year))
  )

  ipcMain.handle('stats:setGoal', (_, year: number, goal: number) =>
    wrap(() => setYearlyGoal(db, year, goal))
  )
}
