import type { SqlJsDatabase as Database } from '../SqlJsDatabase'

type LookupTable = 'authors' | 'translators' | 'publishers' | 'genres'

export interface LookupRow {
  id: number
  name: string
  created_at: string
}

const COL_MAP: Record<LookupTable, string> = {
  authors:     'author_id',
  translators: 'translator_id',
  publishers:  'publisher_id',
  genres:      'genre_id',
}

/** Sadece en az bir kitapta kullanılan kayıtları döner — silinen/değiştirilen değerler önerilerde kalmaz. */
export function getAllFromLookup(db: Database.Database, table: LookupTable): LookupRow[] {
  const col = COL_MAP[table]
  return db.prepare(`
    SELECT DISTINCT l.* FROM ${table} l
    JOIN books b ON b.${col} = l.id
    ORDER BY l.name COLLATE NOCASE ASC
  `).all() as LookupRow[]
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

/** Bir kitabın artık referans vermediği lookup kaydı başka kitapta da kullanılmıyorsa siler (öneri listelerinde hayalet kalmasın diye). */
export function cleanupLookupIfOrphan(db: Database.Database, table: LookupTable, id: number | null): void {
  if (id === null) return
  const col = COL_MAP[table]
  const row = db.prepare(`SELECT COUNT(*) as c FROM books WHERE ${col} = ?`).get(id) as { c: number }
  if (row.c === 0) db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id)
}
