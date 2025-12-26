import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data.sqlite");
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  openai_key_enc TEXT,
  model TEXT DEFAULT 'gpt-4o-mini',
  temperature REAL DEFAULT 0.2,
  active_doc_id INTEGER
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding BLOB NOT NULL,
  FOREIGN KEY (doc_id) REFERENCES documents(id) ON DELETE CASCADE
);
`);

db.prepare(`INSERT OR IGNORE INTO settings (id) VALUES (1)`).run();

// migrate older DBs that don't have active_doc_id yet
try {
  db.prepare("SELECT active_doc_id FROM settings WHERE id=1").get();
} catch {
  db.exec("ALTER TABLE settings ADD COLUMN active_doc_id INTEGER;");
}
