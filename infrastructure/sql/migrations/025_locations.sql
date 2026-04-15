-- Migration 025: Locations (common areas alongside rooms)
-- Adds a polymorphic location concept so work orders and housekeeping
-- assignments can target common areas (restaurant bathrooms, restaurant
-- equipment, lobby, pool deck, etc.) in addition to guest rooms.
-- Rooms remain first-class; this table is additive for non-room targets.
-- Idempotent.

CREATE TABLE IF NOT EXISTS locations (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hotel_id         UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name             VARCHAR(120) NOT NULL,
    slug             VARCHAR(80) NOT NULL,
    location_type    VARCHAR(30) NOT NULL,
    category         VARCHAR(40),
    zone             VARCHAR(30),
    building         VARCHAR(60),
    is_active        BOOLEAN NOT NULL DEFAULT true,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT locations_type_check CHECK (
        location_type IN ('common_area', 'restaurant_common', 'back_of_house', 'exterior', 'equipment_area')
    ),
    CONSTRAINT uq_locations_tenant_hotel_slug UNIQUE (tenant_id, hotel_id, slug)
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_locations_updated_at'
    ) THEN
        CREATE TRIGGER trg_locations_updated_at
            BEFORE UPDATE ON locations
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'locations'
          AND policyname = 'location_tenant_isolation'
    ) THEN
        CREATE POLICY location_tenant_isolation ON locations
            USING (tenant_id = current_setting('app.current_tenant')::UUID);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'locations'
          AND policyname = 'location_tenant_insert'
    ) THEN
        CREATE POLICY location_tenant_insert ON locations
            FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_locations_tenant_hotel
    ON locations(tenant_id, hotel_id);
CREATE INDEX IF NOT EXISTS idx_locations_tenant_type
    ON locations(tenant_id, location_type) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_locations_tenant_zone
    ON locations(tenant_id, zone);

-- ------------------------------------------------------------
-- work_orders.location_id
-- ------------------------------------------------------------
ALTER TABLE work_orders
    ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Either room_id OR location_id must be set on a targeted work order.
-- Untargeted (both null) is still allowed for general building-wide issues.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_target_check'
    ) THEN
        ALTER TABLE work_orders
            ADD CONSTRAINT work_orders_target_check
            CHECK (NOT (room_id IS NOT NULL AND location_id IS NOT NULL));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_location
    ON work_orders(tenant_id, location_id) WHERE location_id IS NOT NULL;

-- ------------------------------------------------------------
-- housekeeping_assignments.location_id + relax room_id to nullable
-- so common-area cleanings (restaurant bathrooms, lobby, pool deck)
-- can be assigned the same way room turns are.
-- ------------------------------------------------------------
ALTER TABLE housekeeping_assignments
    ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'housekeeping_assignments'
          AND column_name = 'room_id'
          AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE housekeeping_assignments ALTER COLUMN room_id DROP NOT NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hk_assignments_target_check'
    ) THEN
        ALTER TABLE housekeeping_assignments
            ADD CONSTRAINT hk_assignments_target_check
            CHECK (room_id IS NOT NULL OR location_id IS NOT NULL);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_hk_tenant_location
    ON housekeeping_assignments(tenant_id, location_id) WHERE location_id IS NOT NULL;
