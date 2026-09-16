import React, { useEffect, useState } from 'react';
import { FileText, Download, Sparkles, ChevronDown } from 'lucide-react';
import { api } from '../api/client.js';
import { Card, Button, Select, Input, EmptyState, ErrorBanner, SkeletonRows } from '../components/ui.jsx';
import { REPORT_TYPE_LABELS } from '../components/badges.jsx';

const REPORT_OPTIONS = Object.entries(REPORT_TYPE_LABELS);

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function defaultPeriod() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { periodStart: isoDate(start), periodEnd: isoDate(end) };
}

function downloadJson(report) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `agrosec-relatorio-${report.report_type}-${report.period_start.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function ReportCard({ report }) {
  const [expanded, setExpanded] = useState(false);
  const m = report.metrics;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="kicker">{REPORT_TYPE_LABELS[report.report_type]}</p>
          <h3 className="mt-1 font-display text-xl text-canopy-50">
            {new Date(report.period_start).toLocaleDateString('pt-BR')} —{' '}
            {new Date(report.period_end).toLocaleDateString('pt-BR')}
          </h3>
          <p className="mt-1 text-xs text-canopy-500">
            Gerado por {report.generated_by_name || 'usuário removido'} em{' '}
            {new Date(report.created_at).toLocaleString('pt-BR')}
          </p>
        </div>
        <Button variant="ghost" onClick={() => downloadJson(report)}>
          <Download className="h-4 w-4" /> Baixar JSON
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-2xl font-display text-canopy-50">{m.nodes.total}</p>
          <p className="text-xs text-canopy-500">Nós monitorados</p>
        </div>
        <div>
          <p className="text-2xl font-display text-sun-300">{m.alerts.total}</p>
          <p className="text-xs text-canopy-500">Alertas no período</p>
        </div>
        <div>
          <p className="text-2xl font-display text-canopy-300">
            {m.alerts.avgMttdSeconds != null ? `${m.alerts.avgMttdSeconds}s` : '—'}
          </p>
          <p className="text-xs text-canopy-500">MTTD médio</p>
        </div>
        <div>
          <p className="text-2xl font-display text-pantanal-400">{m.lgpd.consentsGranted}</p>
          <p className="text-xs text-canopy-500">Consentimentos LGPD</p>
        </div>
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-4 flex items-center gap-1.5 text-xs font-medium text-canopy-400 hover:text-canopy-200"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        {expanded ? 'Ocultar detalhes técnicos' : 'Ver detalhes técnicos'}
      </button>

      {expanded && (
        <pre className="leaf-scrollbar mt-3 max-h-72 overflow-auto rounded-xl bg-canopy-950/60 p-4 text-xs text-canopy-300">
          {JSON.stringify(m, null, 2)}
        </pre>
      )}
    </Card>
  );
}

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ reportType: 'auditability', ...defaultPeriod() });
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const load = () =>
    api
      .listReports()
      .then(setReports)
      .catch((err) => console.error('Falha ao carregar relatórios:', err))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setGenerating(true);
    try {
      await api.createReport(form);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="kicker">Governança &amp; Conformidade</p>
        <h1 className="mt-1 font-display text-3xl text-canopy-50">Relatórios</h1>
        <p className="mt-2 max-w-2xl text-sm text-canopy-400">
          Laudos de auditabilidade, pareceres para instituições financeiras (crédito rural) e
          adequação para auditorias internacionais de exportação — gerados a partir dos dados
          reais da sua operação.
        </p>
      </header>

      <Card>
        <h3 className="flex items-center gap-2 font-display text-lg text-canopy-50">
          <Sparkles className="h-4 w-4 text-sun-300" /> Gerar novo relatório
        </h3>
        <form onSubmit={handleGenerate} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Select
            label="Tipo"
            className="sm:col-span-2"
            value={form.reportType}
            onChange={(e) => setForm({ ...form, reportType: e.target.value })}
          >
            {REPORT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            label="Início do período"
            type="date"
            value={form.periodStart}
            onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
          />
          <Input
            label="Fim do período"
            type="date"
            value={form.periodEnd}
            onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
          />
          <ErrorBanner message={error} />
          <Button type="submit" disabled={generating} className="sm:col-span-4">
            {generating ? 'Compilando métricas...' : 'Gerar relatório'}
          </Button>
        </form>
      </Card>

      {loading ? (
        <SkeletonRows rows={2} className="h-40" />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum relatório gerado ainda"
          description="Gere o primeiro relatório acima para consolidar as métricas de segurança e conformidade do período."
        />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
