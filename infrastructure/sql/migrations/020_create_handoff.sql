-- Migration 020: Handoff Reports, Notes, and Acknowledgments tables

CREATE TABLE handoff_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    created_by      UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    shift_date      DATE NOT NULL,
    shift_type      VARCHAR(20) NOT NULL,
    department      VARCHAR(20) NOT NULL,
    overall_summary TEXT,
    occupancy_pct   NUMERIC(5,2),
    vip_arrivals    JSONB NOT NULL DEFAULT '[]',
    pending_issues  JSONB NOT NULL DEFAULT '[]',
    status          VARCHAR(20) NOT NULL DEFAULT 'draft',
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_handoff_reports_updated_at
    BEFORE UPDATE ON handoff_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE handoff_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY handoff_report_tenant_isolation ON handoff_reports
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY handoff_report_tenant_insert ON handoff_reports
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_handoff_reports_tenant_date ON handoff_reports(tenant_id, shift_date DESC);
CREATE INDEX idx_handoff_reports_tenant_dept ON handoff_reports(tenant_id, department, shift_date DESC);

-- Handoff Notes (individual items within a report)
CREATE TABLE handoff_notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    report_id   UUID NOT NULL REFERENCES handoff_reports(id) ON DELETE CASCADE,
    category    VARCHAR(30) NOT NULL,
    priority    VARCHAR(10) NOT NULL DEFAULT 'normal',
    content     TEXT NOT NULL,
    room_id     UUID REFERENCES rooms(id) ON DELETE SET NULL,
    guest_id    UUID REFERENCES guests(id) ON DELETE SET NULL,
    requires_action BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE handoff_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY handoff_note_tenant_isolation ON handoff_notes
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY handoff_note_tenant_insert ON handoff_notes
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_handoff_notes_tenant_report ON handoff_notes(tenant_id, report_id);

-- Handoff Acknowledgments
CREATE TABLE handoff_acknowledgments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    report_id       UUID NOT NULL REFERENCES handoff_reports(id) ON DELETE CASCADE,
    acknowledged_by UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes           TEXT
);

ALTER TABLE handoff_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY handoff_ack_tenant_isolation ON handoff_acknowledgments
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY handoff_ack_tenant_insert ON handoff_acknowledgments
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_handoff_ack_tenant_report ON handoff_acknowledgments(tenant_id, report_id);
