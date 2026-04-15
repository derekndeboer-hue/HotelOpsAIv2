-- Migration 030: Phase 1 realistic operating-day seed
-- Reference date: CURRENT_DATE (seed is always "today-relative")
-- Idempotent: ON CONFLICT DO NOTHING on every table.
--
-- Depends on: 023 (tenant/hotel/staff/rooms), 025 (locations), 026 (work_orders seed),
--             027 (hk schedule cols), 028 (guest_requests)
--
-- Tenant:  a0000000-0000-0000-0000-000000000001
-- Hotel:   b0000000-0000-0000-0000-000000000001

-- ============================================================
-- GUESTS (~20)
-- ============================================================
INSERT INTO guests (
    id, tenant_id, hotel_id,
    first_name, last_name, email, phone,
    vip_status, total_stays, last_stay_date,
    created_at, updated_at
) VALUES
-- Return guests (total_stays > 1)
('f1000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Margaret','Holloway','margaret.holloway@example.com','305-555-0101',
 'silver', 4, CURRENT_DATE - 90, NOW() - INTERVAL '18 months', NOW()),

('f1000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Thomas','Bernier','thomas.bernier@example.com','617-555-0102',
 'gold', 7, CURRENT_DATE - 45, NOW() - INTERVAL '3 years', NOW()),

('f1000000-0000-0000-0000-000000000003',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Claudia','Vega','claudia.vega@example.com','786-555-0103',
 'none', 3, CURRENT_DATE - 120, NOW() - INTERVAL '2 years', NOW()),

('f1000000-0000-0000-0000-000000000004',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Raymond','Kowalski','raymond.kowalski@example.com','312-555-0104',
 'silver', 2, CURRENT_DATE - 200, NOW() - INTERVAL '1 year', NOW()),

('f1000000-0000-0000-0000-000000000005',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Diane','Ashworth','diane.ashworth@example.com','212-555-0105',
 'gold', 9, CURRENT_DATE - 30, NOW() - INTERVAL '4 years', NOW()),

('f1000000-0000-0000-0000-000000000006',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Marcus','Delacroix','marcus.delacroix@example.com','504-555-0106',
 'none', 2, CURRENT_DATE - 365, NOW() - INTERVAL '2 years', NOW()),

('f1000000-0000-0000-0000-000000000007',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Sandra','Nguyen','sandra.nguyen@example.com','714-555-0107',
 'silver', 5, CURRENT_DATE - 60, NOW() - INTERVAL '2 years', NOW()),

-- First-timers (total_stays = 0 or 1)
('f1000000-0000-0000-0000-000000000008',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Ethan','Prentice','ethan.prentice@example.com','404-555-0108',
 'none', 0, NULL, NOW() - INTERVAL '3 months', NOW()),

('f1000000-0000-0000-0000-000000000009',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Lydia','Carmichael','lydia.carmichael@example.com','303-555-0109',
 'none', 0, NULL, NOW() - INTERVAL '6 weeks', NOW()),

('f1000000-0000-0000-0000-000000000010',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Victor','Solis','victor.solis@example.com','702-555-0110',
 'none', 0, NULL, NOW() - INTERVAL '2 months', NOW()),

('f1000000-0000-0000-0000-000000000011',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Helen','Park','helen.park@example.com','206-555-0111',
 'none', 1, CURRENT_DATE - 180, NOW() - INTERVAL '8 months', NOW()),

('f1000000-0000-0000-0000-000000000012',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Oliver','Whitfield','oliver.whitfield@example.com','617-555-0112',
 'none', 0, NULL, NOW() - INTERVAL '5 weeks', NOW()),

('f1000000-0000-0000-0000-000000000013',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Patricia','Lund','patricia.lund@example.com','651-555-0113',
 'none', 0, NULL, NOW() - INTERVAL '4 weeks', NOW()),

('f1000000-0000-0000-0000-000000000014',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'James','Torrance','james.torrance@example.com','212-555-0114',
 'none', 0, NULL, NOW() - INTERVAL '3 weeks', NOW()),

('f1000000-0000-0000-0000-000000000015',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Alicia','Drummond','alicia.drummond@example.com','312-555-0115',
 'none', 0, NULL, NOW() - INTERVAL '10 days', NOW()),

('f1000000-0000-0000-0000-000000000016',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Nathan','Graves','nathan.graves@example.com','813-555-0116',
 'none', 0, NULL, NOW() - INTERVAL '2 weeks', NOW()),

('f1000000-0000-0000-0000-000000000017',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Isabel','Fonseca','isabel.fonseca@example.com','305-555-0117',
 'none', 0, NULL, NOW() - INTERVAL '1 week', NOW()),

('f1000000-0000-0000-0000-000000000018',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Derek','Callahan','derek.callahan@example.com','617-555-0118',
 'none', 0, NULL, NOW() - INTERVAL '5 days', NOW()),

('f1000000-0000-0000-0000-000000000019',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Sophia','Brennan','sophia.brennan@example.com','786-555-0119',
 'none', 0, NULL, NOW() - INTERVAL '3 days', NOW()),

('f1000000-0000-0000-0000-000000000020',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Carlos','Medina','carlos.medina@example.com','954-555-0120',
 'none', 1, CURRENT_DATE - 270, NOW() - INTERVAL '12 months', NOW())

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RESERVATIONS (~35)
-- ============================================================
-- Note: room_id is NOT NULL in migration 007 but many reservations
-- are pre-arrival (no room assigned). We use a placeholder room
-- for confirmed-future rows and populate properly for checked_in.
-- The check-in flow assigns the actual room; seed mirrors that reality:
-- confirmed arrivals get no room_id override (NULL allowed via migration 024
-- which set room_id nullable? — migration 007 has room_id NOT NULL).
-- We assign a room from the pool for all rows to satisfy the constraint.

-- 8 confirmed / arrival = CURRENT_DATE (today's check-ins)
INSERT INTO reservations (
    id, tenant_id, hotel_id, guest_id, room_id,
    confirmation_number, check_in_date, check_out_date,
    status, adults, children, source, rate_plan,
    created_at, updated_at
) VALUES
('g1000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000008',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='1'),
 'GH-260415-0001', CURRENT_DATE, CURRENT_DATE + 3,
 'confirmed', 2, 0, 'direct', 'bar',
 NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

('g1000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000009',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='2'),
 'GH-260415-0002', CURRENT_DATE, CURRENT_DATE + 2,
 'confirmed', 2, 0, 'ota', 'rack',
 NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),

('g1000000-0000-0000-0000-000000000003',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000010',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='3'),
 'GH-260415-0003', CURRENT_DATE, CURRENT_DATE + 4,
 'confirmed', 1, 0, 'direct', 'bar',
 NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),

('g1000000-0000-0000-0000-000000000004',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000004',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='7'),
 'GH-260415-0004', CURRENT_DATE, CURRENT_DATE + 2,
 'confirmed', 2, 1, 'ota', 'rack',
 NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),

('g1000000-0000-0000-0000-000000000005',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000011',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='8'),
 'GH-260415-0005', CURRENT_DATE, CURRENT_DATE + 3,
 'confirmed', 2, 0, 'direct', 'bar',
 NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

('g1000000-0000-0000-0000-000000000006',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000012',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='17'),
 'GH-260415-0006', CURRENT_DATE, CURRENT_DATE + 5,
 'confirmed', 2, 0, 'ota', 'rack',
 NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),

('g1000000-0000-0000-0000-000000000007',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000013',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='18'),
 'GH-260415-0007', CURRENT_DATE, CURRENT_DATE + 2,
 'confirmed', 1, 0, 'direct', 'bar',
 NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

('g1000000-0000-0000-0000-000000000008',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000020',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='60'),
 'GH-260415-0008', CURRENT_DATE, CURRENT_DATE + 4,
 'confirmed', 2, 0, 'walk_in', 'rack',
 NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

-- 4 confirmed / arrival = CURRENT_DATE + 1 (tomorrow)
('g1000000-0000-0000-0000-000000000009',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000014',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='23'),
 'GH-260416-0001', CURRENT_DATE + 1, CURRENT_DATE + 4,
 'confirmed', 2, 0, 'direct', 'bar',
 NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

('g1000000-0000-0000-0000-000000000010',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000015',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='24'),
 'GH-260416-0002', CURRENT_DATE + 1, CURRENT_DATE + 3,
 'confirmed', 1, 0, 'ota', 'rack',
 NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

('g1000000-0000-0000-0000-000000000011',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000016',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='61'),
 'GH-260416-0003', CURRENT_DATE + 1, CURRENT_DATE + 6,
 'confirmed', 2, 2, 'ota', 'rack',
 NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),

('g1000000-0000-0000-0000-000000000012',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000017',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='62'),
 'GH-260416-0004', CURRENT_DATE + 1, CURRENT_DATE + 5,
 'confirmed', 2, 0, 'direct', 'bar',
 NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),

-- 3 confirmed / arrival = CURRENT_DATE + 2..5 (future)
('g1000000-0000-0000-0000-000000000013',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000018',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='40'),
 'GH-260417-0001', CURRENT_DATE + 2, CURRENT_DATE + 5,
 'confirmed', 2, 0, 'direct', 'package',
 NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),

('g1000000-0000-0000-0000-000000000014',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000019',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='41'),
 'GH-260418-0001', CURRENT_DATE + 3, CURRENT_DATE + 7,
 'confirmed', 2, 0, 'ota', 'rack',
 NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),

('g1000000-0000-0000-0000-000000000015',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000005',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='42'),
 'GH-260420-0001', CURRENT_DATE + 5, CURRENT_DATE + 9,
 'confirmed', 2, 0, 'direct', 'bar',
 NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'),

-- 12 checked_in (in-house guests, rooms occupied)
('g1000000-0000-0000-0000-000000000016',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='10'),
 'GH-260414-0001', CURRENT_DATE - 1, CURRENT_DATE + 2,
 'checked_in', 2, 0, 'direct', 'bar',
 NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day'),

('g1000000-0000-0000-0000-000000000017',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000002',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='11'),
 'GH-260414-0002', CURRENT_DATE - 1, CURRENT_DATE + 3,
 'checked_in', 2, 0, 'direct', 'corporate',
 NOW() - INTERVAL '45 days', NOW() - INTERVAL '1 day'),

('g1000000-0000-0000-0000-000000000018',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000003',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='12'),
 'GH-260413-0001', CURRENT_DATE - 2, CURRENT_DATE + 1,
 'checked_in', 1, 0, 'ota', 'rack',
 NOW() - INTERVAL '14 days', NOW() - INTERVAL '2 days'),

('g1000000-0000-0000-0000-000000000019',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000006',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='13'),
 'GH-260413-0002', CURRENT_DATE - 2, CURRENT_DATE + 2,
 'checked_in', 2, 0, 'ota', 'bar',
 NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days'),

('g1000000-0000-0000-0000-000000000020',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000007',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='14'),
 'GH-260413-0003', CURRENT_DATE - 2, CURRENT_DATE + 1,
 'checked_in', 2, 1, 'direct', 'package',
 NOW() - INTERVAL '60 days', NOW() - INTERVAL '2 days'),

('g1000000-0000-0000-0000-000000000021',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='15'),
 'GH-260412-0001', CURRENT_DATE - 3, CURRENT_DATE + 1,
 'checked_in', 2, 0, 'direct', 'bar',
 NOW() - INTERVAL '30 days', NOW() - INTERVAL '3 days'),

('g1000000-0000-0000-0000-000000000022',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000002',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='16'),
 'GH-260412-0002', CURRENT_DATE - 3, CURRENT_DATE + 2,
 'checked_in', 2, 0, 'direct', 'corporate',
 NOW() - INTERVAL '60 days', NOW() - INTERVAL '3 days'),

('g1000000-0000-0000-0000-000000000023',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000003',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='25'),
 'GH-260414-0003', CURRENT_DATE - 1, CURRENT_DATE + 3,
 'checked_in', 1, 0, 'ota', 'rack',
 NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 day'),

('g1000000-0000-0000-0000-000000000024',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000004',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='26'),
 'GH-260414-0004', CURRENT_DATE - 1, CURRENT_DATE + 2,
 'checked_in', 2, 0, 'direct', 'bar',
 NOW() - INTERVAL '28 days', NOW() - INTERVAL '1 day'),

('g1000000-0000-0000-0000-000000000025',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000005',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='30'),
 'GH-260413-0004', CURRENT_DATE - 2, CURRENT_DATE + 3,
 'checked_in', 2, 0, 'direct', 'package',
 NOW() - INTERVAL '90 days', NOW() - INTERVAL '2 days'),

('g1000000-0000-0000-0000-000000000026',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000006',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='31'),
 'GH-260414-0005', CURRENT_DATE - 1, CURRENT_DATE + 2,
 'checked_in', 2, 0, 'ota', 'rack',
 NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day'),

('g1000000-0000-0000-0000-000000000027',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000007',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='32'),
 'GH-260414-0006', CURRENT_DATE - 1, CURRENT_DATE + 4,
 'checked_in', 2, 2, 'direct', 'package',
 NOW() - INTERVAL '55 days', NOW() - INTERVAL '1 day'),

-- 5 checked_out (today's completed departures)
('g1000000-0000-0000-0000-000000000028',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000008',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='19'),
 'GH-260411-0001', CURRENT_DATE - 4, CURRENT_DATE,
 'checked_out', 2, 0, 'direct', 'bar',
 NOW() - INTERVAL '20 days', NOW() - INTERVAL '2 hours'),

('g1000000-0000-0000-0000-000000000029',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000009',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='20'),
 'GH-260411-0002', CURRENT_DATE - 4, CURRENT_DATE,
 'checked_out', 1, 0, 'ota', 'rack',
 NOW() - INTERVAL '18 days', NOW() - INTERVAL '3 hours'),

('g1000000-0000-0000-0000-000000000030',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000010',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='21'),
 'GH-260412-0003', CURRENT_DATE - 3, CURRENT_DATE,
 'checked_out', 2, 0, 'direct', 'bar',
 NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 hour'),

('g1000000-0000-0000-0000-000000000031',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000011',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='22'),
 'GH-260413-0005', CURRENT_DATE - 2, CURRENT_DATE,
 'checked_out', 2, 0, 'ota', 'rack',
 NOW() - INTERVAL '10 days', NOW() - INTERVAL '4 hours'),

('g1000000-0000-0000-0000-000000000032',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000012',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='70'),
 'GH-260412-0004', CURRENT_DATE - 3, CURRENT_DATE,
 'checked_out', 2, 0, 'direct', 'package',
 NOW() - INTERVAL '25 days', NOW() - INTERVAL '30 minutes'),

-- 2 cancelled
('g1000000-0000-0000-0000-000000000033',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000013',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='71'),
 'GH-260414-0007', CURRENT_DATE + 2, CURRENT_DATE + 5,
 'cancelled', 2, 0, 'direct', 'bar',
 NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),

('g1000000-0000-0000-0000-000000000034',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000014',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='72'),
 'GH-260413-0006', CURRENT_DATE + 1, CURRENT_DATE + 3,
 'cancelled', 1, 0, 'ota', 'rack',
 NOW() - INTERVAL '12 days', NOW() - INTERVAL '2 days'),

-- 1 no_show
('g1000000-0000-0000-0000-000000000035',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000015',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='73'),
 'GH-260414-0008', CURRENT_DATE, CURRENT_DATE + 2,
 'no_show', 2, 0, 'direct', 'bar',
 NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 hours')

ON CONFLICT (id) DO NOTHING;

-- Mark rooms occupied for checked_in reservations
UPDATE rooms SET status = 'occupied'
WHERE hotel_id = 'b0000000-0000-0000-0000-000000000001'
  AND room_number IN ('10','11','12','13','14','15','16','25','26','30','31','32')
  AND status = 'clean';

-- Mark rooms vacant_dirty for checked_out today
UPDATE rooms SET status = 'vacant_dirty'
WHERE hotel_id = 'b0000000-0000-0000-0000-000000000001'
  AND room_number IN ('19','20','21','22','70')
  AND status = 'clean';

-- ============================================================
-- WORK ORDERS (~25)
-- ============================================================
-- IDs start at e1... to avoid colliding with migration 026 (e0...)

INSERT INTO work_orders (
    id, tenant_id, hotel_id,
    room_id, location_id,
    title, description, category, priority, status,
    created_by, assigned_to,
    started_at, completed_at,
    due_date, created_at, updated_at
) VALUES
-- NEW (6)
('e1000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='5'),
 NULL,
 'Toilet running constantly','Toilet flapper worn — runs nonstop. Guest in room 5 complained.',
 'plumbing','high','new',
 'c0000000-0000-0000-0000-000000000003',NULL,
 NULL,NULL,
 CURRENT_DATE + 0, NOW() - INTERVAL '40 minutes', NOW() - INTERVAL '40 minutes'),

('e1000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='11'),
 NULL,
 'Mini-fridge not cooling','Fridge in room 11 reading 55°F. Guests keeping medication in it.',
 'amenity','urgent','new',
 'c0000000-0000-0000-0000-000000000003',NULL,
 NULL,NULL,
 CURRENT_DATE + 0, NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '25 minutes'),

('e1000000-0000-0000-0000-000000000003',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='32'),
 NULL,
 'Balcony door sticks','Sliding balcony door requires excessive force to open/close.',
 'furniture','normal','new',
 'c0000000-0000-0000-0000-000000000005',NULL,
 NULL,NULL,
 CURRENT_DATE + 2, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),

('e1000000-0000-0000-0000-000000000004',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 NULL,
 'd0000000-0000-0000-0000-000000000020',
 'Restaurant HVAC filter change overdue','Quarterly filter swap due. Cooling efficiency dropping.',
 'hvac','normal','new',
 'c0000000-0000-0000-0000-000000000007',NULL,
 NULL,NULL,
 CURRENT_DATE + 3, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),

('e1000000-0000-0000-0000-000000000005',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='26'),
 NULL,
 'Light switch sparks on flip','Guest reports visible spark when flipping bathroom light switch.',
 'electrical','high','new',
 'c0000000-0000-0000-0000-000000000003',NULL,
 NULL,NULL,
 CURRENT_DATE + 0, NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes'),

('e1000000-0000-0000-0000-000000000006',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 NULL,
 'd0000000-0000-0000-0000-000000000002',
 'Pool pump pressure low','Pool pump reading 12 PSI vs normal 18–20. Possible filter clog.',
 'plumbing','normal','new',
 'c0000000-0000-0000-0000-000000000007',NULL,
 NULL,NULL,
 CURRENT_DATE + 1, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),

-- ACKNOWLEDGED (5)
('e1000000-0000-0000-0000-000000000007',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='13'),
 NULL,
 'A/C thermostat unresponsive','Thermostat display blank, HVAC stuck on heat mode. Room is warm.',
 'hvac','high','acknowledged',
 'c0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000008',
 NULL,NULL,
 CURRENT_DATE + 0, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours'),

('e1000000-0000-0000-0000-000000000008',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='16'),
 NULL,
 'Shower head low pressure','Master bath shower pressure inadequate. Guest noted.',
 'plumbing','normal','acknowledged',
 'c0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000008',
 NULL,NULL,
 CURRENT_DATE + 1, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours'),

('e1000000-0000-0000-0000-000000000009',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 NULL,
 'd0000000-0000-0000-0000-000000000001',
 'Lobby ceiling light flickering','Two fixtures in main lobby flickering intermittently.',
 'electrical','normal','acknowledged',
 'c0000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000009',
 NULL,NULL,
 CURRENT_DATE + 2, NOW() - INTERVAL '7 hours', NOW() - INTERVAL '6 hours'),

('e1000000-0000-0000-0000-000000000010',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='25'),
 NULL,
 'Dryer vent blocked in laundry','Guest-accessible laundry dryer taking 2+ cycles. Vent likely blocked.',
 'hvac','normal','acknowledged',
 'c0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000009',
 NULL,NULL,
 CURRENT_DATE + 2, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '7 hours'),

('e1000000-0000-0000-0000-000000000011',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='14'),
 NULL,
 'TV remote unresponsive','TV remote not working despite new batteries. Possible IR sensor issue.',
 'amenity','low','acknowledged',
 'c0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000008',
 NULL,NULL,
 CURRENT_DATE + 3, NOW() - INTERVAL '9 hours', NOW() - INTERVAL '8 hours'),

-- IN_PROGRESS (6)
('e1000000-0000-0000-0000-000000000012',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='10'),
 NULL,
 'Bathroom exhaust fan noisy','Loud grinding from bath fan motor. Needs bearing replacement.',
 'hvac','normal','in_progress',
 'c0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000008',
 NOW() - INTERVAL '1 hour 30 minutes',NULL,
 CURRENT_DATE + 0, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '1 hour 30 minutes'),

('e1000000-0000-0000-0000-000000000013',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='30'),
 NULL,
 'Cottage entrance door lock stiff','Key card reader on cottage 30 requires multiple swipes.',
 'amenity','high','in_progress',
 'c0000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000009',
 NOW() - INTERVAL '45 minutes',NULL,
 CURRENT_DATE + 0, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '45 minutes'),

('e1000000-0000-0000-0000-000000000014',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 NULL,
 'd0000000-0000-0000-0000-000000000021',
 'Grease trap service in progress','Vendor on-site pumping grease trap. Estimated 2hr completion.',
 'plumbing','normal','in_progress',
 'c0000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000008',
 NOW() - INTERVAL '1 hour',NULL,
 CURRENT_DATE + 0, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 hour'),

('e1000000-0000-0000-0000-000000000015',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='27'),
 NULL,
 'Drape rod bracket loose','Curtain rod pulling away from wall mount, drapes falling.',
 'furniture','normal','in_progress',
 'c0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000009',
 NOW() - INTERVAL '30 minutes',NULL,
 CURRENT_DATE + 1, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 minutes'),

('e1000000-0000-0000-0000-000000000016',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='12'),
 NULL,
 'Safe not responding','In-room safe keypad unresponsive after guest set new code.',
 'amenity','normal','in_progress',
 'c0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000008',
 NOW() - INTERVAL '20 minutes',NULL,
 CURRENT_DATE + 0, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '20 minutes'),

('e1000000-0000-0000-0000-000000000017',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 NULL,
 'd0000000-0000-0000-0000-000000000030',
 'Courtyard gate hinge broken','Simonton courtyard gate hinge sheared. Gate resting on ground.',
 'exterior','high','in_progress',
 'c0000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000009',
 NOW() - INTERVAL '2 hours',NULL,
 CURRENT_DATE + 0, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours'),

-- COMPLETED (5) — with started_at/completed_at for SLA reporting
('e1000000-0000-0000-0000-000000000018',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='19'),
 NULL,
 'Bathtub drain blocked','Hair clog causing slow drain. Cleared with snake tool.',
 'plumbing','normal','completed',
 'c0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000008',
 NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours 20 minutes',
 CURRENT_DATE, NOW() - INTERVAL '7 hours', NOW() - INTERVAL '5 hours 20 minutes'),

('e1000000-0000-0000-0000-000000000019',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='20'),
 NULL,
 'Replace burnt-out bulbs','3 recessed lights dead in main area. Replaced with LED equivalents.',
 'electrical','low','completed',
 'c0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000009',
 NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours 40 minutes',
 CURRENT_DATE, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '4 hours 40 minutes'),

('e1000000-0000-0000-0000-000000000020',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='22'),
 NULL,
 'Coffee maker not heating','Coffee maker heating element replaced. Unit tested OK.',
 'amenity','normal','completed',
 'c0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000008',
 NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours 35 minutes',
 CURRENT_DATE, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '3 hours 35 minutes'),

('e1000000-0000-0000-0000-000000000021',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 NULL,
 'd0000000-0000-0000-0000-000000000003',
 'Pool bathroom hand dryer broken','Dryer not activating. Replaced sensor board. Unit operational.',
 'amenity','normal','completed',
 'c0000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000009',
 NOW() - INTERVAL '8 hours', NOW() - INTERVAL '7 hours 30 minutes',
 CURRENT_DATE - 1, NOW() - INTERVAL '1 day', NOW() - INTERVAL '7 hours 30 minutes'),

('e1000000-0000-0000-0000-000000000022',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='15'),
 NULL,
 'Shower rod replaced','Old chrome rod corroded. Replaced with brushed nickel. Matches fixtures.',
 'furniture','low','completed',
 'c0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000009',
 NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 45 minutes',
 CURRENT_DATE, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '2 hours 45 minutes'),

-- CANCELLED (2)
('e1000000-0000-0000-0000-000000000023',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='23'),
 NULL,
 'Duplicate: shower pressure low','Duplicate submission — see WO for room 16.',
 'plumbing','normal','cancelled',
 'c0000000-0000-0000-0000-000000000003',NULL,
 NULL,NULL,
 CURRENT_DATE + 1, NOW() - INTERVAL '10 hours', NOW() - INTERVAL '9 hours'),

('e1000000-0000-0000-0000-000000000024',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='24'),
 NULL,
 'Ironing board missing','Guest requested ironing board. Retrieved from storage — no work needed.',
 'housekeeping','low','cancelled',
 'c0000000-0000-0000-0000-000000000005',NULL,
 NULL,NULL,
 CURRENT_DATE, NOW() - INTERVAL '11 hours', NOW() - INTERVAL '10 hours'),

-- ON_HOLD (1)
('e1000000-0000-0000-0000-000000000025',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='27'),
 NULL,
 'Jacuzzi jet motor weak','One jet motor significantly weaker than others. Part on order.',
 'plumbing','normal','on_hold',
 'c0000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000009',
 NULL,NULL,
 CURRENT_DATE + 7, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day')

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- HOUSEKEEPING ASSIGNMENTS (~15 today + 2 tomorrow)
-- ============================================================
-- Attendant IDs: 005 = Ana Gutierrez, 006 = Carmen Diaz
-- Supervisor:    004 = Maria Rodriguez

INSERT INTO housekeeping_assignments (
    id, tenant_id, hotel_id,
    room_id, location_id,
    assigned_to, date, priority, status, type,
    started_at, completed_at, actual_minutes,
    inspection_result,
    failure_reasons,
    estimated_minutes,
    created_at, updated_at
) VALUES
-- COMPLETED (5): checkout cleans for rooms vacated today
('h1000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='19'),
 NULL,
 'c0000000-0000-0000-0000-000000000005', CURRENT_DATE, 10, 'completed', 'checkout',
 NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours', 60,
 'pass', NULL, 60, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '3 hours'),

('h1000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='20'),
 NULL,
 'c0000000-0000-0000-0000-000000000006', CURRENT_DATE, 10, 'completed', 'checkout',
 NOW() - INTERVAL '3 hours 30 minutes', NOW() - INTERVAL '2 hours 30 minutes', 60,
 'pass', NULL, 60, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '2 hours 30 minutes'),

('h1000000-0000-0000-0000-000000000003',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='21'),
 NULL,
 'c0000000-0000-0000-0000-000000000005', CURRENT_DATE, 10, 'completed', 'checkout',
 NOW() - INTERVAL '2 hours 45 minutes', NOW() - INTERVAL '1 hour 45 minutes', 60,
 'pass', NULL, 60, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '1 hour 45 minutes'),

-- COMPLETED: common area cleans
('h1000000-0000-0000-0000-000000000004',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 NULL,
 'd0000000-0000-0000-0000-000000000003',
 'c0000000-0000-0000-0000-000000000006', CURRENT_DATE, 5, 'completed', 'common_area',
 NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours 40 minutes', 20,
 'pass', NULL, 20, NOW() - INTERVAL '7 hours', NOW() - INTERVAL '5 hours 40 minutes'),

('h1000000-0000-0000-0000-000000000005',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 NULL,
 'd0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000005', CURRENT_DATE, 5, 'completed', 'common_area',
 NOW() - INTERVAL '7 hours', NOW() - INTERVAL '6 hours 30 minutes', 30,
 'pass', NULL, 25, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '6 hours 30 minutes'),

-- IN_PROGRESS (4)
('h1000000-0000-0000-0000-000000000006',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='22'),
 NULL,
 'c0000000-0000-0000-0000-000000000005', CURRENT_DATE, 10, 'in_progress', 'checkout',
 NOW() - INTERVAL '30 minutes', NULL, NULL,
 NULL, NULL, 60, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '30 minutes'),

('h1000000-0000-0000-0000-000000000007',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='70'),
 NULL,
 'c0000000-0000-0000-0000-000000000006', CURRENT_DATE, 10, 'in_progress', 'checkout',
 NOW() - INTERVAL '15 minutes', NULL, NULL,
 NULL, NULL, 55, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '15 minutes'),

('h1000000-0000-0000-0000-000000000008',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='10'),
 NULL,
 'c0000000-0000-0000-0000-000000000005', CURRENT_DATE, 3, 'in_progress', 'stayover',
 NOW() - INTERVAL '20 minutes', NULL, NULL,
 NULL, NULL, 30, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '20 minutes'),

('h1000000-0000-0000-0000-000000000009',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 NULL,
 'd0000000-0000-0000-0000-000000000004',
 'c0000000-0000-0000-0000-000000000006', CURRENT_DATE, 3, 'in_progress', 'common_area',
 NOW() - INTERVAL '10 minutes', NULL, NULL,
 NULL, NULL, 30, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '10 minutes'),

-- ASSIGNED (5)
('h1000000-0000-0000-0000-000000000010',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='11'),
 NULL,
 'c0000000-0000-0000-0000-000000000005', CURRENT_DATE, 3, 'assigned', 'stayover',
 NULL, NULL, NULL,
 NULL, NULL, 30, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),

('h1000000-0000-0000-0000-000000000011',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='12'),
 NULL,
 'c0000000-0000-0000-0000-000000000006', CURRENT_DATE, 3, 'assigned', 'stayover',
 NULL, NULL, NULL,
 NULL, NULL, 35, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),

('h1000000-0000-0000-0000-000000000012',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='13'),
 NULL,
 'c0000000-0000-0000-0000-000000000005', CURRENT_DATE, 3, 'assigned', 'stayover',
 NULL, NULL, NULL,
 NULL, NULL, 30, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),

('h1000000-0000-0000-0000-000000000013',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 NULL,
 'd0000000-0000-0000-0000-000000000010',
 'c0000000-0000-0000-0000-000000000006', CURRENT_DATE, 5, 'assigned', 'common_area',
 NULL, NULL, NULL,
 NULL, NULL, 15, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),

('h1000000-0000-0000-0000-000000000014',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='14'),
 NULL,
 'c0000000-0000-0000-0000-000000000005', CURRENT_DATE, 3, 'assigned', 'stayover',
 NULL, NULL, NULL,
 NULL, NULL, 30, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),

-- FAILED (1)
('h1000000-0000-0000-0000-000000000015',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='31'),
 NULL,
 'c0000000-0000-0000-0000-000000000006', CURRENT_DATE, 3, 'failed', 'stayover',
 NOW() - INTERVAL '1 hour 30 minutes', NOW() - INTERVAL '1 hour', 30,
 'fail',
 '["Guest refused service — DND on door for 90+ minutes","Attempted twice, will retry after 2pm"]'::jsonb,
 30, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '1 hour'),

-- FUTURE ASSIGNMENTS (2) — CURRENT_DATE + 1 for schedule preview
('h1000000-0000-0000-0000-000000000016',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='1'),
 NULL,
 'c0000000-0000-0000-0000-000000000005', CURRENT_DATE + 1, 10, 'assigned', 'checkout',
 NULL, NULL, NULL,
 NULL, NULL, 60, NOW(), NOW()),

('h1000000-0000-0000-0000-000000000017',
 'a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='2'),
 NULL,
 'c0000000-0000-0000-0000-000000000006', CURRENT_DATE + 1, 10, 'assigned', 'checkout',
 NULL, NULL, NULL,
 NULL, NULL, 60, NOW(), NOW())

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- GUEST REQUESTS (~8)
-- ============================================================
-- WO e1000000-0000-0000-0000-000000000001 (room 5 toilet) and
--    e1000000-0000-0000-0000-000000000002 (room 11 fridge) used as resulting_work_order_id
-- resulting_work_order_id column — added only if it exists; if not present, we skip it.
-- Since migration 028 defines guest_requests without that column, we add it here idempotently.

ALTER TABLE guest_requests
    ADD COLUMN IF NOT EXISTS resulting_work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL;

INSERT INTO guest_requests (
    id, hotel_id, guest_id, reservation_id, room_id,
    request_type, description, priority, status,
    routed_to, resolved_by, resolved_at, resolution_note,
    created_at, updated_at
) VALUES
-- OPEN (3)
('k1000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000001',
 'g1000000-0000-0000-0000-000000000016',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='10'),
 'concierge','Requesting dinner reservation at Blue Heaven for tonight, party of 2.',
 'normal','open',
 NULL, NULL, NULL, NULL,
 NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),

('k1000000-0000-0000-0000-000000000002',
 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000002',
 'g1000000-0000-0000-0000-000000000017',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='11'),
 'amenity','Need extra pillows — currently only 2, request 4 total.',
 'normal','open',
 NULL, NULL, NULL, NULL,
 NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes'),

('k1000000-0000-0000-0000-000000000003',
 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000007',
 'g1000000-0000-0000-0000-000000000027',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='32'),
 'housekeeping','Requested late stayover clean — after 3pm preferred.',
 'normal','open',
 NULL, NULL, NULL, NULL,
 NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),

-- RESOLVED (3)
('k1000000-0000-0000-0000-000000000004',
 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000003',
 'g1000000-0000-0000-0000-000000000018',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='12'),
 'amenity','Requested extra towels — pool use.',
 'low','resolved',
 NULL,
 'c0000000-0000-0000-0000-000000000003',
 NOW() - INTERVAL '3 hours',
 'Delivered 4 pool towels to room 12.',
 NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours'),

('k1000000-0000-0000-0000-000000000005',
 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000005',
 'g1000000-0000-0000-0000-000000000021',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='15'),
 'concierge','Asked for snorkeling recommendations and equipment rental near hotel.',
 'normal','resolved',
 NULL,
 'c0000000-0000-0000-0000-000000000003',
 NOW() - INTERVAL '5 hours',
 'Provided Fury Water Adventures contact, booked 9am slot for guest.',
 NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours'),

('k1000000-0000-0000-0000-000000000006',
 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000006',
 'g1000000-0000-0000-0000-000000000019',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='13'),
 'housekeeping','Room 13 A/C not cooling. Requested immediate attention.',
 'high','resolved',
 'maintenance',
 'c0000000-0000-0000-0000-000000000003',
 NOW() - INTERVAL '3 hours 30 minutes',
 'Maintenance dispatched. Thermostat replacement in progress.',
 NOW() - INTERVAL '5 hours', NOW() - INTERVAL '3 hours 30 minutes'),

-- ROUTED TO WORK ORDER (2)
('k1000000-0000-0000-0000-000000000007',
 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000004',
 'g1000000-0000-0000-0000-000000000024',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='26'),
 'maintenance','Bathroom light switch sparking when flipped. Concerned about safety.',
 'high','routed',
 'maintenance', NULL, NULL, NULL,
 NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '15 minutes'),

('k1000000-0000-0000-0000-000000000008',
 'b0000000-0000-0000-0000-000000000001',
 'f1000000-0000-0000-0000-000000000007',
 'g1000000-0000-0000-0000-000000000020',
 (SELECT id FROM rooms WHERE hotel_id='b0000000-0000-0000-0000-000000000001' AND room_number='11'),
 'maintenance','Fridge not keeping food cold. Medicine inside requires refrigeration.',
 'urgent','routed',
 'maintenance', NULL, NULL, NULL,
 NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '25 minutes')

ON CONFLICT (id) DO NOTHING;

-- Link routed requests to their resulting work orders
UPDATE guest_requests
SET resulting_work_order_id = 'e1000000-0000-0000-0000-000000000005'
WHERE id = 'k1000000-0000-0000-0000-000000000007'
  AND resulting_work_order_id IS NULL;

UPDATE guest_requests
SET resulting_work_order_id = 'e1000000-0000-0000-0000-000000000002'
WHERE id = 'k1000000-0000-0000-0000-000000000008'
  AND resulting_work_order_id IS NULL;
