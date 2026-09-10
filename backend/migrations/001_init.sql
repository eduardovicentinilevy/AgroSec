-- AgroSec Edge & Cloud — schema inicial
-- Cobre: organizações/usuários (RBAC), nós operacionais, eventos e IoCs,
-- alertas e contenção (SIEM-Lite), sincronização offline-first,
-- e o módulo de privacidade/LGPD.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- Organizações e usuários
-- =========================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    segment VARCHAR(50) NOT NULL DEFAULT 'propriedade'
        CHECK (segment IN ('cooperativa_trading', 'propriedade_precisao', 'agtech_parceira')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'analyst'
        CHECK (role IN ('admin', 'analyst', 'viewer', 'field_operator')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- Nós operacionais (balanças, gateways industriais, estações,
-- servidores ERP, sensores IoT) — o que o SIEM-Lite monitora
-- =========================================================

CREATE TABLE nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    node_type VARCHAR(40) NOT NULL
        CHECK (node_type IN ('balanca', 'gateway_industrial', 'estacao_meteorologica',
                              'servidor_erp', 'sensor_iot', 'estacao_trabalho')),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    vlan_segment VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'online'
        CHECK (status IN ('online', 'offline', 'isolated')),
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nodes_org ON nodes(org_id);

-- =========================================================
-- Eventos brutos (logs normalizados vindos dos nós / gateways)
-- e indicadores de comprometimento (IoCs)
-- =========================================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    node_id UUID REFERENCES nodes(id) ON DELETE SET NULL,
    event_type VARCHAR(60) NOT NULL,
    source_ip INET,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed BOOLEAN NOT NULL DEFAULT false,
    sync_batch_id UUID
);

CREATE INDEX idx_events_org_processed ON events(org_id, processed);
CREATE INDEX idx_events_node ON events(node_id);
CREATE INDEX idx_events_occurred_at ON events(occurred_at);

CREATE TABLE iocs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ioc_type VARCHAR(20) NOT NULL CHECK (ioc_type IN ('ip', 'hash', 'domain', 'pattern')),
    value TEXT NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium'
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    source VARCHAR(100) NOT NULL DEFAULT 'manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (ioc_type, value)
);

-- =========================================================
-- Alertas correlacionados e ações de contenção (Zero Trust)
-- =========================================================

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    node_id UUID REFERENCES nodes(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    ioc_id UUID REFERENCES iocs(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium'
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'triaging', 'contained', 'resolved', 'false_positive')),
    mttd_seconds INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    contained_at TIMESTAMPTZ
);

CREATE INDEX idx_alerts_org_status ON alerts(org_id, status);

CREATE TABLE containment_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    action_type VARCHAR(30) NOT NULL
        CHECK (action_type IN ('vlan_isolate', 'block_ip', 'disable_node')),
    status VARCHAR(20) NOT NULL DEFAULT 'executed'
        CHECK (status IN ('executed', 'failed', 'rolled_back')),
    executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- Sincronização offline-first (edge gateways)
-- =========================================================

CREATE TABLE sync_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID REFERENCES nodes(id) ON DELETE SET NULL,
    client_batch_id UUID NOT NULL,
    record_count INTEGER NOT NULL DEFAULT 0,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status VARCHAR(20) NOT NULL DEFAULT 'applied'
        CHECK (status IN ('applied', 'duplicate', 'partial')),
    UNIQUE (node_id, client_batch_id)
);

-- =========================================================
-- LGPD & Data Privacy Automation
-- =========================================================

CREATE TABLE data_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    email VARCHAR(255),
    phone VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_subject_id UUID NOT NULL REFERENCES data_subjects(id) ON DELETE CASCADE,
    purpose VARCHAR(255) NOT NULL,
    data_categories TEXT[] NOT NULL DEFAULT '{}',
    granted BOOLEAN NOT NULL DEFAULT true,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ
);

CREATE TABLE data_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_subject_id UUID NOT NULL REFERENCES data_subjects(id) ON DELETE CASCADE,
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('export', 'delete', 'access')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'rejected')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE data_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    data_category VARCHAR(100) NOT NULL,
    system_name VARCHAR(100) NOT NULL,
    storage_location VARCHAR(100) NOT NULL,
    retention_period_days INTEGER NOT NULL DEFAULT 365,
    legal_basis VARCHAR(100) NOT NULL DEFAULT 'consentimento'
);

-- =========================================================
-- Monetização (subscrição por hectare / por nó protegido)
-- =========================================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_type VARCHAR(30) NOT NULL DEFAULT 'per_node'
        CHECK (plan_type IN ('per_hectare', 'per_node', 'compliance_addon')),
    hectares_monitored NUMERIC(12, 2) DEFAULT 0,
    nodes_protected INTEGER DEFAULT 0,
    monthly_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    billing_cycle_start DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
