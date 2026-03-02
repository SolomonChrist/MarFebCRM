import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import localforage from 'localforage';

const DB_KEY = 'marfebcrm_db';
const DB_VERSION = 1;

let db: SqlJsDatabase | null = null;

export async function initializeDatabase(): Promise<SqlJsDatabase> {
  if (db) return db;

  try {
    console.log('Initializing database...');

    // Check for reset query parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('reset')) {
      console.log('Reset requested via URL parameter, clearing database...');
      await localforage.removeItem(DB_KEY);
      // Remove reset parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Fetch WASM binary directly
    const wasmResponse = await fetch('/sql-wasm.wasm');
    const wasmBuffer = await wasmResponse.arrayBuffer();
    const wasmBinary = new Uint8Array(wasmBuffer);
    console.log('WASM loaded, size:', wasmBinary.byteLength);

    // Initialize sql.js with preloaded WASM
    const SQL = await initSqlJs({
      wasmBinary,
    });
    console.log('sql.js initialized');

    // Try to load existing database from IndexedDB
    let data = await localforage.getItem<Uint8Array>(DB_KEY);
    console.log('Loaded from localforage:', data ? `${data.byteLength} bytes` : 'null');

    if (data) {
      try {
        console.log('Creating database from saved data');
        db = new SQL.Database(data);
        console.log('Database loaded successfully');
      } catch (loadError) {
        console.warn('Failed to load database from saved data, creating fresh:', loadError);
        // Clear corrupted data
        await localforage.removeItem(DB_KEY);
        // Create fresh database
        console.log('Creating fresh database and initializing schema');
        db = new SQL.Database();
        await initializeSchema();
      }
    } else {
      // Create fresh database
      console.log('Creating fresh database and initializing schema');
      db = new SQL.Database();
      await initializeSchema();
    }

    console.log('Database ready');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Last resort: clear everything and start fresh
    try {
      await localforage.removeItem(DB_KEY);
      console.log('Cleared corrupted database, will recreate on next load');
    } catch (e) {
      console.error('Error clearing database:', e);
    }
    throw error;
  }
}

export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function saveDatabase(): Promise<void> {
  if (!db) {
    console.log('saveDatabase: no db instance');
    return;
  }
  try {
    const data = db.export();
    console.log('Database exported, size:', data.byteLength);
    await localforage.setItem(DB_KEY, data);
    console.log('Database saved to localforage');
  } catch (error) {
    console.error('Error saving database:', error);
    throw error;
  }
}

async function initializeSchema(): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  const schema = `
    -- ===== USERS & SECURITY =====
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      passphrase_salt TEXT NOT NULL,
      passphrase_hash TEXT NOT NULL,
      recovery_code TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS encryption_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      key_version INTEGER,
      key_material TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- ===== CONTACTS =====
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      first_name TEXT NOT NULL,
      last_name TEXT,
      nickname TEXT,
      email TEXT,
      phone TEXT,
      company TEXT,
      hq_score REAL DEFAULT 5.0,
      is_favorite INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contact_aliases (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      alias_name TEXT NOT NULL,
      alias_type TEXT DEFAULT 'nickname',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contact_methods (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      method_type TEXT NOT NULL,
      method_value TEXT NOT NULL,
      label TEXT,
      is_primary INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#6366f1',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, name)
    );

    CREATE TABLE IF NOT EXISTS contact_tags (
      contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (contact_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS custom_field_definitions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      field_name TEXT NOT NULL,
      field_type TEXT DEFAULT 'text',
      is_encrypted INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, field_name)
    );

    CREATE TABLE IF NOT EXISTS custom_field_values (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      field_id TEXT NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
      field_value TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- ===== TIMELINE / NOTES / INTERACTIONS =====
    CREATE TABLE IF NOT EXISTS timeline_entries (
      id TEXT PRIMARY KEY,
      contact_id TEXT REFERENCES contacts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entry_type TEXT NOT NULL,
      plain_text_content TEXT,
      rich_text_content TEXT,
      visibility TEXT DEFAULT 'normal',
      is_encrypted INTEGER DEFAULT 0,
      source TEXT DEFAULT 'typed',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      occurred_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS timeline_entry_tags (
      entry_id TEXT NOT NULL REFERENCES timeline_entries(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (entry_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      entry_id TEXT NOT NULL REFERENCES timeline_entries(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      mime_type TEXT,
      blob_url TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS voice_transcripts (
      id TEXT PRIMARY KEY,
      entry_id TEXT REFERENCES timeline_entries(id) ON DELETE CASCADE,
      raw_transcript TEXT NOT NULL,
      duration_seconds INTEGER,
      language TEXT,
      confidence_score REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- ===== INBOX (unassigned captures) =====
    CREATE TABLE IF NOT EXISTS inbox_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entry_id TEXT NOT NULL REFERENCES timeline_entries(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'needs_review',
      suggested_contact_id TEXT REFERENCES contacts(id),
      suggested_match_confidence REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TEXT
    );

    -- ===== FOLLOW-UPS / TASKS =====
    CREATE TABLE IF NOT EXISTS followups (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0,
      completed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS followup_recurrence (
      id TEXT PRIMARY KEY,
      followup_id TEXT NOT NULL REFERENCES followups(id) ON DELETE CASCADE,
      recurrence_type TEXT,
      recurrence_interval INTEGER,
      recurrence_rule TEXT,
      next_due_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- ===== HQ SCORE HISTORY =====
    CREATE TABLE IF NOT EXISTS hq_score_history (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      old_score REAL,
      new_score REAL NOT NULL,
      reason TEXT NOT NULL,
      changed_by TEXT DEFAULT 'manual',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- ===== DUPLICATE DETECTION & MERGE =====
    CREATE TABLE IF NOT EXISTS duplicate_candidates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      contact_id_1 TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      contact_id_2 TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      match_type TEXT,
      match_confidence REAL,
      reviewed INTEGER DEFAULT 0,
      merged INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS merge_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      source_contact_id TEXT,
      target_contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      merged_data TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- ===== AUDIT LOG =====
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- ===== SETTINGS & BACKUPS =====
    CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      setting_key TEXT NOT NULL,
      setting_value TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, setting_key)
    );

    CREATE TABLE IF NOT EXISTS backup_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      backup_type TEXT,
      backup_format TEXT,
      backup_size_bytes INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- ===== DRAFTS & AUTOSAVE =====
    CREATE TABLE IF NOT EXISTS draft_autosaves (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entry_type TEXT,
      entity_id TEXT,
      draft_content TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- ===== TRANSCRIPTION QUEUE =====
    CREATE TABLE IF NOT EXISTS transcription_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entry_id TEXT REFERENCES timeline_entries(id),
      audio_blob_url TEXT,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      retry_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    db.run(schema);
    await saveDatabase();
  } catch (error) {
    console.error('Error initializing schema:', error);
    throw error;
  }
}

export async function runQuery(sql: string, params: any[] = []): Promise<any> {
  const database = getDatabase();
  try {
    console.log('Running query:', sql.substring(0, 50) + '...', 'params:', params);
    const stmt = database.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
    console.log('Query executed successfully');
    await saveDatabase();
    return { success: true };
  } catch (error) {
    console.error('Error running query:', sql, error);
    throw error;
  }
}

export async function runSelect(sql: string, params: any[] = []): Promise<any[]> {
  const database = getDatabase();
  try {
    const stmt = database.prepare(sql);
    stmt.bind(params);
    const results: any[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (error) {
    console.error('Error running select query:', error);
    throw error;
  }
}
