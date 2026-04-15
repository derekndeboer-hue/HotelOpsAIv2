-- Migration 003: Hotels table

CREATE TABLE hotels (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    address     JSONB NOT NULL DEFAULT '{}',
    total_rooms INT,
    timezone    VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
    settings    JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_hotels_updated_at
    BEFORE UPDATE ON hotels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;

CREATE POLICY hotel_tenant_isolation ON hotels
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY hotel_tenant_insert ON hotels
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_hotels_tenant_id ON hotels(tenant_id);
