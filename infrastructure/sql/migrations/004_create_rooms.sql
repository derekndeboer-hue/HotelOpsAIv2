-- Migration 004: Rooms table

CREATE TABLE rooms (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hotel_id          UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    room_number       VARCHAR(10) NOT NULL,
    floor             INT,
    room_type         VARCHAR(50),
    status            VARCHAR(30) NOT NULL DEFAULT 'clean',
    is_occupied       BOOLEAN NOT NULL DEFAULT false,
    current_guest_id  UUID,
    last_cleaned_at   TIMESTAMPTZ,
    last_inspected_at TIMESTAMPTZ,
    last_inspected_by UUID,
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_rooms_tenant_hotel_number UNIQUE (tenant_id, hotel_id, room_number)
);

CREATE TRIGGER trg_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY room_tenant_isolation ON rooms
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY room_tenant_insert ON rooms
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_rooms_tenant_status ON rooms(tenant_id, status);
CREATE INDEX idx_rooms_tenant_hotel ON rooms(tenant_id, hotel_id);
