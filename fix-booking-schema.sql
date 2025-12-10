-- Add proof_url column to booking table if it doesn't exist
ALTER TABLE booking
ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- Create storage bucket for payment proofs if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow anyone to upload to payment-proofs (since booking is public)
-- Ideally we restrict this, but for now 'anon' needs to upload.
CREATE POLICY "Anyone can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'payment-proofs' );

-- Policy to allow anyone to view payment proofs (public bucket)
CREATE POLICY "Anyone can view payment proofs"
ON storage.objects FOR SELECT
USING ( bucket_id = 'payment-proofs' );

-- Fix Dashboard RLS access? No, that's code side.
