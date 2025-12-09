# Troubleshooting Login - Home72

## Problem: Tidak bisa login

### Langkah Troubleshooting:

## 1. ✅ CEK DATABASE SCHEMA
Pastikan Anda sudah menjalankan `supabase-schema.sql`:

**Cara cek:**
1. Buka Supabase Dashboard: https://supabase.com/dashboard/project/crxpyjtsqjqvjdduuslb
2. Klik **SQL Editor**
3. Copy query dari `check-database.sql` yang sudah saya buatkan
4. Run untuk cek apakah tabel sudah ada

**Output yang diharapkan:**
```
booking
payments
reports
rooms
tenants
users
```

Jika tabel BELUM ada, Anda harus:
- Copy SELURUH isi `supabase-schema.sql`
- Paste di SQL Editor
- Run

---

## 2. ✅ CEK/BUAT USER ADMIN

Ada 2 cara:

### Cara A: Gunakan Sample User (dari schema SQL)
Jika Anda sudah run schema SQL, ada sample admin:
- Email: `admin@home72.com`
- Password: `password123`

### Cara B: Buat User Baru (Recommended)
1. Buka Supabase Dashboard → **Authentication** → **Users**
2. Klik **Add User** → **Create new user**
3. Isi:
   - Email: email Anda (contoh: `admin@home72.com`)
   - Password: password Anda (contoh: `Admin123!`)
   - ✅ Auto Confirm User: **YES** (centang ini!)
4. Klik **Create User**

**PENTING**: Pastikan "Auto Confirm User" dicentang!

---

## 3. ✅ CEK DEV SERVER

Jalankan dev server:
```bash
cd /Users/macbookair/Desktop/Kosan\ Home72/home72
npm run dev
```

Buka browser: http://localhost:3000

---

## 4. ✅ TEST LOGIN

1. Buka http://localhost:3000/auth/login
2. Masukkan:
   - Email: `admin@home72.com` (atau email yang Anda buat)
   - Password: `password123` (atau password yang Anda set)
3. Klik **Masuk**

---

## 5. 🔍 CEK ERROR

Jika masih tidak bisa login, cek:

### A. Buka Browser Console (F12)
- Klik kanan → Inspect → Console
- Lihat ada error merah?
- Screenshot dan kirim ke saya

### B. Cek Terminal
- Lihat output di terminal tempat `npm run dev` jalan
- Ada error?

### C. Common Errors:

**Error: "Invalid login credentials"**
- ✅ Email/password salah
- ✅ User belum di-confirm (pastikan Auto Confirm User aktif saat buat user)

**Error: "Invalid API key"**
- ✅ Cek `.env.local` sudah benar
- ✅ Restart dev server

**Error: Network/Fetch failed**
- ✅ Cek koneksi internet
- ✅ Cek Supabase project masih aktif

---

## 6. ✅ SOLUSI CEPAT: Reset Password

Jika lupa password atau user bermasalah:

1. Di Supabase Dashboard → Authentication → Users
2. Klik user yang bermasalah
3. Klik **Send Magic Link** atau **Reset Password**
4. Atau hapus user lama dan buat baru

---

## 7. 📧 ALTERNATIVE: Magic Link Login

Untuk quick test, tambahkan magic link login:

1. Di Supabase Dashboard → Authentication → Providers
2. Pastikan **Email** provider aktif
3. Enable **Magic Link**

Kemudian di aplikasi, user bisa login via email (tanpa password).

---

## Quick Checklist:

- [ ] Database schema sudah di-run (`supabase-schema.sql`)
- [ ] Tabel `users`, `rooms`, dll sudah ada di database
- [ ] User admin sudah dibuat di Authentication → Users
- [ ] "Auto Confirm User" sudah dicentang saat buat user
- [ ] `.env.local` sudah berisi credentials yang benar
- [ ] Dev server running (`npm run dev`)
- [ ] Browser dibuka di http://localhost:3000/auth/login
- [ ] Email dan password yang dimasukkan BENAR

---

## Masih Bermasalah?

Kirim screenshot dari:
1. Halaman login (dengan error message jika ada)
2. Browser console (F12 → Console)
3. Terminal output (tempat `npm run dev` jalan)
4. Supabase Authentication → Users page

Saya akan bantu lebih detail!
