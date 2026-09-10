import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldOff } from 'lucide-react';
import { api } from '../api/client.js';
import { Card, Button, Select, Spinner, EmptyState } from '../components/ui.jsx';
import { SeverityBadge, AlertStatusBadge } from '../components/badges.jsx';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'open', label: 'Aberto' },
  { value: 'triaging', label: 'Em triagem' },
  { value: 'contained', label: 'Contido' },
  { value: 'resolved', label: 'Resolvido' },
  { value: 'false_positive', label: 'Falso positivo' },
];

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = (status) =>
    api
      .listAlerts(status ? { status } : {})
      .then(setAlerts)
      .catch((err) => console.error('Falha ao carregar alertas:', err))
      .finally(() => setLoading(false));

  useEffect(() => {
    setLoading(true);
    load(statusFilter);
  }, [statusFilter]);

  const handleStatusChange = async (id, status) => {
    await api.updateAlertStatus(id, status);
    load(statusFilter);
  };

  const handleContain = async (id) => {
    await api.containAlert(id);
    load(statusFilter);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-canopy-500">SIEM-Lite</p>
          <h1 className="mt-1 font-display text-3xl text-canopy-50">Alertas correlacionados</h1>
          <p className="mt-2 max-w-xl text-sm text-canopy-400">
            Triagem estilo SOC Tier 1 — correlação automática de IoCs e regras
            comportamentais, com contenção Zero Trust de um clique.
          </p>
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-52">
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </header>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="Nenhum alerta encontrado"
          description="Quando o security-engine correlacionar eventos suspeitos, os alertas aparecerão aqui."
        />
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              className={`border-l-4 ${
                alert.severity === 'critical'
                  ? 'border-l-caatinga-500'
                  : alert.severity === 'high'
                    ? 'border-l-sun-500'
                    : 'border-l-canopy-500'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={alert.severity} />
                    <AlertStatusBadge status={alert.status} />
                    {alert.mttd_seconds != null && (
                      <span className="text-xs text-canopy-500">MTTD: {alert.mttd_seconds}s</span>
                    )}
                  </div>
                  <h3 className="mt-2 font-display text-lg text-canopy-50">{alert.title}</h3>
                  <p className="mt-1 text-sm text-canopy-400">{alert.description}</p>
                  <p className="mt-2 text-xs text-canopy-500">
                    {new Date(alert.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <Select
                    value={alert.status}
                    onChange={(e) => handleStatusChange(alert.id, e.target.value)}
                    className="w-44"
                  >
                    {STATUS_OPTIONS.filter((o) => o.value).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                  {alert.status !== 'contained' && (
                    <Button variant="danger" onClick={() => handleContain(alert.id)}>
                      <ShieldOff className="h-4 w-4" /> Conter
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
