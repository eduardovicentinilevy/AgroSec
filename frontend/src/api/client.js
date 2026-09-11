const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Chave e leitor de localStorage compartilhados com AuthContext, para que a
// sessão persistida nunca seja parseada (ou reformatada) em dois lugares
// diferentes de forma independente.
export const STORAGE_KEY = 'agrosec.session';

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Lido de forma síncrona no carregamento do módulo (antes de qualquer efeito
// React rodar) para evitar que a primeira requisição de uma página protegida
// saia sem o header Authorization logo após um refresh completo.
let authToken = getStoredSession()?.token || null;

function setToken(token) {
  authToken = token;
}

async function request(path, { method = 'GET', body, params } = {}) {
  const url = new URL(`${API_URL}/api${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
  }

  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new Error(data?.error || `Erro ${res.status}`);
  }
  return data;
}

export const api = {
  setToken,

  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),

  listNodes: () => request('/nodes'),
  createNode: (payload) => request('/nodes', { method: 'POST', body: payload }),
  isolateNode: (id) => request(`/nodes/${id}/isolate`, { method: 'POST' }),
  restoreNode: (id) => request(`/nodes/${id}/restore`, { method: 'POST' }),

  listEvents: (params) => request('/events', { params }),

  listIocs: () => request('/iocs/mine'),
  createIoc: (payload) => request('/iocs', { method: 'POST', body: payload }),

  listAlerts: (params) => request('/alerts', { params }),
  updateAlertStatus: (id, status) => request(`/alerts/${id}/status`, { method: 'PATCH', body: { status } }),
  containAlert: (id) => request(`/alerts/${id}/contain`, { method: 'POST', body: {} }),

  listDataSubjects: () => request('/lgpd/data-subjects'),
  createDataSubject: (payload) => request('/lgpd/data-subjects', { method: 'POST', body: payload }),
  listConsents: () => request('/lgpd/consents'),
  grantConsent: (payload) => request('/lgpd/consents', { method: 'POST', body: payload }),
  revokeConsent: (id) => request(`/lgpd/consents/${id}/revoke`, { method: 'POST' }),
  createDataRequest: (payload) => request('/lgpd/requests', { method: 'POST', body: payload }),
  fulfillDataRequest: (id) => request(`/lgpd/requests/${id}/fulfill`, { method: 'POST' }),
  listDataMapping: () => request('/lgpd/data-mapping'),
  createDataMapping: (payload) => request('/lgpd/data-mapping', { method: 'POST', body: payload }),
};
