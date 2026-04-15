-- Migration 019: Concierge Directory and Bookings tables

CREATE TABLE concierge_directory (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    category        VARCHAR(50) NOT NULL,
    subcategory     VARCHAR(50),
    description     TEXT,
    address         JSONB,
    phone           VARCHAR(20),
    email           VARCHAR(255),
    website         TEXT,
    hours           JSONB,
    price_range     VARCHAR(10),
    rating          NUMERIC(2,1),
    tags            JSONB NOT NULL DEFAULT '[]',
    notes           TEXT,
    is_partner      BOOLEAN NOT NULL DEFAULT false,
    commission_rate NUMERIC(5,2),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_concierge_directory_updated_at
    BEFORE UPDATE ON concierge_directory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE concierge_directory ENABLE ROW LEVEL SECURITY;

CREATE POLICY concierge_dir_tenant_isolation ON concierge_directory
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY concierge_dir_tenant_insert ON concierge_directory
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_concierge_dir_tenant_hotel ON concierge_directory(tenant_id, hotel_id);
CREATE INDEX idx_concierge_dir_tenant_category ON concierge_directory(tenant_id, category);

-- Concierge Bookings
CREATE TABLE concierge_bookings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hotel_id            UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    directory_entry_id  UUID REFERENCES concierge_directory(id) ON DELETE SET NULL,
    guest_id            UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
    reservation_id      UUID REFERENCES reservations(id) ON DELETE SET NULL,
    booked_by           UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    booking_type        VARCHAR(50) NOT NULL,
    booking_date        DATE NOT NULL,
    booking_time        TIME,
    party_size          INT,
    status              VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    confirmation_number VARCHAR(100),
    special_requests    TEXT,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_concierge_bookings_updated_at
    BEFORE UPDATE ON concierge_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE concierge_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY concierge_booking_tenant_isolation ON concierge_bookings
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY concierge_booking_tenant_insert ON concierge_bookings
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_concierge_bookings_tenant_guest ON concierge_bookings(tenant_id, guest_id);
CREATE INDEX idx_concierge_bookings_tenant_date ON concierge_bookings(tenant_id, booking_date);
