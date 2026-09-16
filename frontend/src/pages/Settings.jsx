import React, { useEffect, useState } from 'react';
import { Building2, UserCircle } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Button, Input, Select, ErrorBanner, SuccessBanner, Spinner } from '../components/ui.jsx';
import { RoleBadge, ORG_SEGMENT_LABELS } from '../components/badges.jsx';

const SEGMENT_OPTIONS = Object.entries(ORG_SEGMENT_LABELS);

export default function Settings() {
  const { session } = useAuth();
  const isAdmin = session?.user?.role === 'admin';

  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', cnpj: '', segment: 'propriedade_precisao' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getMyOrganization()
      .then((data) => {
        setOrg(data);
        setForm({ name: data.name, cnpj: data.cnpj || '', segment: data.segment });
      })
      .catch((err) => console.error('Falha ao carregar organização:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const updated = await api.updateMyOrganization(form);
      setOrg(updated);
      setSuccess('Dados da organização atualizados.');
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
    <div className="space-y-6">
      <header>
        <p className="kicker">Preferências</p>
        <h1 className="mt-1 font-display text-3xl text-canopy-50">Configurações</h1>
        <p className="mt-2 max-w-2xl text-sm text-canopy-400">
          Dados da organização e da sua conta na plataforma AgroSec.
        </p>
      </header>

      <Card>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-canopy-600/15 p-2.5 text-canopy-300">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg text-canopy-50">Organização</h3>
            <p className="text-xs text-canopy-500">
              {isAdmin ? 'Somente administradores podem editar estes dados.' : 'Visível apenas para leitura.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nome da organização"
            required
            disabled={!isAdmin}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Select
            label="Segmento"
            disabled={!isAdmin}
            value={form.segment}
            onChange={(e) => setForm({ ...form, segment: e.target.value })}
          >
            {SEGMENT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            label="CNPJ (opcional)"
            disabled={!isAdmin}
            value={form.cnpj}
            onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
            placeholder="00.000.000/0001-00"
            className="sm:col-span-2"
          />

          {isAdmin && (
            <div className="sm:col-span-2">
              <ErrorBanner message={error} />
              <SuccessBanner message={success} />
              <Button type="submit" disabled={saving} className="mt-3">
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          )}
        </form>
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-sun-500/15 p-2.5 text-sun-300">
            <UserCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg text-canopy-50">Sua conta</h3>
            <p className="text-xs text-canopy-500">Identidade usada para autenticação e auditoria de ações.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-canopy-300">Nome</p>
            <p className="text-sm text-canopy-50">{session?.user?.name}</p>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-canopy-300">E-mail</p>
            <p className="text-sm text-canopy-50">{session?.user?.email}</p>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-canopy-300">Papel</p>
            <RoleBadge role={session?.user?.role} />
          </div>
        </div>
      </Card>
    </div>
  );
}
