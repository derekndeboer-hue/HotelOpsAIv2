-- Migration 018: Complaints table

CREATE TABLE complaints (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    guest_id        UUID REFERENCES guests(id) ON DELETE SET NULL,
    reservation_id  UUID REFERENCES reservations(id) ON DELETE SET NULL,
    room_id         UUID REFERENCES rooms(id) ON DELETE SET NULL,
    reported_by     UUID REFERENCES staff(id) ON DELETE SET NULL,
    category        VARCHAR(50) NOT NULL,
    severity        VARCHAR(10) NOT NULL DEFAULT 'medium',
    status          VARCHAR(20) NOT NULL DEFAULT 'open',
    summary         VARCHAR(255) NOT NULL,
    description     TEXT,
    resolution      TEXT,
    resolved_by     UUID REFERENCES staff(id) ON DELETE SET NULL,
    resolved_at     TIMESTAMPTZ,
    follow_up_required BOOLEAN NOT NULL DEFAULT false,
    follow_up_notes TEXT,
    compensation    JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_complaints_updated_at
    BEFORE UPDATE ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY complaints_tenant_isolation ON complaints
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY complaints_tenant_insert ON complaints
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_complaints_tenant_hotel ON complaints(tenant_id, hotel_id);
CREATE INDEX idx_complaints_tenant_status ON complaints(tenant_id, status);
CREATE INDEX idx_complaints_tenant_guest ON complaints(tenant_id, guest_id);
CREATE INDEX idx_complaints_tenant_created ON complaints(tenant_id, created_at DESC);
