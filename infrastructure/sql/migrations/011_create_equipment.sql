-- Migration 011: Equipment table

CREATE TABLE equipment (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hotel_id            UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    tag                 VARCHAR(50) NOT NULL,
    location            VARCHAR(100),
    zone                VARCHAR(20),
    category            VARCHAR(30) NOT NULL,
    manufacturer        VARCHAR(255),
    model               VARCHAR(255),
    serial_number       VARCHAR(255),
    install_date        DATE,
    manufacture_date    DATE,
    warranty_expiration DATE,
    dataplate_photo_url TEXT,
    notes               TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_equipment_tenant_tag UNIQUE (tenant_id, tag)
);

CREATE TRIGGER trg_equipment_updated_at
    BEFORE UPDATE ON equipment
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY equipment_tenant_isolation ON equipment
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY equipment_tenant_insert ON equipment
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_equipment_tenant_hotel ON equipment(tenant_id, hotel_id);
CREATE INDEX idx_equipment_tenant_category ON equipment(tenant_id, category);
