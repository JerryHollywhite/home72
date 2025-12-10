-- Check reports table to see photo_url format
SELECT id, message, photo_url, status, created_at 
FROM reports 
ORDER BY created_at DESC 
LIMIT 5;
