import type { SqlJsDatabase as Database } from '../SqlJsDatabase'

export interface Category {
  id: number
  name: string
  color: string
  created_at: string
  book_count?: number
}

export interface CreateCategoryInput {
  name: string
  color: string
}

export function getAllCategories(db: Database.Database): Category[] {
  return db.prepare(`
    SELECT c.*, COUNT(b.id) as book_count
    FROM categories c
    LEFT JOIN books b ON b.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name ASC
  `).all() as Category[]
}

export function createCategory(db: Database.Database, data: CreateCategoryInput): Category {
  const result = db
    .prepare('INSERT INTO categories (name, color) VALUES (?, ?)')
    .run(data.name.trim(), data.color)
  return db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .get(result.lastInsertRowid) as Category
}

export function updateCategory(
  db: Database.Database,
  id: number,
  data: Partial<CreateCategoryInput>
): Category {
  const fields: string[] = []
  const values: unknown[] = []

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name.trim()) }
  if (data.color !== undefined) { fields.push('color = ?'); values.push(data.color) }

  if (fields.length > 0) {
    values.push(id)
    db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  }

  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category
}

export function deleteCategory(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM categories WHERE id = ?').run(id)
}
