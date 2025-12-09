-- =========================================
-- Home72 Database Schema for Supabase
-- =========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- TABLES
-- =========================================

-- Users table (admin/staff)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number TEXT NOT NULL UNIQUE,
    price NUMERIC(12, 2) NOT NULL,
    capacity INT NOT NULL DEFAULT 1,
    facilities JSONB DEFAULT '[]'::jsonb,
    photos TEXT[] DEFAULT ARRAY[]::TEXT[],
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    contract_url TEXT,
    id_card_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    proof_url TEXT,
    pay_date DATE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table (complaints/maintenance requests)
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    photo_url TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking table
CREATE TABLE booking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    dp_amount NUMERIC(12, 2),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'canceled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX idx_tenants_room_id ON tenants(room_id);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_reports_tenant_id ON reports(tenant_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_booking_room_id ON booking(room_id);
CREATE INDEX idx_rooms_status ON rooms(status);

-- =========================================
-- TRIGGERS FOR UPDATED_AT
-- =========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking ENABLE ROW LEVEL SECURITY;

-- Users policies (admins only)
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert users" ON users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update users" ON users
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Rooms policies
CREATE POLICY "Anyone can view available rooms" ON rooms
    FOR SELECT USING (status = 'available' OR auth.role() = 'authenticated');

CREATE POLICY "Admins can manage rooms" ON rooms
    FOR ALL USING (auth.role() = 'authenticated');

-- Tenants policies
CREATE POLICY "Admins can view all tenants" ON tenants
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage tenants" ON tenants
    FOR ALL USING (auth.role() = 'authenticated');

-- Payments policies
CREATE POLICY "Admins can view all payments" ON payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage payments" ON payments
    FOR ALL USING (auth.role() = 'authenticated');

-- Reports policies
CREATE POLICY "Admins can view all reports" ON reports
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage reports" ON reports
    FOR ALL USING (auth.role() = 'authenticated');

-- Booking policies
CREATE POLICY "Anyone can create bookings" ON booking
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all bookings" ON booking
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage bookings" ON booking
    FOR ALL USING (auth.role() = 'authenticated');

-- =========================================
-- STORAGE BUCKETS (Run in Supabase Dashboard)
-- =========================================

-- Create storage buckets (these must be created via Supabase Dashboard or SQL)
-- bucket: 'room-photos' (public)
-- bucket: 'payment-proofs' (private)
-- bucket: 'tenant-documents' (private)
-- bucket: 'report-photos' (public)

-- =========================================
-- SAMPLE DATA (Optional for testing)
-- =========================================

-- Insert sample admin user
INSERT INTO users (email, role) VALUES 
    ('admin@home72.com', 'owner');

-- Insert sample rooms
INSERT INTO rooms (room_number, price, capacity, facilities, status) VALUES 
    ('101', 1500000, 1, '["AC", "Kasur", "Lemari", "WiFi"]'::jsonb, 'available'),
    ('102', 1800000, 1, '["AC", "Kasur", "Lemari", "WiFi", "Kamar Mandi Dalam"]'::jsonb, 'available'),
    ('103', 1500000, 1, '["AC", "Kasur", "Lemari", "WiFi"]'::jsonb, 'occupied'),
    ('104', 2000000, 2, '["AC", "2 Kasur", "Lemari", "WiFi", "Kamar Mandi Dalam"]'::jsonb, 'available');

-- Sample tenant (for room 103)
INSERT INTO tenants (name, phone, email, room_id, start_date, due_date, status) 
VALUES (
    'Budi Santoso',
    '081234567890',
    'budi@example.com',
    (SELECT id FROM rooms WHERE room_number = '103'),
    '2025-01-01',
    '2025-01-25',
    'active'
);

-- Update room 103 to occupied
UPDATE rooms SET status = 'occupied' WHERE room_number = '103';
