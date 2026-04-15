-- Migration 017: Guest Intelligence tables

-- Guest Practices: preferences and patterns learned per guest
CREATE TABLE guest_practices (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    guest_id    UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    category    VARCHAR(50) NOT NULL,
    key         VARCHAR(100) NOT NULL,
    value       TEXT,
    confidence  NUMERIC(3,2) DEFAULT 1.00,
    source      VARCHAR(30),
    noted_by    UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_guest_practices_updated_at
    BEFORE UPDATE ON guest_practices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE guest_practices ENABLE ROW LEVEL SECURITY;

CREATE POLICY guest_practices_tenant_isolation ON guest_practices
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY guest_practices_tenant_insert ON guest_practices
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_guest_practices_tenant_guest ON guest_practices(tenant_id, guest_id);
CREATE INDEX idx_guest_practices_tenant_category ON guest_practices(tenant_id, category);

-- Guest Interactions: log of notable interactions
CREATE TABLE guest_interactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    guest_id        UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    reservation_id  UUID REFERENCES reservations(id) ON DELETE SET NULL,
    staff_id        UUID REFERENCES staff(id) ON DELETE SET NULL,
    interaction_type VARCHAR(30) NOT NULL,
    sentiment       VARCHAR(20),
    summary         TEXT,
    details         JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE guest_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY guest_interactions_tenant_isolation ON guest_interactions
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY guest_interactions_tenant_insert ON guest_interactions
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_guest_interactions_tenant_guest ON guest_interactions(tenant_id, guest_id);
CREATE INDEX idx_guest_interactions_tenant_date ON guest_interactions(tenant_id, created_at DESC);
