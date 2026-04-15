-- Migration 013: Daily Schedules and Task Instances tables

CREATE TABLE daily_schedules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hotel_id    UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    date        DATE NOT NULL,
    department  VARCHAR(20) NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ
);

ALTER TABLE daily_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY schedule_tenant_isolation ON daily_schedules
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY schedule_tenant_insert ON daily_schedules
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_schedules_tenant_date ON daily_schedules(tenant_id, date);
CREATE INDEX idx_schedules_tenant_dept_date ON daily_schedules(tenant_id, department, date);

-- Task Instances
CREATE TABLE task_instances (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hotel_id          UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    template_id       UUID REFERENCES task_templates(id) ON DELETE SET NULL,
    schedule_id       UUID NOT NULL REFERENCES daily_schedules(id) ON DELETE CASCADE,
    assigned_to       UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    date              DATE NOT NULL,
    scheduled_time    TIME,
    estimated_minutes INT,
    actual_minutes    INT,
    status            VARCHAR(20) NOT NULL DEFAULT 'pending',
    schedule_type     VARCHAR(20),
    location          VARCHAR(100),
    zone              VARCHAR(20),
    notes             TEXT,
    photos            JSONB NOT NULL DEFAULT '[]',
    deferral_reason   TEXT,
    completed_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE task_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY task_instance_tenant_isolation ON task_instances
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY task_instance_tenant_insert ON task_instances
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_task_instances_tenant_assigned_date ON task_instances(tenant_id, assigned_to, date);
CREATE INDEX idx_task_instances_tenant_schedule ON task_instances(tenant_id, schedule_id);
CREATE INDEX idx_task_instances_tenant_status ON task_instances(tenant_id, status);
