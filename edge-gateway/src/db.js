const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Base local SQLite: a camada primária de leitura/escrita do padrão
// Offline-First (Local-First, Sync-Later). Em um gateway Linux real este é
// o mesmo papel do SQLite; em um app Android equivalente, seria o Room.
const db = new Database(path.join(dataDir, 'gateway.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS local_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    source_ip TEXT,
    raw_payload TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    synced INTEGER NOT NULL DEFAULT 0,
    batch_id TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_local_events_synced ON local_events(synced);
`);

function insertReading({ eventType, sourceIp, rawPayload, occurredAt }) {
  const stmt = db.prepare(`
    INSERT INTO local_events (event_type, source_ip, raw_payload, occurred_at)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(eventType, sourceIp || null, JSON.stringify(rawPayload || {}), occurredAt);
}

function getUnsyncedBatch(limit = 50) {
  return db
    .prepare(`SELECT * FROM local_events WHERE synced = 0 ORDER BY occurred_at ASC LIMIT ?`)
    .all(limit);
}

function markSynced(ids, batchId) {
  const stmt = db.prepare(`UPDATE local_events SET synced = 1, batch_id = ? WHERE id = ?`);
  const tx = db.transaction((rows) => {
    for (const id of rows) stmt.run(batchId, id);
  });
  tx(ids);
}

function countUnsynced() {
  return db.prepare(`SELECT COUNT(*) as n FROM local_events WHERE synced = 0`).get().n;
}

module.exports = { insertReading, getUnsyncedBatch, markSynced, countUnsynced };
