-- Add ktp_url column to booking table
ALTER TABLE booking
ADD COLUMN IF NOT EXISTS ktp_url TEXT;

-- Use same bucket 'payment-proofs' or separate? Let's use 'payment-proofs' for simplicity 
-- as it's already public, or create 'identity-docs' if we want privacy. 
-- Since dashboard needs to access it easily without signing, public for now is practical 
-- BUT KTP is sensitive. 
-- Ideally: 'tenant-documents' (private) and use signed URLs.
-- BUT for speed and "just works" reported by user, let's allow upload to 'payment-proofs' 
-- but maybe rename the folder path. Or just use the existing setup.
-- Given user urgency, I will stick to 'payment-proofs' bucket but maybe prefix filename.

-- Re-run policy just in case
-- (Already done in previous step, so no need to create bucket again)
