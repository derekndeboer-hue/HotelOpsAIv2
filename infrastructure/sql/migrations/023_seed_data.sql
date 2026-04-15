-- Migration 023: Seed Data for The Gardens Hotel
-- Fixed UUIDs for easy reference in development and testing

-- Fixed IDs
-- Tenant:  a0000000-0000-0000-0000-000000000001
-- Hotel:   b0000000-0000-0000-0000-000000000001
-- Staff:   c0000000-0000-0000-0000-00000000000X

-- ============================================================
-- TENANT
-- ============================================================
INSERT INTO tenants (id, name, subdomain, subscription_tier, settings) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'The Gardens Hotel',
    'gardens',
    'professional',
    '{"features": ["housekeeping", "maintenance", "concierge", "guest_intelligence", "compliance"]}'
);

-- ============================================================
-- HOTEL
-- ============================================================
INSERT INTO hotels (id, tenant_id, name, address, total_rooms, timezone) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'The Gardens Hotel',
    '{
        "street": "526 Angela Street",
        "city": "Key West",
        "state": "FL",
        "zip": "33040",
        "country": "US",
        "latitude": 24.5535,
        "longitude": -81.7964
    }'::JSONB,
    44,
    'America/New_York'
);

-- ============================================================
-- STAFF
-- ============================================================
-- Admin
INSERT INTO staff (id, tenant_id, hotel_id, email, password_hash, first_name, last_name, role, phone) VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'admin@gardenshotel.com',
    '$2b$12$placeholder',
    'System',
    'Admin',
    'admin',
    '305-294-2000'
),
-- General Manager
(
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'gm@gardenshotel.com',
    '$2b$12$placeholder',
    'Michael',
    'Torres',
    'general_manager',
    '305-294-2001'
),
-- Front Desk
(
    'c0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'frontdesk@gardenshotel.com',
    '$2b$12$placeholder',
    'Sarah',
    'Chen',
    'front_desk',
    '305-294-2002'
),
-- Housekeeping Supervisor
(
    'c0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'hk.super@gardenshotel.com',
    '$2b$12$placeholder',
    'Maria',
    'Rodriguez',
    'hk_supervisor',
    '305-294-2003'
),
-- Room Attendant 1
(
    'c0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'attendant1@gardenshotel.com',
    '$2b$12$placeholder',
    'Ana',
    'Gutierrez',
    'room_attendant',
    '305-294-2004'
),
-- Room Attendant 2
(
    'c0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'attendant2@gardenshotel.com',
    '$2b$12$placeholder',
    'Carmen',
    'Diaz',
    'room_attendant',
    '305-294-2005'
),
-- Maintenance Supervisor
(
    'c0000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'maint.super@gardenshotel.com',
    '$2b$12$placeholder',
    'James',
    'Mitchell',
    'maint_supervisor',
    '305-294-2006'
),
-- Engineer 1
(
    'c0000000-0000-0000-0000-000000000008',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'engineer1@gardenshotel.com',
    '$2b$12$placeholder',
    'Robert',
    'Johnson',
    'engineer',
    '305-294-2007'
),
-- Engineer 2
(
    'c0000000-0000-0000-0000-000000000009',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'engineer2@gardenshotel.com',
    '$2b$12$placeholder',
    'David',
    'Williams',
    'engineer',
    '305-294-2008'
);

-- ============================================================
-- ROOMS (44 total)
-- Fleming Zone: Rooms 1-27
-- Simonton Zone: Rooms 30-34, 40-42, 50, 60-63, 70-73
-- ============================================================

-- Helper: all rooms share tenant and hotel
-- Fleming Zone - Ground Floor (rooms 1-9)
INSERT INTO rooms (tenant_id, hotel_id, room_number, floor, room_type, status, notes) VALUES
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '1',  1, 'standard',       'clean', 'Fleming wing, garden view'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '2',  1, 'standard',       'clean', 'Fleming wing, garden view'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '3',  1, 'standard',       'clean', 'Fleming wing, garden view'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '4',  1, 'deluxe',         'clean', 'Fleming wing, pool view'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '5',  1, 'deluxe',         'clean', 'Fleming wing, pool view'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '6',  1, 'deluxe',         'clean', 'Fleming wing, pool view'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '7',  1, 'standard',       'clean', 'Fleming wing, courtyard'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '8',  1, 'standard',       'clean', 'Fleming wing, courtyard'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '9',  1, 'ada_accessible', 'clean', 'Fleming wing, ADA accessible, courtyard'),

-- Fleming Zone - Second Floor (rooms 10-18)
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10', 2, 'superior',       'clean', 'Fleming wing, garden view'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '11', 2, 'superior',       'clean', 'Fleming wing, garden view'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '12', 2, 'superior',       'clean', 'Fleming wing, pool view'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '13', 2, 'deluxe',         'clean', 'Fleming wing, pool view'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '14', 2, 'deluxe',         'clean', 'Fleming wing, pool view'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '15', 2, 'premium',        'clean', 'Fleming wing, balcony, garden view'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '16', 2, 'premium',        'clean', 'Fleming wing, balcony, pool view'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '17', 2, 'standard',       'clean', 'Fleming wing, courtyard view'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '18', 2, 'standard',       'clean', 'Fleming wing, courtyard view'),

-- Fleming Zone - Third Floor / Upper (rooms 19-27)
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '19', 2, 'superior',       'clean', 'Fleming wing, upper'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '20', 2, 'deluxe',         'clean', 'Fleming wing, upper, pool view'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '21', 2, 'premium',        'clean', 'Fleming wing, upper, balcony'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '22', 2, 'deluxe',         'clean', 'Fleming wing, upper'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '23', 2, 'standard',       'clean', 'Fleming wing, upper'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '24', 2, 'standard',       'clean', 'Fleming wing, upper'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '25', 2, 'superior',       'clean', 'Fleming wing, upper, garden view'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '26', 2, 'deluxe',         'clean', 'Fleming wing, upper'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '27', 2, 'premium',        'clean', 'Fleming wing, upper, balcony, premium bath'),

-- Simonton Zone - 30 block (rooms 30-34)
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '30', 1, 'cottage',        'clean', 'Simonton wing, private entrance'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '31', 1, 'cottage',        'clean', 'Simonton wing, private entrance'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '32', 1, 'cottage',        'clean', 'Simonton wing, private entrance, garden'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '33', 1, 'deluxe',         'clean', 'Simonton wing'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '34', 1, 'deluxe',         'clean', 'Simonton wing'),

-- Simonton Zone - 40 block (rooms 40-42)
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '40', 1, 'suite',          'clean', 'Simonton wing, junior suite'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '41', 1, 'suite',          'clean', 'Simonton wing, junior suite, garden'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '42', 1, 'suite',          'clean', 'Simonton wing, master suite'),

-- Simonton Zone - 50 block (room 50)
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '50', 1, 'premium',        'clean', 'Simonton wing, private patio'),

-- Simonton Zone - 60 block (rooms 60-63)
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '60', 1, 'standard',       'clean', 'Simonton wing, courtyard'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '61', 1, 'standard',       'clean', 'Simonton wing, courtyard'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '62', 1, 'deluxe',         'clean', 'Simonton wing, garden view'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '63', 1, 'deluxe',         'clean', 'Simonton wing, garden view'),

-- Simonton Zone - 70 block (rooms 70-73)
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '70', 2, 'superior',       'clean', 'Simonton wing, upper level'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '71', 2, 'superior',       'clean', 'Simonton wing, upper level'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '72', 2, 'premium',        'clean', 'Simonton wing, upper, balcony'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '73', 2, 'premium',        'clean', 'Simonton wing, upper, balcony, sunset view');
