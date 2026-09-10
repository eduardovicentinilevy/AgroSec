import React, { useEffect, useState } from 'react';
import { Plus, ShieldOff, ShieldCheck, Radio } from 'lucide-react';
import { api } from '../api/client.js';
import { Card, Button, Modal, Input, Select, Spinner, EmptyState, ErrorBanner } from '../components/ui.jsx';
import { NodeStatusBadge, NODE_TYPE_LABELS } from '../components/badges.jsx';

const NODE_TYPES = Object.entries(NODE_TYPE_LABELS);

export default function Nodes() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', nodeType: 'balanca', vlanSegment: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () =>
    api
      .listNodes()
      .then(setNodes)
      .catch((err) => console.error('Falha ao carregar nós:', err))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.createNode(form);
      setModalOpen(false);
      setForm({ name: '', nodeType: 'balanca', vlanSegment: '' });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleIsolation = async (node) => {
    if (node.status === 'isolated') await api.restoreNode(node.id);
    else await api.isolateNode(node.id);
    load();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-canopy-500">Infraestrutura de campo</p>
          <h1 className="mt-1 font-display text-3xl text-canopy-50">Nós operacionais</h1>
          <p className="mt-2 max-w-xl text-sm text-canopy-400">
            Balanças, gateways industriais, estações e servidores — a superfície monitorada
            pelo AgroSec SIEM-Lite.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Novo nó
        </Button>
      </header>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : nodes.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="Nenhum nó cadastrado"
          description="Cadastre balanças, gateways ou sensores para começar o monitoramento."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {nodes.map((node) => (
            <Card key={node.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg text-canopy-50">{node.name}</p>
                  <p className="text-xs text-canopy-500">{NODE_TYPE_LABELS[node.node_type] || node.node_type}</p>
                </div>
                <NodeStatusBadge status={node.status} />
              </div>
              {node.vlan_segment && (
                <p className="text-xs text-canopy-400">VLAN: {node.vlan_segment}</p>
              )}
              <p className="text-xs text-canopy-500">
                Última atividade:{' '}
                {node.last_seen_at ? new Date(node.last_seen_at).toLocaleString('pt-BR') : '—'}
              </p>
              <Button
                variant={node.status === 'isolated' ? 'primary' : 'danger'}
                className="mt-1 w-full"
                onClick={() => toggleIsolation(node)}
              >
                {node.status === 'isolated' ? (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Restaurar acesso
                  </>
                ) : (
                  <>
                    <ShieldOff className="h-4 w-4" /> Isolar (Zero Trust)
                  </>
                )}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Cadastrar nó operacional">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nome"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Balança Pátio 1"
          />
          <Select
            label="Tipo"
            value={form.nodeType}
            onChange={(e) => setForm({ ...form, nodeType: e.target.value })}
          >
            {NODE_TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            label="Segmento VLAN (opcional)"
            value={form.vlanSegment}
            onChange={(e) => setForm({ ...form, vlanSegment: e.target.value })}
            placeholder="VLAN-OT-10"
          />
          <ErrorBanner message={error} />
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Salvando...' : 'Cadastrar nó'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
