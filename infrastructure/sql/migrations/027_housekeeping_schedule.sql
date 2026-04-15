-- Migration 027: Housekeeping schedule generator support
-- Adds location HK scheduling metadata and the assignment columns the
-- housekeeping service already writes. Idempotent.

-- ------------------------------------------------------------
-- locations: housekeeping frequency + default shift
-- ------------------------------------------------------------
ALTER TABLE locations
    ADD COLUMN IF NOT EXISTS housekeeping_frequency VARCHAR(20),
    ADD COLUMN IF NOT EXISTS default_hk_shift       VARCHAR(20),
    ADD COLUMN IF NOT EXISTS hk_estimated_minutes   INT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'locations_hk_frequency_check'
    ) THEN
        ALTER TABLE locations
            ADD CONSTRAINT locations_hk_frequency_check
            CHECK (housekeeping_frequency IS NULL OR housekeeping_frequency IN (
                'daily', 'twice_daily', 'weekly', 'as_needed'
            ));
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'locations_hk_shift_check'
    ) THEN
        ALTER TABLE locations
            ADD CONSTRAINT locations_hk_shift_check
            CHECK (default_hk_shift IS NULL OR default_hk_shift IN (
                'morning', 'midday', 'evening'
            ));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_locations_hk_frequency
    ON locations(tenant_id, housekeeping_frequency)
    WHERE housekeeping_frequency IS NOT NULL;

-- Backfill seeded common-area locations with sensible HK cadences.
-- equipment_area rows stay NULL (maintenance PMs, not HK).
UPDATE locations SET
    housekeeping_frequency = 'daily',
    default_hk_shift       = 'morning',
    hk_estimated_minutes   = 20
WHERE slug = 'fleming-lobby' AND housekeeping_frequency IS NULL;

UPDATE locations SET
    housekeeping_frequency = 'daily',
    default_hk_shift       = 'morning',
    hk_estimated_minutes   = 25
WHERE slug = 'fleming-pool-deck' AND housekeeping_frequency IS NULL;

UPDATE locations SET
    housekeeping_frequency = 'twice_daily',
    default_hk_shift       = 'morning',
    hk_estimated_minutes   = 15
WHERE slug = 'fleming-pool-bathrooms' AND housekeeping_frequency IS NULL;

UPDATE locations SET
    housekeeping_frequency = 'daily',
    default_hk_shift       = 'morning',
    hk_estimated_minutes   = 30
WHERE slug = 'fleming-cafe' AND housekeeping_frequency IS NULL;

UPDATE locations SET
    housekeeping_frequency = 'twice_daily',
    default_hk_shift       = 'morning',
    hk_estimated_minutes   = 15
WHERE slug IN (
    'restaurant-guest-bath-north',
    'restaurant-guest-bath-south'
) AND housekeeping_frequency IS NULL;

UPDATE locations SET
    housekeeping_frequency = 'daily',
    default_hk_shift       = 'morning',
    hk_estimated_minutes   = 10
WHERE slug = 'restaurant-staff-bath' AND housekeeping_frequency IS NULL;

UPDATE locations SET
    housekeeping_frequency = 'weekly',
    default_hk_shift       = 'morning',
    hk_estimated_minutes   = 45
WHERE slug = 'simonton-courtyard' AND housekeeping_frequency IS NULL;

UPDATE locations SET
    housekeeping_frequency = 'as_needed',
    default_hk_shift       = 'midday',
    hk_estimated_minutes   = 30
WHERE slug = 'simonton-laundry' AND housekeeping_frequency IS NULL;

-- ------------------------------------------------------------
-- housekeeping_assignments: fill gaps the service already writes.
-- Migration 024 aligned the column names; this adds the extras.
-- ------------------------------------------------------------
ALTER TABLE housekeeping_assignments
    ADD COLUMN IF NOT EXISTS completion_notes    TEXT,
    ADD COLUMN IF NOT EXISTS failure_reasons     JSONB,
    ADD COLUMN IF NOT EXISTS parent_assignment_id UUID
        REFERENCES housekeeping_assignments(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS inspected_at        TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS dnd_attempts        INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_dnd_at         TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS estimated_minutes   INT,
    ADD COLUMN IF NOT EXISTS is_fixed            BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS sort_order          INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_hk_tenant_parent
    ON housekeeping_assignments(tenant_id, parent_assignment_id)
    WHERE parent_assignment_id IS NOT NULL;
