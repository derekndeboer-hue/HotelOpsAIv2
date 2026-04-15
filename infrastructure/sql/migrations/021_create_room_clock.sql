-- Migration 021: Room Clock Events and Time Extension Requests tables

-- Room clock events track state transitions for rooms
CREATE TABLE room_clock_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    room_id         UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    event_type      VARCHAR(30) NOT NULL,
    previous_status VARCHAR(30),
    new_status      VARCHAR(30) NOT NULL,
    triggered_by    UUID REFERENCES staff(id) ON DELETE SET NULL,
    reservation_id  UUID REFERENCES reservations(id) ON DELETE SET NULL,
    notes           TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE room_clock_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY room_clock_tenant_isolation ON room_clock_events
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY room_clock_tenant_insert ON room_clock_events
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_room_clock_tenant_room ON room_clock_events(tenant_id, room_id, created_at DESC);
CREATE INDEX idx_room_clock_tenant_hotel_date ON room_clock_events(tenant_id, hotel_id, created_at DESC);
CREATE INDEX idx_room_clock_tenant_type ON room_clock_events(tenant_id, event_type);

-- Time extension requests (e.g., late checkout)
CREATE TABLE time_extension_requests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hotel_id            UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    room_id             UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    reservation_id      UUID REFERENCES reservations(id) ON DELETE SET NULL,
    guest_id            UUID REFERENCES guests(id) ON DELETE SET NULL,
    requested_by        UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    extension_type      VARCHAR(20) NOT NULL,
    original_time       TIMESTAMPTZ NOT NULL,
    requested_time      TIMESTAMPTZ NOT NULL,
    approved_time       TIMESTAMPTZ,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by         UUID REFERENCES staff(id) ON DELETE SET NULL,
    reason              TEXT,
    charge_amount       NUMERIC(10,2),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_time_extension_updated_at
    BEFORE UPDATE ON time_extension_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE time_extension_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY time_ext_tenant_isolation ON time_extension_requests
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY time_ext_tenant_insert ON time_extension_requests
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_time_ext_tenant_room ON time_extension_requests(tenant_id, room_id);
CREATE INDEX idx_time_ext_tenant_status ON time_extension_requests(tenant_id, status);
