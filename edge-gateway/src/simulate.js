const { randomUUID } = require('crypto');

// Gera leituras plausíveis de campo: telemetria normal de sensores/balanças,
// e ocasionalmente eventos anômalos (varredura de porta, adulteração de
// pesagem) para exercitar o pipeline de correlação do security-engine.
const NORMAL_EVENT_TYPES = ['sensor_reading', 'weighing_receipt', 'heartbeat'];
const ANOMALY_EVENT_TYPES = ['port_probe', 'weighing_value_tampered', 'file_mass_encryption'];

function randomSourceIp() {
  return `10.42.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function generateReading() {
  const isAnomaly = Math.random() < 0.08;
  const eventType = isAnomaly
    ? ANOMALY_EVENT_TYPES[Math.floor(Math.random() * ANOMALY_EVENT_TYPES.length)]
    : NORMAL_EVENT_TYPES[Math.floor(Math.random() * NORMAL_EVENT_TYPES.length)];

  return {
    eventType,
    sourceIp: randomSourceIp(),
    occurredAt: new Date().toISOString(),
    rawPayload: {
      reading_id: randomUUID(),
      value: Number((Math.random() * 1000).toFixed(2)),
      simulated: true,
    },
  };
}

module.exports = { generateReading };
