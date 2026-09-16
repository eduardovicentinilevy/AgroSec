-- Relatórios de conformidade — implementa o "Adicional de Governança e
-- Conformidade de Dados" descrito na pesquisa de modelo de negócio: laudos
-- de auditabilidade, pareceres para crédito rural e adequação de exportação.
-- Cada relatório é um snapshot imutável das métricas operacionais no
-- período selecionado, guardado como JSON para consulta e auditoria futura.

CREATE TABLE compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    report_type VARCHAR(30) NOT NULL
        CHECK (report_type IN ('auditability', 'rural_credit', 'export_compliance')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_compliance_reports_org ON compliance_reports(org_id, created_at DESC);
