import { app } from 'electron'
import { join } from 'path'
import { readFileSync, existsSync } from 'fs'
import initSqlJs from 'sql.js'
import { SqlJsDatabase } from './SqlJsDatabase'

let dbInstance: SqlJsDatabase | null = null

export async function getDb(): Promise<SqlJsDatabase> {
  if (dbInstance) return dbInstance

  const isDev = !app.isPackaged
  const userDataPath = app.getPath('userData')
  const dbPath = join(userDataPath, 'kitaplik.db')

  const wasmDir = isDev
    ? join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist')
    : join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'sql.js', 'dist')

  const SQL = await initSqlJs({
    locateFile: (filename: string) => join(wasmDir, filename),
  })

  const sqlDb = existsSync(dbPath)
    ? new SQL.Database(readFileSync(dbPath))
    : new SQL.Database()

  const db = new SqlJsDatabase(sqlDb, dbPath)

  db.pragma('foreign_keys = ON')

  const schemaPath = isDev
    ? join(__dirname, '..', '..', 'electron', 'db', 'schema.sql')
    : join(process.resourcesPath, 'schema.sql')

  const schema = readFileSync(schemaPath, 'utf-8')
  db.exec(schema)
  migrateBookCategoriesToJunctionTable(db)
  db.save()

  dbInstance = db
  return dbInstance
}

/**
 * Eski şemada kitaplar tek bir `category_id` sütunu üzerinden kategoriye bağlıydı.
 * Çoklu kategori desteği için bu veriler `book_categories` ara tablosuna taşınır
 * ve eski sütun kaldırılır. İdempotent: sütun yoksa hiçbir şey yapmaz.
 */
function migrateBookCategoriesToJunctionTable(db: SqlJsDatabase): void {
  const columns = db.prepare('PRAGMA table_info(books)').all() as { name: string }[]
  const hasCategoryId = columns.some((c) => c.name === 'category_id')
  if (!hasCategoryId) return

  db.exec(`
    INSERT OR IGNORE INTO book_categories (book_id, category_id)
    SELECT b.id, b.category_id FROM books b
    JOIN categories c ON c.id = b.category_id
    WHERE b.category_id IS NOT NULL;

    DROP INDEX IF EXISTS idx_books_category;
    ALTER TABLE books DROP COLUMN category_id;
  `)
}
