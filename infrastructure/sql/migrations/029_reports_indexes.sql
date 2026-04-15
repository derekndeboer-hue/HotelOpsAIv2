-- Migration 029: Indexes for reports queries
-- Only adds what migrations 022–028 don't already cover.
-- 022 has: idx_work_orders_open (tenant+hotel+priority, partial on open/in_progress)
--          idx_hk_tenant_date is dropped/recreated in 024 on (tenant_id, date)
--          idx_reservations_checkin_status + idx_reservations_checkout_status
-- 028 has: idx_guest_requests_hotel on (hotel_id, status, created_at)
-- Missing: time-range scans on created_at for WO and guest_requests (no idx on created_at alone),
--          housekeeping_assignments by date range across all statuses for reporting.

-- work_orders: created_at range + status for report aggregations
CREATE INDEX IF NOT EXISTS idx_work_orders_created_at_status
    ON work_orders(tenant_id, created_at, status);

-- work_orders: completed_at for resolution-time calculations
CREATE INDEX IF NOT EXISTS idx_work_orders_completed_at
    ON work_orders(tenant_id, completed_at)
    WHERE completed_at IS NOT NULL;

-- housekeeping_assignments: date range across all statuses (024 only indexes tenant+date, not status)
CREATE INDEX IF NOT EXISTS idx_hk_assignments_date_status
    ON housekeeping_assignments(tenant_id, date, status);

-- guest_requests: created_at range for report queries (028 index is hotel+status+created_at;
--   this adds tenant-scoped time range for the ALS-native queries that don't filter by hotel_id)
CREATE INDEX IF NOT EXISTS idx_guest_requests_created_at
    ON guest_requests(hotel_id, created_at, status);

-- reservations: date range for occupancy generate_series join
-- 022 covers check_in_date with partial index; add departure for range queries
CREATE INDEX IF NOT EXISTS idx_reservations_date_range
    ON reservations(tenant_id, check_in_date, check_out_date)
    WHERE status = 'checked_in';
