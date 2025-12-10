-- Quick Fix SQL - Insert Sample Data for Home72 (CORRECT SCHEMA)
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- STEP 0: Clean up existing sample data (if any)
DELETE FROM payments WHERE tenant_id IN (SELECT id FROM tenants WHERE phone = '081234567890');
DELETE FROM tenants WHERE phone = '081234567890';
DELETE FROM rooms WHERE room_number IN ('101', '102', '103', '104');

-- 1. Insert Sample Rooms (4 rooms) - Using CORRECT schema
INSERT INTO rooms (room_number, price, capacity, facilities, status) VALUES 
('101', 1500000, 1, '["AC", "Kasur", "Lemari", "WiFi"]'::jsonb, 'available'),
('102', 1800000, 1, '["AC", "Kasur", "Lemari", "WiFi", "Kamar Mandi Dalam"]'::jsonb, 'available'),
('103', 1500000, 1, '["AC", "Kasur", "Lemari", "WiFi"]'::jsonb, 'occupied'),
('104', 2000000, 2, '["AC", "2 Kasur", "Lemari", "WiFi", "Kamar Mandi Dalam"]'::jsonb, 'available');

-- 2. Insert Sample Tenant for Room 103 (Using room_id reference)
INSERT INTO tenants (name, phone, email, room_id, start_date, due_date, status) 
VALUES (
    'Budi Santoso',
    '081234567890',
    'budi@example.com',
    (SELECT id FROM rooms WHERE room_number = '103'),
    '2025-01-01',
    '2025-12-25',
    'active'
);

-- 3. Insert Sample Payment for Budi Santoso (December 2024)
INSERT INTO payments (tenant_id, month, amount, status, payment_method, pay_date, verified_at)
SELECT 
  id,
  '2024-12',
  1500000,
  'verified',
  'transfer',
  '2024-12-01',
  NOW()
FROM tenants WHERE name = 'Budi Santoso';

-- Verify the data
SELECT 'Rooms Created:' as info, COUNT(*) as total FROM rooms;
SELECT 'Tenants Created:' as info, COUNT(*) as total FROM tenants;
SELECT 'Payments Created:' as info, COUNT(*) as total FROM payments;

-- Show the data
SELECT * FROM rooms ORDER BY room_number;
SELECT t.name, t.phone, r.room_number, t.start_date, t.due_date, t.status 
FROM tenants t 
JOIN rooms r ON t.room_id = r.id;
SELECT p.month, p.amount, p.status, t.name 
FROM payments p 
JOIN tenants t ON p.tenant_id = t.id;
