import React, { useEffect, useState } from 'react';
import { UserPlus, Trash2, Users } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Card,
  Button,
  Modal,
  Input,
  Select,
  EmptyState,
  ErrorBanner,
  SuccessBanner,
  SkeletonRows,
} from '../components/ui.jsx';
import { RoleBadge, ROLE_LABELS } from '../components/badges.jsx';

const ROLE_OPTIONS = Object.entries(ROLE_LABELS);

export default function Team() {
  const { session } = useAuth();
  const isAdmin = session?.user?.role === 'admin';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'analyst' });
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () =>
    api
      .listUsers()
      .then(setUsers)
      .catch((err) => console.error('Falha ao carregar equipe:', err))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.inviteUser(form);
      setModalOpen(false);
      setForm({ name: '', email: '', password: '', role: 'analyst' });
      setSuccess(`${form.name} foi adicionado(a) à equipe.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (id, role) => {
    setActionError('');
    setSuccess('');
    try {
      await api.updateUserRole(id, role);
      load();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleRemove = async (user) => {
    setActionError('');
    setSuccess('');
    try {
      await api.removeUser(user.id);
      setSuccess(`${user.name} foi removido(a) da equipe.`);
      load();
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="kicker">Organização</p>
          <h1 className="mt-1 font-display text-3xl text-canopy-50">Equipe</h1>
          <p className="mt-2 max-w-xl text-sm text-canopy-400">
            Controle de acesso baseado em papéis (RBAC) — quem pode triar alertas, isolar
            nós e gerenciar a conformidade LGPD da sua operação.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setModalOpen(true)}>
            <UserPlus className="h-4 w-4" /> Adicionar colaborador
          </Button>
        )}
      </header>

      <SuccessBanner message={success} />
      <ErrorBanner message={actionError} />

      {loading ? (
        <SkeletonRows rows={3} />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum colaborador encontrado" />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-canopy-800/60 text-left text-xs uppercase tracking-wide text-canopy-500">
                <th className="px-5 py-3.5">Nome</th>
                <th className="px-5 py-3.5">E-mail</th>
                <th className="px-5 py-3.5">Papel</th>
                <th className="px-5 py-3.5">Desde</th>
                {isAdmin && <th className="px-5 py-3.5" />}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-canopy-900/60 last:border-0">
                  <td className="px-5 py-3.5 text-canopy-50">
                    {u.name}
                    {u.id === session?.user?.id && (
                      <span className="ml-2 text-xs text-canopy-500">(você)</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-canopy-300">{u.email}</td>
                  <td className="px-5 py-3.5">
                    {isAdmin ? (
                      <Select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="w-52 py-1.5 text-xs"
                      >
                        {ROLE_OPTIONS.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <RoleBadge role={u.role} />
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-canopy-500">
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3.5 text-right">
                      {u.id !== session?.user?.id && (
                        <button
                          onClick={() => handleRemove(u)}
                          className="rounded-lg p-1.5 text-canopy-500 hover:bg-caatinga-600/20 hover:text-caatinga-400"
                          title="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Adicionar colaborador">
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Nome"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Bruno Costa"
          />
          <Input
            label="E-mail"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="bruno@cooperativa.com.br"
          />
          <Input
            label="Senha inicial"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Mínimo 6 caracteres"
          />
          <Select label="Papel" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <ErrorBanner message={error} />
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Adicionando...' : 'Adicionar à equipe'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
