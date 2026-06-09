import { ipcMain, dialog, app } from 'electron'
import { copyFileSync } from 'fs'
import { join } from 'path'
import * as XLSX from 'xlsx'
import type { SqlJsDatabase as Database } from '../db/SqlJsDatabase'
import { getAllBooksForExport } from '../db/queries/export'

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function registerExportBackupHandlers(db: Database.Database) {
  ipcMain.handle('export:excel', async (): Promise<Result<string | null>> => {
    try {
      const result = await dialog.showSaveDialog({
        title: 'Excel Dosyası Kaydet',
        defaultPath: `kitaplik-${today()}.xlsx`,
        filters: [{ name: 'Excel Dosyası', extensions: ['xlsx'] }],
      })
      if (result.canceled || !result.filePath) return { ok: true, data: null }

      const rows = getAllBooksForExport(db)
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Kitaplar')

      const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }))
      ws['!cols'] = colWidths

      XLSX.writeFile(wb, result.filePath)
      return { ok: true, data: result.filePath }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  })

  ipcMain.handle('backup:save', async (): Promise<Result<string | null>> => {
    try {
      const result = await dialog.showSaveDialog({
        title: 'Veritabanı Yedeğini Kaydet',
        defaultPath: `kitaplik-yedek-${today()}.db`,
        filters: [{ name: 'Veritabanı Dosyası', extensions: ['db'] }],
      })
      if (result.canceled || !result.filePath) return { ok: true, data: null }

      db.save()
      const dbPath = join(app.getPath('userData'), 'kitaplik.db')
      copyFileSync(dbPath, result.filePath)
      return { ok: true, data: result.filePath }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  })
}
