import type { SqlJsDatabase as Database } from '../SqlJsDatabase'

export interface BookExportRow {
  'Kitap Adı': string
  'Yazar': string
  'Çevirmen': string
  'Yayınevi': string
  'Tür': string
  'Kategoriler': string
  'Durum': string
  'Sayfa Sayısı': number | string
  'Alındığı Tarih': string
  'Okunma Tarihi': string
  'Alındığı Şehir': string
  'Baskı / Yayım Yılı': string
  'Açıklama': string
  'Notlar': string
}

const STATUS_TR: Record<string, string> = {
  read:    'Okundu',
  reading: 'Okunuyor',
  unread:  'Okunmadı',
}

export function getAllBooksForExport(db: Database.Database): BookExportRow[] {
  const rows = db.prepare(`
    SELECT
      b.title,
      a.name  AS author_name,
      t.name  AS translator_name,
      p.name  AS publisher_name,
      g.name  AS genre_name,
      b.reading_status,
      b.page_count,
      b.purchase_date,
      b.reading_date,
      b.purchase_city,
      b.edition_info,
      b.description,
      b.notes,
      b.id
    FROM books b
    JOIN authors a     ON b.author_id    = a.id
    LEFT JOIN translators t ON b.translator_id = t.id
    LEFT JOIN publishers  p ON b.publisher_id  = p.id
    LEFT JOIN genres      g ON b.genre_id      = g.id
    ORDER BY b.title COLLATE NOCASE
  `).all() as {
    title: string; author_name: string; translator_name: string | null
    publisher_name: string | null; genre_name: string | null
    reading_status: string; page_count: number | null
    purchase_date: string | null; reading_date: string | null
    purchase_city: string | null; edition_info: string | null
    description: string | null; notes: string | null; id: number
  }[]

  if (rows.length === 0) return []

  const placeholders = rows.map(() => '?').join(', ')
  const catLinks = db.prepare(`
    SELECT bc.book_id, c.name
    FROM book_categories bc
    JOIN categories c ON c.id = bc.category_id
    WHERE bc.book_id IN (${placeholders})
    ORDER BY c.name COLLATE NOCASE
  `).all(...rows.map((r) => r.id)) as { book_id: number; name: string }[]

  const catMap = new Map<number, string[]>()
  for (const link of catLinks) {
    const list = catMap.get(link.book_id) ?? []
    list.push(link.name)
    catMap.set(link.book_id, list)
  }

  return rows.map((r) => ({
    'Kitap Adı':           r.title,
    'Yazar':               r.author_name,
    'Çevirmen':            r.translator_name  ?? '',
    'Yayınevi':            r.publisher_name   ?? '',
    'Tür':                 r.genre_name       ?? '',
    'Kategoriler':         (catMap.get(r.id) ?? []).join(', '),
    'Durum':               STATUS_TR[r.reading_status] ?? r.reading_status,
    'Sayfa Sayısı':        r.page_count ?? '',
    'Alındığı Tarih':      r.purchase_date    ?? '',
    'Okunma Tarihi':       r.reading_date     ?? '',
    'Alındığı Şehir':      r.purchase_city    ?? '',
    'Baskı / Yayım Yılı':  r.edition_info     ?? '',
    'Açıklama':            r.description      ?? '',
    'Notlar':              r.notes            ?? '',
  }))
}
