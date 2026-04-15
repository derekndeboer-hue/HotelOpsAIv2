-- Migration 012: Task Templates table

CREATE TABLE task_templates (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                 UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hotel_id                  UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name                      VARCHAR(255) NOT NULL,
    department                VARCHAR(20) NOT NULL,
    category                  VARCHAR(30) NOT NULL,
    schedule_type             VARCHAR(10) NOT NULL,
    frequency                 VARCHAR(20),
    day_of_week               VARCHAR(10),
    scheduled_time            TIME,
    estimated_minutes         INT,
    applicable_areas          JSONB NOT NULL DEFAULT '[]',
    location_type             VARCHAR(20),
    linked_equipment_category VARCHAR(30),
    preferred_assignee        UUID REFERENCES staff(id) ON DELETE SET NULL,
    instructions              TEXT,
    required_skills           JSONB NOT NULL DEFAULT '[]',
    photo_required_on_completion BOOLEAN NOT NULL DEFAULT false,
    is_active                 BOOLEAN NOT NULL DEFAULT true,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_task_templates_updated_at
    BEFORE UPDATE ON task_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY task_template_tenant_isolation ON task_templates
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY task_template_tenant_insert ON task_templates
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_task_templates_tenant_hotel ON task_templates(tenant_id, hotel_id);
CREATE INDEX idx_task_templates_tenant_dept ON task_templates(tenant_id, department);
