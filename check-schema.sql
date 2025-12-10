-- Step 1: Check what columns exist in your rooms table
-- Run this FIRST to see the actual schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rooms' 
ORDER BY ordinal_position;

-- Step 2: Check tenants table too
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;

-- Step 3: Check payments table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;
