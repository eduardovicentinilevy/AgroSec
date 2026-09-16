import React, { useEffect, useState } from 'react';
import { ScrollText, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../api/client.js';
import { Card, Select, EmptyState, SkeletonRows } from '../components/ui.jsx';

const PROCESSED_OPTIONS = [
  { value: '', label: 'Todos os eventos' },
  { value: 'false', label: 'Pendentes de correlação' },
  { value: 'true', label: 'Já processados' },
];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processedFilter, setProcessedFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .listEvents({ processed: processedFilter || undefined, limit: 100 })
      .then(setEvents)
      .catch((err) => console.error('Falha ao carregar eventos:', err))
      .finally(() => setLoading(false));
  }, [processedFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="kicker">Telemetria</p>
          <h1 className="mt-1 font-display text-3xl text-canopy-50">Eventos &amp; Log de atividade</h1>
          <p className="mt-2 max-w-xl text-sm text-canopy-400">
            Fluxo bruto de logs normalizados vindos de balanças, gateways e sensores — a
            fila que o security-engine consome a cada ciclo de correlação.
          </p>
        </div>
        <Select value={processedFilter} onChange={(e) => setProcessedFilter(e.target.value)} className="w-56">
          {PROCESSED_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </header>

      {loading ? (
        <SkeletonRows rows={6} className="h-12" />
      ) : events.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Nenhum evento encontrado"
          description="Assim que os nós de campo ou o edge gateway começarem a reportar, os eventos aparecem aqui em tempo real."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-canopy-800/60 text-left text-xs uppercase tracking-wide text-canopy-500">
                <th className="px-5 py-3.5">Ocorrido em</th>
                <th className="px-5 py-3.5">Tipo</th>
                <th className="px-5 py-3.5">Nó</th>
                <th className="px-5 py-3.5">Origem</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-b border-canopy-900/60 last:border-0">
                  <td className="px-5 py-3.5 text-canopy-400">
                    {new Date(ev.occurred_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-canopy-100">{ev.event_type}</td>
                  <td className="px-5 py-3.5 text-canopy-300">{ev.node_name || '—'}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-canopy-500">{ev.source_ip || '—'}</td>
                  <td className="px-5 py-3.5">
                    {ev.processed ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-canopy-300">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Processado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sun-300">
                        <Clock className="h-3.5 w-3.5" /> Pendente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
