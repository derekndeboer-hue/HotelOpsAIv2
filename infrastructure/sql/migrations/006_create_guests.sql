-- Migration 006: Guests table

CREATE TABLE guests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(255),
    phone       VARCHAR(20),
    vip_status  VARCHAR(20) NOT NULL DEFAULT 'none',
    notes       TEXT,
    total_stays INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_guests_updated_at
    BEFORE UPDATE ON guests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY guest_tenant_isolation ON guests
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY guest_tenant_insert ON guests
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_guests_tenant ON guests(tenant_id);
CREATE INDEX idx_guests_tenant_email ON guests(tenant_id, email);
CREATE INDEX idx_guests_tenant_name ON guests(tenant_id, last_name, first_name);

-- Deferred FKs: rooms columns that reference staff (005) and guests (006)
ALTER TABLE rooms
    ADD CONSTRAINT fk_rooms_current_guest FOREIGN KEY (current_guest_id)
        REFERENCES guests(id) ON DELETE SET NULL;

ALTER TABLE rooms
    ADD CONSTRAINT fk_rooms_last_inspected_by FOREIGN KEY (last_inspected_by)
        REFERENCES staff(id) ON DELETE SET NULL;
