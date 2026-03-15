import Database from 'better-sqlite3'

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cv (
      id INTEGER PRIMARY KEY DEFAULT 1,
      raw_text TEXT,
      name TEXT,
      email TEXT,
      phone TEXT,
      location TEXT,
      summary TEXT,
      skills TEXT,
      experience TEXT,
      education TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      linkedin_job_id TEXT UNIQUE,
      title TEXT NOT NULL,
      company TEXT,
      location TEXT,
      posted_date TEXT,
      easy_apply INTEGER DEFAULT 0,
      job_url TEXT,
      description TEXT,
      category TEXT,
      match_score INTEGER,
      match_data TEXT,
      scanned_at TEXT DEFAULT (datetime('now')),
      is_bookmarked INTEGER DEFAULT 0,
      is_hidden INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS scan_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT,
      completed_at TEXT,
      category TEXT,
      jobs_found INTEGER DEFAULT 0,
      status TEXT DEFAULT 'in_progress',
      last_page INTEGER DEFAULT 0,
      error_message TEXT
    );

    CREATE TABLE IF NOT EXISTS cover_letters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER REFERENCES jobs(id),
      content TEXT NOT NULL,
      is_edited INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cv_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_title TEXT NOT NULL,
      company TEXT NOT NULL,
      feedback TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_linkedin_id ON jobs(linkedin_job_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_match_score ON jobs(match_score);
    CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
    CREATE INDEX IF NOT EXISTS idx_jobs_scanned_at ON jobs(scanned_at);
  `)
}
