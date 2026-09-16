import React, { useEffect, useMemo, useState } from 'react';
import { Sprout, Radio, ShieldCheck, Check } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Button, Input, ErrorBanner, SuccessBanner, Spinner } from '../components/ui.jsx';
import { PLAN_TYPE_LABELS } from '../components/badges.jsx';

const PLANS = [
  {
    type: 'per_hectare',
    icon: Sprout,
    title: 'Por hectare monitorado',
    description: 'Ideal para grandes propriedades e agricultura de precisão.',
    unit: 'hectares',
    pricePerUnit: 0.9,
    priceLabel: 'R$ 0,90 / hectare / mês (estimado)',
  },
  {
    type: 'per_node',
    icon: Radio,
    title: 'Por nó operacional protegido',
    description: 'Balanças, gateways, servidores ERP e sensores IoT cobertos.',
    unit: 'nós',
    pricePerUnit: 150,
    priceLabel: 'R$ 150 / nó / mês',
  },
  {
    type: 'compliance_addon',
    icon: ShieldCheck,
    title: 'Complemento de conformidade',
    description: 'Relatórios de auditabilidade e laudos para crédito rural e exportação.',
    unit: null,
    pricePerUnit: 2000,
    priceLabel: 'R$ 2.000 / mês (fixo)',
  },
];

export default function Subscription() {
  const { session } = useAuth();
  const isAdmin = session?.user?.role === 'admin';

  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('per_node');
  const [units, setUnits] = useState(10);
  const [monthlyValue, setMonthlyValue] = useState('');
  const [manualValue, setManualValue] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () =>
    api
      .getCurrentSubscription()
      .then(setCurrent)
      .catch((err) => console.error('Falha ao carregar plano:', err))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const activePlan = PLANS.find((p) => p.type === selectedPlan);

  const suggestedValue = useMemo(() => {
    if (!activePlan) return 0;
    if (activePlan.unit === null) return activePlan.pricePerUnit;
    return Math.round(activePlan.pricePerUnit * Number(units || 0) * 100) / 100;
  }, [activePlan, units]);

  useEffect(() => {
    if (!manualValue) setMonthlyValue(String(suggestedValue));
  }, [suggestedValue, manualValue]);

  const handleActivate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const payload = {
        planType: selectedPlan,
        monthlyValue: Number(monthlyValue),
        hectaresMonitored: selectedPlan === 'per_hectare' ? Number(units) : 0,
        nodesProtected: selectedPlan === 'per_node' ? Number(units) : 0,
      };
      await api.createSubscription(payload);
      setSuccess('Plano ativado com sucesso.');
      setManualValue(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

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
        <p className="kicker">Monetização</p>
        <h1 className="mt-1 font-display text-3xl text-canopy-50">Plano &amp; Faturamento</h1>
        <p className="mt-2 max-w-2xl text-sm text-canopy-400">
          Cobrança alinhada à intensidade de uso da operação, com faturamento flexível
          acompanhando as janelas de liquidação da colheita.
        </p>
      </header>

      {current && (
        <Card className="border-l-4 border-l-sun-500">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="kicker">Plano ativo</p>
              <h2 className="mt-1 font-display text-2xl text-canopy-50">
                {PLAN_TYPE_LABELS[current.plan_type]}
              </h2>
              <p className="mt-1 text-sm text-canopy-400">
                {current.plan_type === 'per_hectare' && `${current.hectares_monitored} hectares monitorados`}
                {current.plan_type === 'per_node' && `${current.nodes_protected} nós protegidos`}
                {current.plan_type === 'compliance_addon' && 'Módulo de governança e conformidade'}
                {' · '}Ciclo desde {new Date(current.billing_cycle_start).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <p className="font-display text-3xl text-sun-300">
              R$ {Number(current.monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              <span className="text-sm text-canopy-500">/mês</span>
            </p>
          </div>
        </Card>
      )}

      {isAdmin ? (
        <Card>
          <h3 className="font-display text-lg text-canopy-50">
            {current ? 'Alterar plano' : 'Ativar um plano'}
          </h3>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isSelected = plan.type === selectedPlan;
              return (
                <button
                  key={plan.type}
                  type="button"
                  onClick={() => {
                    setSelectedPlan(plan.type);
                    setManualValue(false);
                  }}
                  className={`relative rounded-2xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-sun-400/70 bg-sun-500/10 shadow-lg shadow-sun-900/20'
                      : 'border-canopy-800/60 bg-canopy-950/40 hover:border-canopy-600/60'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute right-3 top-3 rounded-full bg-sun-500 p-1 text-bark-950">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <Icon className={`h-6 w-6 ${isSelected ? 'text-sun-300' : 'text-canopy-400'}`} />
                  <p className="mt-3 font-display text-base text-canopy-50">{plan.title}</p>
                  <p className="mt-1 text-xs text-canopy-400">{plan.description}</p>
                  <p className="mt-3 text-xs font-medium text-canopy-300">{plan.priceLabel}</p>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleActivate} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {activePlan.unit && (
              <Input
                label={`Quantidade de ${activePlan.unit}`}
                type="number"
                min="0"
                value={units}
                onChange={(e) => {
                  setUnits(e.target.value);
                  setManualValue(false);
                }}
              />
            )}
            <Input
              label="Valor mensal (R$)"
              type="number"
              min="0"
              step="0.01"
              value={monthlyValue}
              onChange={(e) => {
                setMonthlyValue(e.target.value);
                setManualValue(true);
              }}
            />
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Ativando...' : current ? 'Atualizar plano' : 'Ativar plano'}
              </Button>
            </div>
          </form>

          <ErrorBanner message={error} />
          <SuccessBanner message={success} />
        </Card>
      ) : (
        !current && (
          <p className="text-sm text-canopy-500">
            Nenhum plano ativo ainda. Peça a um administrador da organização para ativar um.
          </p>
        )
      )}
    </div>
  );
}
