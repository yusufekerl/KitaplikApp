import type { SqlJsDatabase as Database } from '../SqlJsDatabase'

type LookupTable = 'authors' | 'translators' | 'publishers' | 'genres'

export interface LookupRow {
  id: number
  name: string
  created_at: string
}

export function getAllFromLookup(db: Database.Database, table: LookupTable): LookupRow[] {
  return db.prepare(`SELECT * FROM ${table} ORDER BY name COLLATE NOCASE ASC`).all() as LookupRow[]
}

export function findOrCreateLookup(db: Database.Database, table: LookupTable, name: string): number {
  const trimmed = name.trim()
  const existing = db
    .prepare(`SELECT id FROM ${table} WHERE name = ? COLLATE NOCASE`)
    .get(trimmed) as { id: number } | undefined

  if (existing) return existing.id

  const result = db.prepare(`INSERT INTO ${table} (name) VALUES (?)`).run(trimmed)
  return result.lastInsertRowid as number
}
