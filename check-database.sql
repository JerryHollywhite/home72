-- Cek apakah tabel sudah dibuat
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Cek apakah ada user di tabel auth.users
SELECT email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
