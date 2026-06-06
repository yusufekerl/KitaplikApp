PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS authors (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE COLLATE NOCASE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS translators (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE COLLATE NOCASE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS publishers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE COLLATE NOCASE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS genres (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE COLLATE NOCASE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,
    color      TEXT NOT NULL DEFAULT '#6366f1',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS books (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    title          TEXT    NOT NULL,
    author_id      INTEGER NOT NULL REFERENCES authors(id)     ON DELETE RESTRICT,
    translator_id  INTEGER          REFERENCES translators(id) ON DELETE SET NULL,
    publisher_id   INTEGER          REFERENCES publishers(id)  ON DELETE SET NULL,
    genre_id       INTEGER          REFERENCES genres(id)      ON DELETE SET NULL,
    category_id    INTEGER          REFERENCES categories(id)  ON DELETE SET NULL,
    edition_info   TEXT,
    page_count     INTEGER,
    reading_status TEXT NOT NULL DEFAULT 'unread'
                   CHECK (reading_status IN ('read', 'reading', 'unread')),
    purchase_date  TEXT,
    reading_date   TEXT,
    purchase_city  TEXT,
    description    TEXT,
    notes          TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS books_updated_at
    AFTER UPDATE ON books
    FOR EACH ROW
BEGIN
    UPDATE books SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TABLE IF NOT EXISTS reading_queue (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id  INTEGER NOT NULL UNIQUE REFERENCES books(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_books_author   ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_genre    ON books(genre_id);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_status   ON books(reading_status);
CREATE INDEX IF NOT EXISTS idx_books_title    ON books(title COLLATE NOCASE);
