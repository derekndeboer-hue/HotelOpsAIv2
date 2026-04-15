-- Migration 009: Housekeeping Assignments table

CREATE TABLE housekeeping_assignments (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hotel_id          UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    room_id           UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    assigned_to       UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    assignment_date   DATE NOT NULL,
    priority          INT NOT NULL DEFAULT 0,
    status            VARCHAR(20) NOT NULL DEFAULT 'pending',
    cleaning_type     VARCHAR(20) NOT NULL,
    started_at        TIMESTAMPTZ,
    completed_at      TIMESTAMPTZ,
    actual_minutes    INT,
    inspection_status VARCHAR(20),
    inspected_by      UUID REFERENCES staff(id) ON DELETE SET NULL,
    inspection_notes  TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE housekeeping_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY hk_tenant_isolation ON housekeeping_assignments
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY hk_tenant_insert ON housekeeping_assignments
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_hk_tenant_date ON housekeeping_assignments(tenant_id, assignment_date);
CREATE INDEX idx_hk_tenant_assigned ON housekeeping_assignments(tenant_id, assigned_to, assignment_date);
CREATE INDEX idx_hk_tenant_status ON housekeeping_assignments(tenant_id, status);
CREATE INDEX idx_hk_tenant_room ON housekeeping_assignments(tenant_id, room_id);
