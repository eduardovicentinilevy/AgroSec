import React, { useEffect, useMemo, useState } from 'react';
import { Radio, ShieldAlert, ShieldOff, Leaf } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { api } from '../api/client.js';
import StatCard from '../components/StatCard.jsx';
import { Card, Spinner } from '../components/ui.jsx';
import { SeverityBadge, AlertStatusBadge, NodeStatusBadge } from '../components/badges.jsx';

const SEVERITY_COLORS = {
  critical: '#c9592f',
  high: '#e88a0b',
  medium: '#f9ab1f',
  low: '#26a36c',
};

export default function Dashboard() {
  const [nodes, setNodes] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listNodes(), api.listAlerts()])
      .then(([nodesData, alertsData]) => {
        if (cancelled) return;
        setNodes(nodesData);
        setAlerts(alertsData);
      })
      .catch((err) => console.error('Falha ao carregar visão geral:', err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const online = nodes.filter((n) => n.status === 'online').length;
    const isolated = nodes.filter((n) => n.status === 'isolated').length;
    const openAlerts = alerts.filter((a) => !['resolved', 'false_positive'].includes(a.status));
    const timedAlerts = alerts.filter((a) => a.mttd_seconds != null);
    const avgMttd = timedAlerts.length
      ? timedAlerts.reduce((sum, a) => sum + a.mttd_seconds, 0) / timedAlerts.length
      : 0;

    return { online, isolated, openAlerts: openAlerts.length, avgMttd: Math.round(avgMttd) };
  }, [nodes, alerts]);

  const severityData = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    alerts.forEach((a) => {
      counts[a.severity] = (counts[a.severity] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [alerts]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-canopy-500">Visão geral</p>
        <h1 className="mt-1 font-display text-3xl text-canopy-50">
          Imunidade operacional da sua safra digital
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-canopy-400">
          Monitoramento contínuo de nós de campo, correlação de ameaças e resiliência
          offline-first em um único painel.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Radio} label="Nós online" value={stats.online} accent="canopy" hint={`${nodes.length} nós cadastrados`} />
        <StatCard icon={ShieldOff} label="Nós isolados" value={stats.isolated} accent="caatinga" hint="Contenção Zero Trust ativa" />
        <StatCard icon={ShieldAlert} label="Alertas em aberto" value={stats.openAlerts} accent="sun" hint={`${alerts.length} alertas no total`} />
        <StatCard icon={Leaf} label="MTTD médio" value={`${stats.avgMttd}s`} accent="pantanal" hint="Tempo médio de detecção" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <h3 className="font-display text-lg text-canopy-50">Alertas por severidade</h3>
          {severityData.length === 0 ? (
            <p className="mt-8 text-center text-sm text-canopy-500">Nenhum alerta registrado ainda.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {severityData.map((entry) => (
                      <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0c3527', border: '1px solid #146848', borderRadius: 12, color: '#eefbf3' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#aeebc8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-3">
          <h3 className="font-display text-lg text-canopy-50">Alertas recentes</h3>
          <div className="mt-4 space-y-3">
            {alerts.slice(0, 6).map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-canopy-800/50 bg-canopy-950/40 p-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-canopy-50">{alert.title}</p>
                  <p className="text-xs text-canopy-500">
                    {new Date(alert.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <SeverityBadge severity={alert.severity} />
                  <AlertStatusBadge status={alert.status} />
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="py-8 text-center text-sm text-canopy-500">
                Nenhum alerta correlacionado até o momento — operação sob monitoramento.
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-display text-lg text-canopy-50">Nós operacionais</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {nodes.slice(0, 6).map((node) => (
            <div key={node.id} className="rounded-2xl border border-canopy-800/50 bg-canopy-950/40 p-4">
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-medium text-canopy-50">{node.name}</p>
                <NodeStatusBadge status={node.status} />
              </div>
              <p className="mt-1 text-xs text-canopy-500">{node.node_type}</p>
            </div>
          ))}
          {nodes.length === 0 && (
            <p className="py-4 text-sm text-canopy-500 sm:col-span-2 lg:col-span-3">
              Nenhum nó cadastrado ainda. Vá até "Nós operacionais" para adicionar o primeiro.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
