-- Migration 015: Notifications table

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    recipient_id    UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,
    message         TEXT NOT NULL,
    room_number     VARCHAR(10),
    priority        VARCHAR(10),
    data            JSONB NOT NULL DEFAULT '{}',
    status          VARCHAR(20) NOT NULL DEFAULT 'delivered',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    acknowledged_at TIMESTAMPTZ
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_tenant_isolation ON notifications
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY notification_tenant_insert ON notifications
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_notifications_tenant_recipient_status ON notifications(tenant_id, recipient_id, status);
CREATE INDEX idx_notifications_tenant_created ON notifications(tenant_id, created_at DESC);
