// lib/db.js — SQLite database (node:sqlite built-in)

import { DatabaseSync } from 'node:sqlite';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'data', 'app.db');

// Pastikan folder data ada
import { mkdirSync } from 'node:fs';
mkdirSync(join(__dirname, '..', 'data'), { recursive: true });

const db = new DatabaseSync(DB_PATH);

// Inisialisasi tabel
db.exec(`
  CREATE TABLE IF NOT EXISTS reading_positions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id   TEXT    NOT NULL,
    manga_slug  TEXT    NOT NULL,
    chapter_id  TEXT    NOT NULL,
    page        INTEGER NOT NULL DEFAULT 1,
    chapter_num TEXT,
    updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_positions_device_manga
    ON reading_positions (device_id, manga_slug);
`);

/**
 * Simpan atau update posisi baca.
 */
export function upsertPosition({ deviceId, mangaSlug, chapterId, page, chapterNum }) {
  const stmt = db.prepare(`
    INSERT INTO reading_positions (device_id, manga_slug, chapter_id, page, chapter_num, updated_at)
    VALUES (?, ?, ?, ?, ?, unixepoch())
    ON CONFLICT (device_id, manga_slug)
    DO UPDATE SET
      chapter_id  = excluded.chapter_id,
      page        = excluded.page,
      chapter_num = excluded.chapter_num,
      updated_at  = unixepoch()
  `);
  stmt.run(deviceId, mangaSlug, chapterId, page || 1, chapterNum || null);
}

/**
 * Ambil posisi baca untuk satu manga.
 */
export function getPosition({ deviceId, mangaSlug }) {
  const stmt = db.prepare(`
    SELECT chapter_id, page, chapter_num, updated_at
    FROM reading_positions
    WHERE device_id = ? AND manga_slug = ?
  `);
  return stmt.get(deviceId, mangaSlug) || null;
}

/**
 * Ambil semua posisi baca untuk satu device (untuk sync).
 */
export function getAllPositions({ deviceId }) {
  const stmt = db.prepare(`
    SELECT manga_slug, chapter_id, page, chapter_num, updated_at
    FROM reading_positions
    WHERE device_id = ?
    ORDER BY updated_at DESC
    LIMIT 100
  `);
  return stmt.all(deviceId);
}

export default db;
