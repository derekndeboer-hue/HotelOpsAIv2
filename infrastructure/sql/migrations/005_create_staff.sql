-- Migration 005: Staff table

CREATE TABLE staff (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    role          VARCHAR(30) NOT NULL,
    phone         VARCHAR(20),
    is_active     BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_staff_tenant_email UNIQUE (tenant_id, email)
);

CREATE TRIGGER trg_staff_updated_at
    BEFORE UPDATE ON staff
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_tenant_isolation ON staff
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY staff_tenant_insert ON staff
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_staff_tenant_hotel ON staff(tenant_id, hotel_id);
CREATE INDEX idx_staff_tenant_role ON staff(tenant_id, role);
