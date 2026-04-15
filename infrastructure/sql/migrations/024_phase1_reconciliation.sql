-- Migration 024: Phase 1 reconciliation
-- Aligns rooms, staff, reservations, work_orders, housekeeping_assignments, audit_log
-- with the service-layer column names and adds tables required by Phase 1 services.
-- All operations are idempotent so this can be re-run safely.

-- ------------------------------------------------------------
-- rooms: zone, accessibility, occupancy hints, OOO reason, updated_by
-- ------------------------------------------------------------
ALTER TABLE rooms
    ADD COLUMN IF NOT EXISTS zone VARCHAR(30),
    ADD COLUMN IF NOT EXISTS is_accessible BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS max_occupancy INT,
    ADD COLUMN IF NOT EXISTS bed_type VARCHAR(40),
    ADD COLUMN IF NOT EXISTS out_of_order_reason TEXT,
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES staff(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rooms_tenant_zone ON rooms(tenant_id, zone);

-- ------------------------------------------------------------
-- staff: hire_date, department, last_login alias view (use last_login_at as canonical)
-- ------------------------------------------------------------
ALTER TABLE staff
    ADD COLUMN IF NOT EXISTS hire_date DATE,
    ADD COLUMN IF NOT EXISTS department VARCHAR(50);

-- ------------------------------------------------------------
-- reservations: hotel_id, confirmation_number, expanded status set
-- ------------------------------------------------------------
ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS confirmation_number VARCHAR(40);

CREATE UNIQUE INDEX IF NOT EXISTS uq_reservations_tenant_confirmation
    ON reservations(tenant_id, confirmation_number)
    WHERE confirmation_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_tenant_hotel
    ON reservations(tenant_id, hotel_id);

-- ------------------------------------------------------------
-- work_orders: align column names + add fields the service needs
-- ------------------------------------------------------------
ALTER TABLE work_orders
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES staff(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- Backfill created_by from the existing reported_by column so old rows remain valid.
UPDATE work_orders
SET created_by = reported_by
WHERE created_by IS NULL AND reported_by IS NOT NULL;

-- Make created_by required going forward.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'work_orders' AND column_name = 'created_by' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE work_orders ALTER COLUMN created_by SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_created_by
    ON work_orders(tenant_id, created_by);

-- Comments on work orders
CREATE TABLE IF NOT EXISTS work_order_comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    work_order_id   UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES staff(id) ON DELETE SET NULL,
    content         TEXT NOT NULL,
    is_system       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE work_order_comments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'work_order_comments'
          AND policyname = 'wo_comment_tenant_isolation'
    ) THEN
        CREATE POLICY wo_comment_tenant_isolation ON work_order_comments
            USING (tenant_id = current_setting('app.current_tenant')::UUID);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'work_order_comments'
          AND policyname = 'wo_comment_tenant_insert'
    ) THEN
        CREATE POLICY wo_comment_tenant_insert ON work_order_comments
            FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wo_comments_work_order
    ON work_order_comments(work_order_id, created_at);

-- Photos on work orders
CREATE TABLE IF NOT EXISTS work_order_photos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    work_order_id   UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    caption         TEXT,
    uploaded_by     UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE work_order_photos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'work_order_photos'
          AND policyname = 'wo_photo_tenant_isolation'
    ) THEN
        CREATE POLICY wo_photo_tenant_isolation ON work_order_photos
            USING (tenant_id = current_setting('app.current_tenant')::UUID);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'work_order_photos'
          AND policyname = 'wo_photo_tenant_insert'
    ) THEN
        CREATE POLICY wo_photo_tenant_insert ON work_order_photos
            FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wo_photos_work_order
    ON work_order_photos(work_order_id, created_at);

-- ------------------------------------------------------------
-- housekeeping_assignments: align column names with services
--   migration name -> service name
--   assignment_date -> date
--   cleaning_type   -> type
--   inspection_status -> inspection_result
--   inspected_by    -> inspector_id
--   inspection_notes -> notes
-- Plus add created_by, updated_at, and an updated_at trigger.
-- ------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'housekeeping_assignments' AND column_name = 'assignment_date'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'housekeeping_assignments' AND column_name = 'date'
    ) THEN
        ALTER TABLE housekeeping_assignments RENAME COLUMN assignment_date TO date;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'housekeeping_assignments' AND column_name = 'cleaning_type'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'housekeeping_assignments' AND column_name = 'type'
    ) THEN
        ALTER TABLE housekeeping_assignments RENAME COLUMN cleaning_type TO type;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'housekeeping_assignments' AND column_name = 'inspection_status'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'housekeeping_assignments' AND column_name = 'inspection_result'
    ) THEN
        ALTER TABLE housekeeping_assignments RENAME COLUMN inspection_status TO inspection_result;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'housekeeping_assignments' AND column_name = 'inspected_by'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'housekeeping_assignments' AND column_name = 'inspector_id'
    ) THEN
        ALTER TABLE housekeeping_assignments RENAME COLUMN inspected_by TO inspector_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'housekeeping_assignments' AND column_name = 'inspection_notes'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'housekeeping_assignments' AND column_name = 'notes'
    ) THEN
        ALTER TABLE housekeeping_assignments RENAME COLUMN inspection_notes TO notes;
    END IF;
END $$;

ALTER TABLE housekeeping_assignments
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_hk_assignments_updated_at'
    ) THEN
        CREATE TRIGGER trg_hk_assignments_updated_at
            BEFORE UPDATE ON housekeeping_assignments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Replace the existing tenant-isolation index with one keyed off the new column name.
DROP INDEX IF EXISTS idx_hk_tenant_date;
CREATE INDEX IF NOT EXISTS idx_hk_tenant_date
    ON housekeeping_assignments(tenant_id, date);

-- ------------------------------------------------------------
-- audit_log: align is_system column name
-- ------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_log' AND column_name = 'is_system_generated'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_log' AND column_name = 'is_system'
    ) THEN
        ALTER TABLE audit_log RENAME COLUMN is_system_generated TO is_system;
    END IF;
END $$;

-- ------------------------------------------------------------
-- Tenant context helper: parameterized, safe to call from the API layer.
-- The API uses set_tenant_context($1) instead of building a literal SQL string.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant', p_tenant_id::TEXT, true);
END;
$$ LANGUAGE plpgsql;
