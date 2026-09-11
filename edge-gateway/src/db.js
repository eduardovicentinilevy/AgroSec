const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
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
    batch_id TEXT,
    pending_batch_id TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_local_events_synced ON local_events(synced);
`);

// Retrocompatibilidade com um banco local criado antes da coluna existir.
try {
  db.exec('ALTER TABLE local_events ADD COLUMN pending_batch_id TEXT');
} catch {
  // coluna já existe
}

function insertReading({ eventType, sourceIp, rawPayload, occurredAt }) {
  const stmt = db.prepare(`
    INSERT INTO local_events (event_type, source_ip, raw_payload, occurred_at)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(eventType, sourceIp || null, JSON.stringify(rawPayload || {}), occurredAt);
}

// Seleciona o próximo lote a enviar. Se um lote já foi marcado como "em
// trânsito" (pending_batch_id) numa tentativa anterior que falhou antes de
// confirmarmos a resposta do servidor, reutiliza o MESMO id e o MESMO
// conjunto de linhas em vez de sortear um novo client_batch_id — caso
// contrário, uma falha de rede depois do servidor já ter persistido o lote
// faria o gateway reenviar os mesmos registros sob um id diferente, e o
// backend não teria como reconhecer a duplicata.
function getNextBatch(limit = 50) {
  const inFlight = db
    .prepare(
      `SELECT * FROM local_events WHERE synced = 0 AND pending_batch_id IS NOT NULL ORDER BY occurred_at ASC LIMIT ?`
    )
    .all(limit);
  if (inFlight.length > 0) {
    return { batchId: inFlight[0].pending_batch_id, rows: inFlight };
  }

  const fresh = db
    .prepare(
      `SELECT * FROM local_events WHERE synced = 0 AND pending_batch_id IS NULL ORDER BY occurred_at ASC LIMIT ?`
    )
    .all(limit);
  if (fresh.length === 0) return { batchId: null, rows: [] };

  const batchId = randomUUID();
  const assign = db.prepare(`UPDATE local_events SET pending_batch_id = ? WHERE id = ?`);
  const tx = db.transaction((rows) => {
    for (const row of rows) assign.run(batchId, row.id);
  });
  tx(fresh);

  return { batchId, rows: fresh };
}

function markSynced(ids, batchId) {
  const stmt = db.prepare(
    `UPDATE local_events SET synced = 1, batch_id = ?, pending_batch_id = NULL WHERE id = ?`
  );
  const tx = db.transaction((rows) => {
    for (const id of rows) stmt.run(batchId, id);
  });
  tx(ids);
}

function countUnsynced() {
  return db.prepare(`SELECT COUNT(*) as n FROM local_events WHERE synced = 0`).get().n;
}

module.exports = { insertReading, getNextBatch, markSynced, countUnsynced };
