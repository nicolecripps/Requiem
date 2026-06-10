import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'
import type { Tab } from '@shared/types'

let db: Database.Database

export function initDb(): void {
  const userDataPath = app.getPath('userData')
  const dbPath = join(userDataPath, 'tabs.db')
  mkdirSync(userDataPath, { recursive: true })

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS tabs (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      title     TEXT NOT NULL,
      artist    TEXT NOT NULL,
      type      TEXT,
      url       TEXT UNIQUE,
      content   TEXT NOT NULL,
      chords    TEXT,
      tuning    TEXT,
      key       TEXT,
      capo      INTEGER,
      added_at  TEXT DEFAULT (datetime('now')),
      pdf_path  TEXT
    )
  `)
}

export function insertTab(tab: Omit<Tab, 'id' | 'added_at'>): Tab {
  const stmt = db.prepare(`
    INSERT INTO tabs (title, artist, type, url, content, chords, tuning, key, capo, pdf_path)
    VALUES (@title, @artist, @type, @url, @content, @chords, @tuning, @key, @capo, @pdf_path)
  `)
  const row = {
    ...tab,
    chords: tab.chords ? JSON.stringify(tab.chords) : null
  }
  const result = stmt.run(row)
  return getTab(result.lastInsertRowid as number)!
}

export function getTab(id: number): Tab | undefined {
  const row = db.prepare('SELECT * FROM tabs WHERE id = ?').get(id) as any
  return row ? deserialise(row) : undefined
}

export function getAllTabs(): Tab[] {
  const rows = db.prepare('SELECT * FROM tabs ORDER BY added_at DESC').all() as any[]
  return rows.map(deserialise)
}

export function searchTabs(query: string): Tab[] {
  const like = `%${query}%`
  const rows = db
    .prepare('SELECT * FROM tabs WHERE title LIKE ? OR artist LIKE ? ORDER BY added_at DESC')
    .all(like, like) as any[]
  return rows.map(deserialise)
}

export function deleteTab(id: number): void {
  db.prepare('DELETE FROM tabs WHERE id = ?').run(id)
}

export function updateTab(
  id: number,
  fields: {
    title: string
    artist: string
    type: string | null
    key: string | null
    capo: number | null
    tuning: string | null
    content: string
    chords: string[] | null
  }
): Tab | undefined {
  db.prepare(`
    UPDATE tabs
    SET title=@title, artist=@artist, type=@type, key=@key,
        capo=@capo, tuning=@tuning, content=@content, chords=@chords
    WHERE id=@id
  `).run({ ...fields, chords: fields.chords ? JSON.stringify(fields.chords) : null, id })
  return getTab(id)
}

export function getExistingUrls(urls: string[]): string[] {
  if (urls.length === 0) return []
  const placeholders = urls.map(() => '?').join(',')
  const rows = db
    .prepare(`SELECT url FROM tabs WHERE url IN (${placeholders})`)
    .all(...urls) as { url: string }[]
  return rows.map(r => r.url)
}

function deserialise(row: any): Tab {
  return {
    ...row,
    chords: row.chords ? JSON.parse(row.chords) : null
  }
}
