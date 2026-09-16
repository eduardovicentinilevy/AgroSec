import React, { useEffect, useState } from 'react';
import { ShieldOff, Undo2 } from 'lucide-react';
import { api } from '../api/client.js';
import { Card, Button, EmptyState, ErrorBanner, SkeletonRows } from '../components/ui.jsx';
import { SeverityBadge, ContainmentStatusBadge, CONTAINMENT_ACTION_LABELS } from '../components/badges.jsx';

export default function Containment() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rollingBackId, setRollingBackId] = useState(null);

  const load = () =>
    api
      .listContainmentActions()
      .then(setActions)
      .catch((err) => console.error('Falha ao carregar contenções:', err))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleRollback = async (action) => {
    setError('');
    setRollingBackId(action.id);
    try {
      await api.rollbackContainment(action.id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setRollingBackId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="kicker">Zero Trust</p>
        <h1 className="mt-1 font-display text-3xl text-canopy-50">Histórico de contenções</h1>
        <p className="mt-2 max-w-2xl text-sm text-canopy-400">
          Toda ação de isolamento de rede disparada por um alerta — manual ou automatizada —
          fica registrada aqui, com trilha de auditoria completa e possibilidade de reversão.
        </p>
      </header>

      <ErrorBanner message={error} />

      {loading ? (
        <SkeletonRows rows={4} className="h-20" />
      ) : actions.length === 0 ? (
        <EmptyState
          icon={ShieldOff}
          title="Nenhuma contenção registrada"
          description="Quando um alerta for contido (manualmente ou pelo security-engine), a ação aparece aqui."
        />
      ) : (
        <div className="space-y-4">
          {actions.map((action) => (
            <Card
              key={action.id}
              className={`border-l-4 ${
                action.status === 'rolled_back' ? 'border-l-canopy-500' : 'border-l-caatinga-500'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ContainmentStatusBadge status={action.status} />
                    <SeverityBadge severity={action.alert_severity} />
                    <span className="text-xs text-canopy-500">
                      {CONTAINMENT_ACTION_LABELS[action.action_type] || action.action_type}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-lg text-canopy-50">{action.alert_title}</h3>
                  <p className="mt-1 text-sm text-canopy-400">
                    Nó afetado: {action.node_name || 'não identificado'}
                  </p>
                  <p className="mt-2 text-xs text-canopy-500">
                    {new Date(action.executed_at).toLocaleString('pt-BR')}
                  </p>
                </div>

                {action.status === 'executed' && (
                  <Button
                    variant="ghost"
                    onClick={() => handleRollback(action)}
                    disabled={rollingBackId === action.id}
                  >
                    <Undo2 className="h-4 w-4" />
                    {rollingBackId === action.id ? 'Revertendo...' : 'Reverter contenção'}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
