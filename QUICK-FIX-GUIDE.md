# Quick Fix Guide - Production Issues

## Issue 1: Admin Login - Invalid API Key

**Penyebab:** User `jerryhollywhite@gmail.com` belum terdaftar di Supabase Auth

**Solusi Tercepat:**
1. Buka https://supabase.com/dashboard
2. Pilih project Home72
3. Klik **Authentication** → **Users**
4. Klik **Add User**
5. Email: `jerryhollywhite@gmail.com`
6. Password: `Keluarga77A`
7. Klik **Create User**

**Atau alternatif:** Buat akun baru via sign up di aplikasi (belum ada halaman signup, jadi pakai Supabase dashboard)

---

## Issue 2 & 3: Tenant Login & Booking - No Data

**Penyebab:** Database production masih kosong (belum ada rooms & tenants)

**Solusi Tercepat:**

### Step 1: Buka Supabase SQL Editor
1. https://supabase.com/dashboard → Pilih project Home72
2. Klik **SQL Editor** (di sidebar kiri)
3. Klik **New query**

### Step 2: Run Quick Fix SQL
1. Buka file: `quick-fix-data.sql` (di folder project)
2. **Copy seluruh isi file**
3. **Paste** di Supabase SQL Editor
4. Klik **Run** (Ctrl+Enter)

### Step 3: Verify
Jika sukses, akan muncul:
```
Rooms: 5
Tenants: 1  
Payments: 1
```

Dan list rooms, tenants, payments akan tampil di bawah.

---

## What Gets Inserted

**5 Rooms:**
- 101, 102 (Standard, Rp 1.200.000) - Available
- 103 (Deluxe, Rp 1.500.000) - Occupied by Budi Santoso
- 201, 202 (Standard & Deluxe) - Available

**1 Tenant:**
- Budi Santoso - Room 103
- Phone: 08123456789
- Email: budi@example.com

**1 Payment:**
- Room 103 - December 2024
- Status: Verified
- Amount: Rp 1.500.000

---

## After Running SQL

Test again:

### ✅ Admin Login
- URL: https://home72.vercel.app/auth/login
- Email: `jerryhollywhite@gmail.com`
- Password: `Keluarga77A`
- Should work after creating user in Supabase Auth

### ✅ Tenant Login
- URL: https://home72.vercel.app/tenant/login
- Room: `103`
- Should show Budi Santoso's dashboard

### ✅ Booking
- URL: https://home72.vercel.app/booking
- Should show 4 available rooms (101, 102, 201, 202)

---

## Quick Checklist

- [ ] Create user `jerryhollywhite@gmail.com` in Supabase Auth  
- [ ] Run `quick-fix-data.sql` in Supabase SQL Editor
- [ ] Test admin login
- [ ] Test tenant login with room 103
- [ ] Test booking page

---

**Jika masih ada error, screenshot dan beritahu saya!**
