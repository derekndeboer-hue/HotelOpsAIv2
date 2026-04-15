-- Migration 022: Additional composite performance indexes
-- Covers cross-table query patterns not already indexed in individual migrations

-- Rooms: occupied rooms lookup for front desk board
CREATE INDEX idx_rooms_tenant_occupied ON rooms(tenant_id, hotel_id)
    WHERE is_occupied = true;

-- Rooms: dirty rooms for HK queue
CREATE INDEX idx_rooms_tenant_dirty ON rooms(tenant_id, hotel_id)
    WHERE status IN ('dirty', 'inspecting');

-- Reservations: arrivals today
CREATE INDEX idx_reservations_checkin_status ON reservations(tenant_id, check_in_date, status)
    WHERE status IN ('confirmed', 'checked_in');

-- Reservations: departures today
CREATE INDEX idx_reservations_checkout_status ON reservations(tenant_id, check_out_date, status)
    WHERE status = 'checked_in';

-- Reservations: active stays
CREATE INDEX idx_reservations_active ON reservations(tenant_id, room_id)
    WHERE status = 'checked_in';

-- Work orders: open/in-progress for dashboard
CREATE INDEX idx_work_orders_open ON work_orders(tenant_id, hotel_id, priority)
    WHERE status IN ('open', 'in_progress');

-- Work orders: overdue items
CREATE INDEX idx_work_orders_due ON work_orders(tenant_id, due_date)
    WHERE status IN ('open', 'in_progress') AND due_date IS NOT NULL;

-- Housekeeping: today's pending for assignment board
CREATE INDEX idx_hk_pending_today ON housekeeping_assignments(tenant_id, hotel_id, priority DESC)
    WHERE status = 'pending';

-- Housekeeping: in-progress for real-time tracking
CREATE INDEX idx_hk_in_progress ON housekeeping_assignments(tenant_id, hotel_id)
    WHERE status = 'in_progress';

-- Task instances: pending tasks for staff mobile view
CREATE INDEX idx_task_instances_pending ON task_instances(tenant_id, assigned_to, scheduled_time)
    WHERE status = 'pending';

-- Preventive maintenance: upcoming due
CREATE INDEX idx_pm_upcoming ON preventive_maintenance(tenant_id, hotel_id, next_due_at)
    WHERE is_active = true AND next_due_at IS NOT NULL;

-- Equipment: active equipment by zone
CREATE INDEX idx_equipment_zone ON equipment(tenant_id, hotel_id, zone)
    WHERE is_active = true;

-- Notifications: unread for badge count
CREATE INDEX idx_notifications_unread ON notifications(tenant_id, recipient_id)
    WHERE status = 'delivered';

-- Complaints: open complaints for management dashboard
CREATE INDEX idx_complaints_open ON complaints(tenant_id, hotel_id, severity)
    WHERE status IN ('open', 'investigating');

-- Guest practices: lookup by guest for pre-arrival prep
CREATE INDEX idx_guest_practices_lookup ON guest_practices(tenant_id, guest_id, category, key);

-- Concierge bookings: upcoming bookings
CREATE INDEX idx_concierge_bookings_upcoming ON concierge_bookings(tenant_id, booking_date, booking_time)
    WHERE status = 'confirmed';

-- Staff: active staff for scheduling
CREATE INDEX idx_staff_active ON staff(tenant_id, hotel_id, role)
    WHERE is_active = true;

-- Compliance: items due soon
CREATE INDEX idx_compliance_due ON compliance_items(tenant_id, due_date)
    WHERE is_active = true AND due_date IS NOT NULL;

-- Room clock: recent events per hotel for live dashboard
-- NOTE: idx_room_clock_tenant_hotel_date in 021 already covers this exact pattern

-- Handoff reports: latest per department
CREATE INDEX idx_handoff_latest ON handoff_reports(tenant_id, hotel_id, department, shift_date DESC)
    WHERE status = 'published';
