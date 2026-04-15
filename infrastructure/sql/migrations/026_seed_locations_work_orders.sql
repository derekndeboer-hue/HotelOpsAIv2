-- Migration 026: Seed locations + sample work orders
-- Common-area + restaurant-equipment locations for Gardens Hotel
-- plus a handful of realistic work orders so the UI renders real data.
-- Idempotent: ON CONFLICT DO NOTHING on every insert.

-- Tenant:  a0000000-0000-0000-0000-000000000001
-- Hotel:   b0000000-0000-0000-0000-000000000001

SELECT set_config('app.current_tenant', 'a0000000-0000-0000-0000-000000000001', false);

-- ============================================================
-- LOCATIONS
-- ============================================================
INSERT INTO locations (id, tenant_id, hotel_id, name, slug, location_type, category, zone, building)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Fleming Lobby', 'fleming-lobby', 'common_area', 'lobby', 'fleming', 'Fleming'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Pool Deck', 'fleming-pool-deck', 'common_area', 'pool', 'fleming', 'Fleming'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Pool Bathrooms', 'fleming-pool-bathrooms', 'common_area', 'bathroom', 'fleming', 'Fleming'),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Cafe', 'fleming-cafe', 'common_area', 'dining', 'fleming', 'Fleming'),

  -- Restaurant common areas (housekeeping targets only — HSK cleans these bathrooms)
  ('d0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Restaurant Guest Bathroom (North)', 'restaurant-guest-bath-north', 'restaurant_common', 'bathroom', 'fleming', 'Fleming'),
  ('d0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Restaurant Guest Bathroom (South)', 'restaurant-guest-bath-south', 'restaurant_common', 'bathroom', 'fleming', 'Fleming'),
  ('d0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Restaurant Staff Bathroom', 'restaurant-staff-bath', 'restaurant_common', 'bathroom', 'fleming', 'Fleming'),

  -- Restaurant equipment areas (maintenance PM targets only — no HSK, no POS/orders)
  ('d0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Restaurant HVAC', 'restaurant-hvac', 'equipment_area', 'hvac', 'fleming', 'Fleming'),
  ('d0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Restaurant Grease Trap', 'restaurant-grease-trap', 'equipment_area', 'plumbing', 'fleming', 'Fleming'),
  ('d0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Restaurant Walk-In Cooler', 'restaurant-walk-in-cooler', 'equipment_area', 'refrigeration', 'fleming', 'Fleming'),
  ('d0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Restaurant Walk-In Freezer', 'restaurant-walk-in-freezer', 'equipment_area', 'refrigeration', 'fleming', 'Fleming'),
  ('d0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Restaurant Ice Machine', 'restaurant-ice-machine', 'equipment_area', 'refrigeration', 'fleming', 'Fleming'),
  ('d0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Restaurant Exhaust Hood', 'restaurant-exhaust-hood', 'equipment_area', 'hvac', 'fleming', 'Fleming'),

  -- Simonton common areas
  ('d0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Simonton Courtyard', 'simonton-courtyard', 'common_area', 'courtyard', 'simonton', 'Simonton'),
  ('d0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Simonton Laundry', 'simonton-laundry', 'back_of_house', 'laundry', 'simonton', 'Simonton')
ON CONFLICT (tenant_id, hotel_id, slug) DO NOTHING;

-- ============================================================
-- SAMPLE WORK ORDERS
-- Mix of room-targeted and common-area/equipment-targeted so the UI
-- exercises both paths on first run.
-- Requires migration 023 seed data to exist (tenant, hotel, staff, rooms).
-- ============================================================

WITH room_lookup AS (
    SELECT id, room_number
    FROM rooms
    WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001'
      AND hotel_id  = 'b0000000-0000-0000-0000-000000000001'
),
staff_lookup AS (
    SELECT id, role
    FROM staff
    WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001'
)
INSERT INTO work_orders (
    id, tenant_id, hotel_id, room_id, location_id,
    title, description, category, priority, status,
    created_by, assigned_to, due_date, created_at, updated_at
)
SELECT * FROM (VALUES
    -- Room-targeted
    ('e0000000-0000-0000-0000-000000000001'::uuid,
     'a0000000-0000-0000-0000-000000000001'::uuid,
     'b0000000-0000-0000-0000-000000000001'::uuid,
     (SELECT id FROM room_lookup WHERE room_number = '4'),
     NULL::uuid,
     'AC unit cycling loudly',
     'Guest reported AC compressor making grinding noise overnight. Room cool but noise disturbs sleep.',
     'hvac', 'high', 'open',
     (SELECT id FROM staff_lookup WHERE role = 'front_desk' LIMIT 1),
     NULL::uuid,
     NOW() + INTERVAL '1 day',
     NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),

    ('e0000000-0000-0000-0000-000000000002'::uuid,
     'a0000000-0000-0000-0000-000000000001'::uuid,
     'b0000000-0000-0000-0000-000000000001'::uuid,
     (SELECT id FROM room_lookup WHERE room_number = '15'),
     NULL::uuid,
     'Shower drain slow',
     'Slow drain in guest bathroom; minor standing water after 5 min shower.',
     'plumbing', 'medium', 'open',
     (SELECT id FROM staff_lookup WHERE role = 'room_attendant' LIMIT 1),
     NULL::uuid,
     NOW() + INTERVAL '2 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

    ('e0000000-0000-0000-0000-000000000003'::uuid,
     'a0000000-0000-0000-0000-000000000001'::uuid,
     'b0000000-0000-0000-0000-000000000001'::uuid,
     (SELECT id FROM room_lookup WHERE room_number = '22'),
     NULL::uuid,
     'Lamp flickering',
     'Bedside lamp flickers intermittently. Bulb replaced last week, wiring suspected.',
     'electrical', 'low', 'assigned',
     (SELECT id FROM staff_lookup WHERE role = 'front_desk' LIMIT 1),
     (SELECT id FROM staff_lookup WHERE role = 'engineer' LIMIT 1),
     NOW() + INTERVAL '3 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

    -- Location-targeted: common area
    ('e0000000-0000-0000-0000-000000000010'::uuid,
     'a0000000-0000-0000-0000-000000000001'::uuid,
     'b0000000-0000-0000-0000-000000000001'::uuid,
     NULL::uuid,
     'd0000000-0000-0000-0000-000000000003'::uuid,
     'Pool bathroom tile cracked',
     'Cracked tile near sink in pool bathroom. Sharp edge, safety concern.',
     'safety', 'urgent', 'open',
     (SELECT id FROM staff_lookup WHERE role = 'room_attendant' LIMIT 1),
     NULL::uuid,
     NOW() + INTERVAL '4 hours', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),

    -- Location-targeted: restaurant equipment PM
    ('e0000000-0000-0000-0000-000000000011'::uuid,
     'a0000000-0000-0000-0000-000000000001'::uuid,
     'b0000000-0000-0000-0000-000000000001'::uuid,
     NULL::uuid,
     'd0000000-0000-0000-0000-000000000021'::uuid,
     'Grease trap monthly service',
     'Monthly grease trap pump-out and inspection. Vendor scheduled.',
     'plumbing', 'medium', 'open',
     (SELECT id FROM staff_lookup WHERE role = 'maint_supervisor' LIMIT 1),
     (SELECT id FROM staff_lookup WHERE role = 'engineer' LIMIT 1),
     NOW() + INTERVAL '5 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

    ('e0000000-0000-0000-0000-000000000012'::uuid,
     'a0000000-0000-0000-0000-000000000001'::uuid,
     'b0000000-0000-0000-0000-000000000001'::uuid,
     NULL::uuid,
     'd0000000-0000-0000-0000-000000000022'::uuid,
     'Walk-in cooler temp drift',
     'Walk-in cooler reading 42F this morning (target 38F). Check compressor and door seal.',
     'hvac', 'high', 'in_progress',
     (SELECT id FROM staff_lookup WHERE role = 'maint_supervisor' LIMIT 1),
     (SELECT id FROM staff_lookup WHERE role = 'engineer' LIMIT 1),
     NOW() + INTERVAL '6 hours', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '1 hour')
) AS v(id, tenant_id, hotel_id, room_id, location_id,
       title, description, category, priority, status,
       created_by, assigned_to, due_date, created_at, updated_at)
ON CONFLICT (id) DO NOTHING;

-- Restore default
SELECT set_config('app.current_tenant', '', false);
