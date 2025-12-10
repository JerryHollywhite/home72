# Fresh Deployment Guide - Home72

## Step 1: Deploy ke Vercel (Baru)

1. **Buka Vercel:** https://vercel.com
2. **Klik "Add New..."** → **Project**
3. **Import Git Repository:**
   - Cari repository: `JerryHollywhite/home72`
   - Klik **Import**
4. **Configure Project:**
   - Project Name: `home72` (atau biarkan default)
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
5. **JANGAN DEPLOY DULU!** Klik **Environment Variables** section dulu

---

## Step 2: Add Environment Variables

**Klik "Environment Variables" dan add satu-satu:**

### Dari Supabase (https://supabase.com/dashboard → Project → Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL
[Copy dari Supabase Project URL]

NEXT_PUBLIC_SUPABASE_ANON_KEY
[Copy dari Supabase anon/public key]

SUPABASE_SERVICE_ROLE_KEY
[Copy dari Supabase service_role key - yang secret!]
```

### Email & App Config:

```
RESEND_API_KEY
re_VmDwsQQ4_9nrQsYqkiFW4XwSpHapdpWfN

NEXT_PUBLIC_APP_URL
https://home72.vercel.app
(ATAU tunggu deploy selesai, lalu update dengan URL actual)

CRON_SECRET
home72_cron_secret_2025
```

### Telegram Bot:

```
TELEGRAM_BOT_TOKEN
8227312044:AAFlTSDqFsjHeQjmSOZ_sZDIrrQ7YQ0F70w

TELEGRAM_WEBHOOK_URL
https://home72.vercel.app/api/telegram/webhook
(ATAU tunggu deploy selesai, lalu update dengan URL actual)
```

---

## Step 3: Deploy!

1. Setelah semua env vars di-add
2. Klik **Deploy**
3. Tunggu 2-3 menit

---

## Step 4: Update URL (Jika Berubah)

Setelah deploy selesai, note URL nya (misal: `home72-xxx.vercel.app`)

**Jika URL berbeda dari `home72.vercel.app`:**

1. Di Vercel → Project Settings → Environment Variables
2. Edit `NEXT_PUBLIC_APP_URL` → Update dengan URL baru
3. Edit `TELEGRAM_WEBHOOK_URL` → Update dengan URL baru
4. **Redeploy** (Settings → Deployments → Latest → ⋮ → Redeploy)

---

## Step 5: Setup Telegram Webhook

Setelah deploy sukses, run command ini (ganti URL jika perlu):

```bash
curl -X POST "https://api.telegram.org/bot8227312044:AAFlTSDqFsjHeQjmSOZ_sZDIrrQ7YQ0F70w/setWebhook" \
  -d "url=https://home72.vercel.app/api/telegram/webhook"
```

---

## Step 6: Setup Supabase Database

### A. Run Schema SQL

1. Buka https://supabase.com/dashboard
2. Pilih project Home72
3. **SQL Editor** → **New query**
4. Copy paste file: `supabase-schema.sql` (LENGKAP!)
5. **Run** (Ctrl+Enter)

### B. Run Tenant Migration

1. Di SQL Editor, **New query** lagi
2. Copy paste file: `supabase-tenant-portal-migration.sql`
3. **Run**

### C. Create Admin User

1. Supabase → **Authentication** → **Users**
2. **Add user**
3. Email: `jerryhollywhite@gmail.com`
4. Password: `Keluarga77A`
5. Auto Confirm: ON
6. **Create**

---

## Step 7: Test Application!

### Test 1: Admin Login
- URL: https://home72.vercel.app/auth/login
- Email: `jerryhollywhite@gmail.com`
- Pass: `Keluarga77A`

### Test 2: Tenant Portal
- URL: https://home72.vercel.app/tenant/login
- Room: `103`

### Test 3: Booking
- URL: https://home72.vercel.app/booking
- Should show available rooms

### Test 4: Telegram Bot
- Find bot in Telegram
- Send: `/start`
- Input: `103`

---

## Troubleshooting

**If errors occur:**
1. Check Vercel deployment logs
2. Verify Supabase env vars are correct
3. Check Supabase SQL ran successfully
4. Verify admin user created

---

**Ready to start? Let me know when you're at each step!**
