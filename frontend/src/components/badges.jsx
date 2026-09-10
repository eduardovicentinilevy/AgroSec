import React from 'react';
import { ShieldAlert, ShieldCheck, ShieldQuestion, Wifi, WifiOff, ShieldOff } from 'lucide-react';

const SEVERITY_STYLES = {
  critical: 'bg-caatinga-600/20 text-caatinga-400 border-caatinga-600/40',
  high: 'bg-sun-600/20 text-sun-400 border-sun-600/40',
  medium: 'bg-sun-400/10 text-sun-300 border-sun-400/30',
  low: 'bg-canopy-600/20 text-canopy-300 border-canopy-600/40',
};

export function SeverityBadge({ severity }) {
  const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.low;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${style}`}>
      {severity}
    </span>
  );
}

const STATUS_STYLES = {
  open: { style: 'bg-caatinga-600/20 text-caatinga-400 border-caatinga-600/40', icon: ShieldAlert, label: 'Aberto' },
  triaging: { style: 'bg-sun-500/15 text-sun-300 border-sun-500/30', icon: ShieldQuestion, label: 'Em triagem' },
  contained: { style: 'bg-pantanal-500/15 text-pantanal-400 border-pantanal-500/30', icon: ShieldOff, label: 'Contido' },
  resolved: { style: 'bg-canopy-600/20 text-canopy-300 border-canopy-600/40', icon: ShieldCheck, label: 'Resolvido' },
  false_positive: { style: 'bg-bark-700/40 text-bark-200 border-bark-600/50', icon: ShieldCheck, label: 'Falso positivo' },
};

export function AlertStatusBadge({ status }) {
  const cfg = STATUS_STYLES[status] || STATUS_STYLES.open;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.style}`}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}

const NODE_STATUS_STYLES = {
  online: { style: 'bg-canopy-600/20 text-canopy-300 border-canopy-600/40', icon: Wifi, label: 'Online' },
  offline: { style: 'bg-bark-700/40 text-bark-200 border-bark-600/50', icon: WifiOff, label: 'Offline' },
  isolated: { style: 'bg-caatinga-600/20 text-caatinga-400 border-caatinga-600/40', icon: ShieldOff, label: 'Isolado' },
};

export function NodeStatusBadge({ status }) {
  const cfg = NODE_STATUS_STYLES[status] || NODE_STATUS_STYLES.offline;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.style}`}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}

export const NODE_TYPE_LABELS = {
  balanca: 'Balança',
  gateway_industrial: 'Gateway industrial',
  estacao_meteorologica: 'Estação meteorológica',
  servidor_erp: 'Servidor ERP',
  sensor_iot: 'Sensor IoT',
  estacao_trabalho: 'Estação de trabalho',
};
