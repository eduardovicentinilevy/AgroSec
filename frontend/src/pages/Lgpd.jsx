import React, { useEffect, useState } from 'react';
import { Plus, ScrollText, UserRound, Download, MapPinned } from 'lucide-react';
import { api } from '../api/client.js';
import { Card, Button, Modal, Input, Select, Spinner, EmptyState, ErrorBanner } from '../components/ui.jsx';

const TABS = [
  { key: 'subjects', label: 'Titulares' },
  { key: 'consents', label: 'Consentimentos' },
  { key: 'requests', label: 'Solicitações' },
  { key: 'mapping', label: 'Mapeamento de dados' },
];

export default function Lgpd() {
  const [tab, setTab] = useState('subjects');
  const [subjects, setSubjects] = useState([]);
  const [consents, setConsents] = useState([]);
  const [mapping, setMapping] = useState([]);
  const [loading, setLoading] = useState(true);

  const [subjectModal, setSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', cpf: '', email: '' });

  const [consentModal, setConsentModal] = useState(false);
  const [consentForm, setConsentForm] = useState({ dataSubjectId: '', purpose: '', dataCategories: '' });

  const [requestModal, setRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({ dataSubjectId: '', requestType: 'export' });
  const [requestResult, setRequestResult] = useState(null);

  const [mappingModal, setMappingModal] = useState(false);
  const [mappingForm, setMappingForm] = useState({ dataCategory: '', systemName: '', storageLocation: '', retentionPeriodDays: 365 });

  const [error, setError] = useState('');

  const loadAll = () => {
    setLoading(true);
    return Promise.all([api.listDataSubjects(), api.listConsents(), api.listDataMapping()])
      .then(([s, c, m]) => {
        setSubjects(s);
        setConsents(c);
        setMapping(m);
      })
      .catch((err) => console.error('Falha ao carregar dados de LGPD:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const subjectName = (id) => subjects.find((s) => s.id === id)?.name || id;

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createDataSubject(subjectForm);
      setSubjectModal(false);
      setSubjectForm({ name: '', cpf: '', email: '' });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGrantConsent = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.grantConsent({
        ...consentForm,
        dataCategories: consentForm.dataCategories.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setConsentModal(false);
      setConsentForm({ dataSubjectId: '', purpose: '', dataCategories: '' });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRevokeConsent = async (id) => {
    setError('');
    try {
      await api.revokeConsent(id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const changeTab = (key) => {
    setError('');
    setTab(key);
  };

  const openModal = (setModal) => {
    setError('');
    setModal(true);
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const request = await api.createDataRequest(requestForm);
      const result = await api.fulfillDataRequest(request.id);
      setRequestResult(result);
      setRequestForm({ dataSubjectId: '', requestType: 'export' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateMapping = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createDataMapping(mappingForm);
      setMappingModal(false);
      setMappingForm({ dataCategory: '', systemName: '', storageLocation: '', retentionPeriodDays: 365 });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-canopy-500">Conformidade</p>
        <h1 className="mt-1 font-display text-3xl text-canopy-50">LGPD &amp; Privacidade de Dados</h1>
        <p className="mt-2 max-w-2xl text-sm text-canopy-400">
          Mapeamento de dados, gestão de consentimento e atendimento a solicitações de
          titulares — produtores rurais e colaboradores da operação.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => changeTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-gradient-to-r from-canopy-600 to-canopy-700 text-white shadow-lg shadow-canopy-900/30'
                : 'bg-canopy-900/50 text-canopy-300 hover:bg-canopy-800/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <>
          {tab === 'subjects' && (
            <section className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => openModal(setSubjectModal)}>
                  <Plus className="h-4 w-4" /> Novo titular
                </Button>
              </div>
              {subjects.length === 0 ? (
                <EmptyState icon={UserRound} title="Nenhum titular cadastrado" description="Cadastre produtores rurais ou colaboradores cujos dados são tratados pela plataforma." />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {subjects.map((s) => (
                    <Card key={s.id}>
                      <p className="font-display text-lg text-canopy-50">{s.name}</p>
                      <p className="mt-1 text-xs text-canopy-500">{s.email || 'sem e-mail'}</p>
                      <p className="text-xs text-canopy-500">{s.cpf || 'CPF não informado'}</p>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'consents' && (
            <section className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => openModal(setConsentModal)} disabled={subjects.length === 0}>
                  <Plus className="h-4 w-4" /> Novo consentimento
                </Button>
              </div>
              <ErrorBanner message={error} />
              {consents.length === 0 ? (
                <EmptyState icon={ScrollText} title="Nenhum consentimento registrado" description="Registre o consentimento do titular antes de tratar seus dados pessoais." />
              ) : (
                <Card className="overflow-x-auto p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-canopy-800/60 text-left text-xs uppercase tracking-wide text-canopy-500">
                        <th className="px-5 py-3.5">Titular</th>
                        <th className="px-5 py-3.5">Finalidade</th>
                        <th className="px-5 py-3.5">Categorias</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {consents.map((c) => (
                        <tr key={c.id} className="border-b border-canopy-900/60 last:border-0">
                          <td className="px-5 py-3.5 text-canopy-50">{subjectName(c.data_subject_id)}</td>
                          <td className="px-5 py-3.5 text-canopy-300">{c.purpose}</td>
                          <td className="px-5 py-3.5 text-canopy-400">{(c.data_categories || []).join(', ') || '—'}</td>
                          <td className="px-5 py-3.5">
                            <span className={c.granted ? 'text-canopy-300' : 'text-caatinga-400'}>
                              {c.granted ? 'Concedido' : 'Revogado'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {c.granted && (
                              <button
                                onClick={() => handleRevokeConsent(c.id)}
                                className="text-xs font-medium text-caatinga-400 hover:text-caatinga-300"
                              >
                                Revogar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </section>
          )}

          {tab === 'requests' && (
            <section className="space-y-4">
              <Card>
                <h3 className="font-display text-lg text-canopy-50">Nova solicitação do titular</h3>
                <p className="mt-1 text-sm text-canopy-400">
                  Exportação, acesso ou exclusão de dados pessoais, atendida automaticamente.
                </p>
                <form onSubmit={handleCreateRequest} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Select
                    label="Titular"
                    required
                    value={requestForm.dataSubjectId}
                    onChange={(e) => setRequestForm({ ...requestForm, dataSubjectId: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="Tipo"
                    value={requestForm.requestType}
                    onChange={(e) => setRequestForm({ ...requestForm, requestType: e.target.value })}
                  >
                    <option value="export">Exportação</option>
                    <option value="access">Acesso</option>
                    <option value="delete">Exclusão</option>
                  </Select>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full" disabled={subjects.length === 0}>
                      <Download className="h-4 w-4" /> Solicitar e atender
                    </Button>
                  </div>
                </form>
                <ErrorBanner message={error} />
              </Card>

              {requestResult && (
                <Card>
                  <h4 className="font-display text-base text-canopy-50">Resultado da solicitação</h4>
                  <pre className="leaf-scrollbar mt-3 max-h-64 overflow-auto rounded-xl bg-canopy-950/60 p-4 text-xs text-canopy-300">
                    {JSON.stringify(requestResult, null, 2)}
                  </pre>
                </Card>
              )}
            </section>
          )}

          {tab === 'mapping' && (
            <section className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => openModal(setMappingModal)}>
                  <Plus className="h-4 w-4" /> Novo mapeamento
                </Button>
              </div>
              {mapping.length === 0 ? (
                <EmptyState icon={MapPinned} title="Nenhum mapeamento registrado" description="Documente onde cada categoria de dado pessoal é armazenada e por quanto tempo." />
              ) : (
                <Card className="overflow-x-auto p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-canopy-800/60 text-left text-xs uppercase tracking-wide text-canopy-500">
                        <th className="px-5 py-3.5">Categoria</th>
                        <th className="px-5 py-3.5">Sistema</th>
                        <th className="px-5 py-3.5">Armazenamento</th>
                        <th className="px-5 py-3.5">Retenção</th>
                        <th className="px-5 py-3.5">Base legal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mapping.map((m) => (
                        <tr key={m.id} className="border-b border-canopy-900/60 last:border-0">
                          <td className="px-5 py-3.5 text-canopy-50">{m.data_category}</td>
                          <td className="px-5 py-3.5 text-canopy-300">{m.system_name}</td>
                          <td className="px-5 py-3.5 text-canopy-400">{m.storage_location}</td>
                          <td className="px-5 py-3.5 text-canopy-400">{m.retention_period_days} dias</td>
                          <td className="px-5 py-3.5 text-canopy-400">{m.legal_basis}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </section>
          )}
        </>
      )}

      <Modal open={subjectModal} onClose={() => setSubjectModal(false)} title="Cadastrar titular de dados">
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <Input label="Nome" required value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} />
          <Input label="CPF" value={subjectForm.cpf} onChange={(e) => setSubjectForm({ ...subjectForm, cpf: e.target.value })} placeholder="000.000.000-00" />
          <Input label="E-mail" type="email" value={subjectForm.email} onChange={(e) => setSubjectForm({ ...subjectForm, email: e.target.value })} />
          <ErrorBanner message={error} />
          <Button type="submit" className="w-full">Cadastrar</Button>
        </form>
      </Modal>

      <Modal open={consentModal} onClose={() => setConsentModal(false)} title="Registrar consentimento">
        <form onSubmit={handleGrantConsent} className="space-y-4">
          <Select
            label="Titular"
            required
            value={consentForm.dataSubjectId}
            onChange={(e) => setConsentForm({ ...consentForm, dataSubjectId: e.target.value })}
          >
            <option value="">Selecione...</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Input
            label="Finalidade"
            required
            value={consentForm.purpose}
            onChange={(e) => setConsentForm({ ...consentForm, purpose: e.target.value })}
            placeholder="Monitoramento de produtividade"
          />
          <Input
            label="Categorias de dados (separadas por vírgula)"
            value={consentForm.dataCategories}
            onChange={(e) => setConsentForm({ ...consentForm, dataCategories: e.target.value })}
            placeholder="geolocalizacao, produtividade"
          />
          <ErrorBanner message={error} />
          <Button type="submit" className="w-full">Registrar</Button>
        </form>
      </Modal>

      <Modal open={mappingModal} onClose={() => setMappingModal(false)} title="Novo mapeamento de dados">
        <form onSubmit={handleCreateMapping} className="space-y-4">
          <Input label="Categoria de dado" required value={mappingForm.dataCategory} onChange={(e) => setMappingForm({ ...mappingForm, dataCategory: e.target.value })} placeholder="Geolocalização de propriedade" />
          <Input label="Sistema" required value={mappingForm.systemName} onChange={(e) => setMappingForm({ ...mappingForm, systemName: e.target.value })} placeholder="AgroSec Backend" />
          <Input label="Local de armazenamento" required value={mappingForm.storageLocation} onChange={(e) => setMappingForm({ ...mappingForm, storageLocation: e.target.value })} placeholder="PostgreSQL (Cloud SQL)" />
          <Input
            label="Retenção (dias)"
            type="number"
            value={mappingForm.retentionPeriodDays}
            onChange={(e) => setMappingForm({ ...mappingForm, retentionPeriodDays: Number(e.target.value) })}
          />
          <ErrorBanner message={error} />
          <Button type="submit" className="w-full">Salvar</Button>
        </form>
      </Modal>
    </div>
  );
}
