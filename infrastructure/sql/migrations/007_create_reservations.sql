-- Migration 007: Reservations table

CREATE TABLE reservations (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    guest_id         UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
    room_id          UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    check_in_date    DATE NOT NULL,
    check_out_date   DATE NOT NULL,
    actual_check_in  TIMESTAMPTZ,
    actual_check_out TIMESTAMPTZ,
    status           VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    adults           INT NOT NULL DEFAULT 1,
    children         INT NOT NULL DEFAULT 0,
    special_requests TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_checkout_after_checkin CHECK (check_out_date > check_in_date)
);

CREATE TRIGGER trg_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY reservation_tenant_isolation ON reservations
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY reservation_tenant_insert ON reservations
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_reservations_tenant_dates ON reservations(tenant_id, check_in_date, check_out_date);
CREATE INDEX idx_reservations_tenant_status ON reservations(tenant_id, status);
CREATE INDEX idx_reservations_tenant_guest ON reservations(tenant_id, guest_id);
CREATE INDEX idx_reservations_tenant_room ON reservations(tenant_id, room_id);
