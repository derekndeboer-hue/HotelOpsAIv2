-- Migration 014: Audit Log table

CREATE TABLE audit_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    user_id             UUID,
    action              VARCHAR(255) NOT NULL,
    resource_type       VARCHAR(50),
    resource_id         UUID,
    old_value           JSONB,
    new_value           JSONB,
    ip_address          INET,
    is_system_generated BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_tenant_isolation ON audit_log
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY audit_tenant_insert ON audit_log
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_audit_tenant_created ON audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_audit_tenant_resource ON audit_log(tenant_id, resource_type, resource_id);
CREATE INDEX idx_audit_tenant_user ON audit_log(tenant_id, user_id);
