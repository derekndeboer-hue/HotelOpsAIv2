-- Migration 028: Front-desk vertical
-- Adds guest_requests table; backfills missing columns on guests, reservations.
-- All operations are idempotent.

-- ── guests: hotel_id, last_stay_date, preferences, date_of_birth ─────────────
ALTER TABLE guests
    ADD COLUMN IF NOT EXISTS hotel_id        UUID REFERENCES hotels(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS last_stay_date  DATE,
    ADD COLUMN IF NOT EXISTS date_of_birth   DATE,
    ADD COLUMN IF NOT EXISTS preferences     JSONB;

CREATE INDEX IF NOT EXISTS idx_guests_hotel ON guests(hotel_id);
CREATE INDEX IF NOT EXISTS idx_guests_hotel_email ON guests(hotel_id, email);

-- ── guest_practices: remove tenant_id FK requirement (uses hotel-scoped guests) ─
ALTER TABLE guest_practices
    ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES guests(id) ON DELETE CASCADE;

-- ── reservations: rate_plan, source, num_guests -> adults/children split ───────
ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS rate_plan VARCHAR(20),
    ADD COLUMN IF NOT EXISTS source    VARCHAR(30) NOT NULL DEFAULT 'direct',
    ADD COLUMN IF NOT EXISTS adults    INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS children  INT NOT NULL DEFAULT 0;

-- Align status values: migration 007 used varchar(20) which is fine.
-- Confirm 'pending' is a valid status (it is — just needs to be permitted in app layer).
-- No constraint change needed; status is a free-form varchar in 007.

-- ── guest_requests ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guest_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    guest_id        UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
    reservation_id  UUID REFERENCES reservations(id) ON DELETE SET NULL,
    room_id         UUID REFERENCES rooms(id) ON DELETE SET NULL,
    request_type    VARCHAR(30) NOT NULL,
    description     TEXT NOT NULL,
    priority        VARCHAR(10) NOT NULL DEFAULT 'normal',
    status          VARCHAR(20) NOT NULL DEFAULT 'open',
    routed_to       VARCHAR(40),
    created_by      UUID REFERENCES staff(id) ON DELETE SET NULL,
    resolved_by     UUID REFERENCES staff(id) ON DELETE SET NULL,
    resolved_at     TIMESTAMPTZ,
    resolution_note TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_guest_requests_updated_at'
    ) THEN
        CREATE TRIGGER trg_guest_requests_updated_at
            BEFORE UPDATE ON guest_requests
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- RLS: guest_requests is hotel-scoped (no tenant_id column needed; hotel -> tenant via FK).
-- Use a simpler approach: staff can only see rows for their hotel.
-- For now, no RLS on this table — it will be enforced at the service layer via hotel_id param.
-- TODO: Add RLS when multi-hotel tenants are introduced.

CREATE INDEX IF NOT EXISTS idx_guest_requests_hotel
    ON guest_requests(hotel_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_guest_requests_guest
    ON guest_requests(guest_id);

CREATE INDEX IF NOT EXISTS idx_guest_requests_reservation
    ON guest_requests(reservation_id);

-- ── shift_handoffs: add hotel_id if missing ───────────────────────────────────
ALTER TABLE shift_handoffs
    ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_shift_handoffs_hotel
    ON shift_handoffs(hotel_id, created_at);

-- ── shift_handoff_notes: remove tenant_id dependency if present ───────────────
-- The original table may not include tenant_id; this is a no-op if already correct.
ALTER TABLE shift_handoff_notes
    DROP COLUMN IF EXISTS tenant_id;
