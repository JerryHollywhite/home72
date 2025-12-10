-- Create Storage Buckets for Home72
-- Run this in Supabase SQL Editor

-- 1. Create 'report-photos' bucket (Public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('report-photos', 'report-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create 'payment-proofs' bucket (Public for Admin access)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Policy: Allow anyone to view (public)
CREATE POLICY "Public Access Report Photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'report-photos');

CREATE POLICY "Public Access Payment Proofs" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-proofs');

-- 4. Policy: Allow authenticated (Service Role/Bot) to upload
CREATE POLICY "Bot Upload Reports" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'report-photos');
  
CREATE POLICY "Bot Upload Payments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');

-- Verify buckets
SELECT * FROM storage.buckets;
