-- Migration 008: Work Orders table

CREATE TABLE work_orders (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hotel_id         UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    room_id          UUID REFERENCES rooms(id) ON DELETE SET NULL,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    category         VARCHAR(30) NOT NULL,
    priority         VARCHAR(10) NOT NULL DEFAULT 'medium',
    status           VARCHAR(20) NOT NULL DEFAULT 'open',
    reported_by      UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    assigned_to      UUID REFERENCES staff(id) ON DELETE SET NULL,
    estimated_minutes INT,
    actual_minutes   INT,
    parts_used       JSONB NOT NULL DEFAULT '[]',
    photos           JSONB NOT NULL DEFAULT '[]',
    resolution_notes TEXT,
    due_date         TIMESTAMPTZ,
    completed_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_work_orders_updated_at
    BEFORE UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY work_order_tenant_isolation ON work_orders
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY work_order_tenant_insert ON work_orders
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_work_orders_tenant_status ON work_orders(tenant_id, status);
CREATE INDEX idx_work_orders_tenant_hotel ON work_orders(tenant_id, hotel_id);
CREATE INDEX idx_work_orders_tenant_assigned ON work_orders(tenant_id, assigned_to);
CREATE INDEX idx_work_orders_tenant_priority ON work_orders(tenant_id, priority, status);
CREATE INDEX idx_work_orders_tenant_category ON work_orders(tenant_id, category);
