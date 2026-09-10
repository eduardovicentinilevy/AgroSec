require('dotenv').config();
const { insertReading } = require('./db');
const { generateReading } = require('./simulate');
const { trySync, setSimulatedOffline } = require('./sync');

const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
const apiToken = process.env.AGROSEC_API_TOKEN;
const nodeId = process.env.AGROSEC_NODE_ID;
const offlineProbability = Number(process.env.SIMULATED_OFFLINE_PROBABILITY || 0.4);
const readingIntervalMs = Number(process.env.READING_INTERVAL_SECONDS || 3) * 1000;
const syncIntervalMs = Number(process.env.SYNC_INTERVAL_SECONDS || 10) * 1000;

if (!apiToken || !nodeId) {
  console.error(
    '[edge-gateway] Defina AGROSEC_API_TOKEN e AGROSEC_NODE_ID no .env (faça login e crie um nó via API primeiro).'
  );
  process.exit(1);
}

console.log('[edge-gateway] AgroSec Offline-First Secure Gateway iniciado');
console.log(`[edge-gateway] backend: ${backendUrl} | nó: ${nodeId}`);

setInterval(() => {
  const reading = generateReading();
  insertReading(reading);
  console.log(`[edge-gateway] leitura local gravada: ${reading.eventType}`);
}, readingIntervalMs);

// A cada ciclo de sync, decide aleatoriamente se a conexão está disponível,
// simulando a instabilidade de rede rural descrita no modelo de negócio.
setInterval(() => {
  setSimulatedOffline(Math.random() < offlineProbability);
  trySync({ backendUrl, apiToken, nodeId });
}, syncIntervalMs);
