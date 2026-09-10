import React, { useEffect, useState } from 'react';
import { Plus, Fingerprint } from 'lucide-react';
import { api } from '../api/client.js';
import { Card, Button, Modal, Input, Select, Spinner, EmptyState, ErrorBanner } from '../components/ui.jsx';
import { SeverityBadge } from '../components/badges.jsx';

const IOC_TYPES = [
  { value: 'ip', label: 'Endereço IP' },
  { value: 'hash', label: 'Hash de arquivo' },
  { value: 'domain', label: 'Domínio' },
  { value: 'pattern', label: 'Padrão comportamental' },
];

export default function Iocs() {
  const [iocs, setIocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ iocType: 'ip', value: '', severity: 'medium', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () =>
    api
      .listIocs()
      .then(setIocs)
      .catch((err) => console.error('Falha ao carregar IoCs:', err))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.createIoc(form);
      setModalOpen(false);
      setForm({ iocType: 'ip', value: '', severity: 'medium', description: '' });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-canopy-500">Threat intel</p>
          <h1 className="mt-1 font-display text-3xl text-canopy-50">Indicadores de comprometimento</h1>
          <p className="mt-2 max-w-xl text-sm text-canopy-400">
            Base de IoCs consultada pelo security-engine em cada ciclo de correlação de eventos.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Novo IoC
        </Button>
      </header>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : iocs.length === 0 ? (
        <EmptyState
          icon={Fingerprint}
          title="Nenhum IoC cadastrado"
          description="Cadastre IPs, hashes ou domínios maliciosos conhecidos para enriquecer a correlação."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-canopy-800/60 text-left text-xs uppercase tracking-wide text-canopy-500">
                <th className="px-5 py-3.5">Tipo</th>
                <th className="px-5 py-3.5">Valor</th>
                <th className="px-5 py-3.5">Severidade</th>
                <th className="px-5 py-3.5">Descrição</th>
                <th className="px-5 py-3.5">Origem</th>
              </tr>
            </thead>
            <tbody>
              {iocs.map((ioc) => (
                <tr key={ioc.id} className="border-b border-canopy-900/60 last:border-0">
                  <td className="px-5 py-3.5 text-canopy-200">{ioc.ioc_type}</td>
                  <td className="px-5 py-3.5 font-mono text-canopy-50">{ioc.value}</td>
                  <td className="px-5 py-3.5">
                    <SeverityBadge severity={ioc.severity} />
                  </td>
                  <td className="px-5 py-3.5 text-canopy-400">{ioc.description || '—'}</td>
                  <td className="px-5 py-3.5 text-canopy-500">{ioc.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Cadastrar indicador de comprometimento">
        <form onSubmit={handleCreate} className="space-y-4">
          <Select label="Tipo" value={form.iocType} onChange={(e) => setForm({ ...form, iocType: e.target.value })}>
            {IOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
          <Input
            label="Valor"
            required
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            placeholder="10.42.13.37"
          />
          <Select label="Severidade" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="critical">Crítica</option>
          </Select>
          <Input
            label="Descrição (opcional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="C2 conhecido de ransomware agro"
          />
          <ErrorBanner message={error} />
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Salvando...' : 'Cadastrar IoC'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
