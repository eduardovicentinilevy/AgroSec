const fetch = require('node-fetch');
const { getNextBatch, markSynced, countUnsynced } = require('./db');

let simulatedOffline = false;

function setSimulatedOffline(value) {
  simulatedOffline = value;
}

// Monitora "conectividade" (aqui, uma flag simulada) e, quando disponível,
// empacota os registros pendentes em um lote e envia ao backend. O
// client_batch_id é atribuído e persistido localmente antes do envio (ver
// getNextBatch em db.js), garantindo idempotência real: se o envio falhar
// depois do servidor já ter persistido o lote, a próxima tentativa reenvia
// o MESMO id e reconhece a resposta como duplicata em vez de inserir tudo
// de novo.
async function trySync({ backendUrl, apiToken, nodeId }) {
  if (simulatedOffline) {
    console.log(`[edge-gateway] offline (simulado) — ${countUnsynced()} registro(s) na fila local`);
    return;
  }

  const { batchId: clientBatchId, rows: batch } = getNextBatch(50);
  if (batch.length === 0) return;

  const records = batch.map((row) => ({
    eventType: row.event_type,
    sourceIp: row.source_ip,
    occurredAt: row.occurred_at,
    rawPayload: JSON.parse(row.raw_payload),
  }));

  try {
    const resp = await fetch(`${backendUrl}/api/sync/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ nodeId, clientBatchId, records }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${text}`);
    }

    const result = await resp.json();
    markSynced(
      batch.map((r) => r.id),
      clientBatchId
    );
    console.log(`[edge-gateway] sync ok: lote ${clientBatchId} (${result.recordCount || batch.length} registros)`);
  } catch (err) {
    console.error(`[edge-gateway] falha ao sincronizar, mantendo dados na fila local: ${err.message}`);
  }
}

module.exports = { trySync, setSimulatedOffline };
