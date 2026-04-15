-- Migration 016: Compliance Items and Completions tables

CREATE TABLE compliance_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    category        VARCHAR(50) NOT NULL,
    frequency       VARCHAR(20) NOT NULL,
    regulatory_body VARCHAR(100),
    due_date        DATE,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_compliance_items_updated_at
    BEFORE UPDATE ON compliance_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY compliance_item_tenant_isolation ON compliance_items
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY compliance_item_tenant_insert ON compliance_items
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_compliance_items_tenant_hotel ON compliance_items(tenant_id, hotel_id);
CREATE INDEX idx_compliance_items_tenant_category ON compliance_items(tenant_id, category);

-- Compliance Completions
CREATE TABLE compliance_completions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    compliance_item_id UUID NOT NULL REFERENCES compliance_items(id) ON DELETE CASCADE,
    completed_by      UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    completed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes             TEXT,
    evidence_urls     JSONB NOT NULL DEFAULT '[]',
    next_due_date     DATE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE compliance_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY compliance_completion_tenant_isolation ON compliance_completions
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY compliance_completion_tenant_insert ON compliance_completions
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_compliance_completions_tenant_item ON compliance_completions(tenant_id, compliance_item_id);
CREATE INDEX idx_compliance_completions_tenant_date ON compliance_completions(tenant_id, completed_at DESC);
