import Database from "better-sqlite3";
import * as path from "path";

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    const dbPath = path.resolve(
      process.cwd(),
      ".cursor",
      "eval-history.sqlite",
    );
    _db = new Database(dbPath);

    // Initialize schema
    _db.exec(`
      CREATE TABLE IF NOT EXISTS eval_history (
        id TEXT PRIMARY KEY,
        spec_id TEXT,
        content_hash TEXT,
        success INTEGER, 
        feedback JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_spec_id ON eval_history(spec_id);
      CREATE INDEX IF NOT EXISTS idx_created_at ON eval_history(created_at);
    `);
  }
  return _db;
}

export function saveEval(
  id: string,
  specId: string,
  contentHash: string,
  success: boolean,
  feedback: any,
) {
  try {
    const db = getDb();
    const stmt = db.prepare(
      "INSERT INTO eval_history (id, spec_id, content_hash, success, feedback) VALUES (?, ?, ?, ?, ?)",
    );
    stmt.run(
      id,
      specId,
      contentHash,
      success ? 1 : 0,
      JSON.stringify(feedback),
    );

    // Rolling Window Pruning (probabilistic 1/10)
    if (Math.random() < 0.1) {
      pruneHistory(db);
    }
  } catch (err) {
    console.error("Warning: Failed to save eval history to SQLite:", err);
  }
}

export function getLastFailedEval(specId: string): any | null {
  try {
    const db = getDb();
    const stmt = db.prepare(
      "SELECT * FROM eval_history WHERE spec_id = ? AND success = 0 ORDER BY created_at DESC LIMIT 1",
    );
    const result = stmt.get(specId) as any;
    if (result && result.feedback) {
      return JSON.parse(result.feedback);
    }
  } catch (err) {
    console.warn("Warning: Failed to read from eval history:", err);
  }
  return null;
}

function pruneHistory(db: Database.Database) {
  try {
    // Keep only the last 30 days
    db.prepare(
      `DELETE FROM eval_history WHERE created_at < datetime('now', '-30 days')`,
    ).run();
  } catch (e) {
    // ignore pruning errors
  }
}
