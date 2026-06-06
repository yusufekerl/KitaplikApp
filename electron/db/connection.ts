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
  db.save()

  dbInstance = db
  return dbInstance
}
