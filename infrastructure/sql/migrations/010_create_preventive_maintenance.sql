-- Migration 010: Preventive Maintenance table

CREATE TABLE preventive_maintenance (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hotel_id          UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    frequency         VARCHAR(20) NOT NULL,
    last_completed_at TIMESTAMPTZ,
    next_due_at       TIMESTAMPTZ,
    assigned_to       UUID REFERENCES staff(id) ON DELETE SET NULL,
    rooms_applicable  UUID[] NOT NULL DEFAULT '{}',
    checklist         JSONB NOT NULL DEFAULT '[]',
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE preventive_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY pm_tenant_isolation ON preventive_maintenance
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY pm_tenant_insert ON preventive_maintenance
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_pm_tenant_hotel ON preventive_maintenance(tenant_id, hotel_id);
CREATE INDEX idx_pm_tenant_next_due ON preventive_maintenance(tenant_id, next_due_at) WHERE is_active = true;
