# 🚀 Home72 - Deployment & Webhook Setup Guide

## Apa itu Webhook?

**Webhook** adalah cara untuk aplikasi menerima notifikasi otomatis dari layanan lain (dalam hal ini Telegram).

**Analogi sederhana:**
- Tanpa webhook: Aplikasi harus terus-menerus "nanya" ke Telegram "Ada pesan baru gak?"
- Dengan webhook: Telegram yang otomatis "kirim" pesan ke aplikasi kita setiap ada update

**Untuk Telegram Bot:**
- Setiap ada user kirim pesan/foto/command ke bot
- Telegram langsung kirim data tersebut ke URL webhook kita
- Aplikasi kita proses dan balas ke user

---

## 📦 Deployment ke Vercel (Production)

### 1. Push Code ke GitHub

```bash
cd "/Users/macbookair/Desktop/Kosan Home72/home72"

# Initialize git (jika belum)
git init

# Add all files
git add .

# Commit
git commit -m "Complete Home72 app with tenant portal and Telegram bot"

# Create repo di GitHub.com terlebih dahulu, lalu:
git remote add origin https://github.com/USERNAME/home72.git
git branch -M main
git push -u origin main
```

### 2. Deploy ke Vercel

1. **Login ke Vercel:**
   - Kunjungi https://vercel.com
   - Login dengan GitHub account

2. **Import Project:**
   - Click "Add New Project"
   - Select repo `home72`
   - Click "Import"

3. **Configure Environment Variables:**
   
   Di halaman deployment, tambahkan semua env variables dari `.env.local`:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://crxpyjtsqjqvjdduuslb.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY = eyJhbGci...
   RESEND_API_KEY = re_VmDwsQQ4...
   NEXT_PUBLIC_APP_URL = https://home72.otomasikan.com
   CRON_SECRET = home72_cron_secret_2025
   TELEGRAM_BOT_TOKEN = 8227312044:AAFlTSDqFsjHeQ...
   TELEGRAM_WEBHOOK_URL = https://home72.otomasikan.com/api/telegram/webhook
   ```

4. **Deploy:**
   - Click "Deploy"
   - Tunggu 2-3 menit
   - Vercel akan beri URL: `https://home72.vercel.app`

---

## 🌐 Setup Custom Domain (home72.otomasikan.com)

### Di Vercel:

1. Go to Project Settings → Domains
2. Add Domain: `home72.otomasikan.com`
3. Vercel akan tampilkan DNS records yang perlu diatur

### Di Cloudflare:

1. Login ke Cloudflare
2. Pilih domain `otomasikan.com`
3. Go to DNS → Records
4. Add CNAME record:
   ```
   Type: CNAME
   Name: home72
   Target: cname.vercel-dns.com
   Proxy status: DNS only (grey cloud)
   ```
5. Save

**Tunggu 5-10 menit** untuk DNS propagation.

Cek dengan:
```bash
dig home72.otomasikan.com
```

---

## 🤖 Setup Telegram Webhook

### Apa yang Terjadi:

1. User kirim pesan ke bot Home72
2. Telegram server kirim POST request ke: `https://home72.otomasikan.com/api/telegram/webhook`
3. Aplikasi kita proses di file: `app/api/telegram/webhook/route.ts`
4. Aplikasi balas ke user via Telegram API

### Set Webhook (Setelah Deploy):

**Via Terminal/Postman:**

```bash
curl -X POST "https://api.telegram.org/bot8227312044:AAFlTSDqFsjHeQjmSOZ_sZDIrrQ7YQ0F70w/setWebhook" \
  -d "url=https://home72.otomasikan.com/api/telegram/webhook"
```

**Response yang benar:**
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

### Cek Webhook Status:

```bash
curl "https://api.telegram.org/bot8227312044:AAFlTSDqFsjHeQjmSOZ_sZDIrrQ7YQ0F70w/getWebhookInfo"
```

**Response:**
```json
{
  "ok": true,
  "result": {
    "url": "https://home72.otomasikan.com/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "last_error_date": 0
  }
}
```

### Hapus Webhook (jika perlu reset):

```bash
curl -X POST "https://api.telegram.org/bot8227312044:AAFlTSDqFsjHeQjmSOZ_sZDIrrQ7YQ0F70w/deleteWebhook"
```

---

## 🧪 Testing Setelah Deploy

### 1. Test Admin Panel

- Buka: https://home72.otomasikan.com
- Login dengan: `jerryhollywhite@gmail.com` / `Keluarga77A`
- Cek dashboard, rooms, tenants, payments

### 2. Test Tenant Portal

- Buka: https://home72.otomasikan.com/tenant/login
- Masukkan nomor kamar: `103`
- Cek dashboard, payment, history, complaints

### 3. Test Public Booking

- Buka: https://home72.otomasikan.com/booking
- Lihat kamar tersedia
- Submit booking test

### 4. Test Telegram Bot

**Step 1: Find Bot**
```
1. Buka Telegram
2. Search: @YourBotUsername (tanya BotFather untuk username)
3. Atau click link: https://t.me/YourBotUsername
```

**Step 2: Test Commands**
```
/start
(Reply dengan nomor kamar: 103)

/bayar
(Kirim foto bukti transfer)

/status
(Cek status pembayaran)

/help
(Lihat semua commands)
```

---

## 🔍 Troubleshooting

### Webhook Tidak Berfungsi

**Cek 1: Webhook ter-set dengan benar?**
```bash
curl "https://api.telegram.org/bot8227312044:AAFlTSDqFsjHeQjmSOZ_sZDIrrQ7YQ0F70w/getWebhookInfo"
```

Pastikan `url` benar dan `pending_update_count` nya 0.

**Cek 2: Endpoint accessible?**
```bash
curl -X POST https://home72.otomasikan.com/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -d '{"message":{"text":"test"}}'
```

Should return `{"ok":true}`

**Cek 3: Lihat Vercel Logs**
1. Go to Vercel Dashboard
2. Click project "home72"
3. Go to "Logs" tab
4. Filter by "/api/telegram/webhook"
5. Lihat error jika ada

**Cek 4: Environment Variables**
Pastikan `TELEGRAM_BOT_TOKEN` dan semua env vars ter-set di Vercel

### Bot Tidak Merespon

1. **Reset webhook:**
   ```bash
   curl -X POST "https://api.telegram.org/bot.../deleteWebhook"
   curl -X POST "https://api.telegram.org/bot.../setWebhook" -d "url=..."
   ```

2. **Test langsung di bot:**
   Kirim `/start` lagi

3. **Cek database:**
   - Buka Supabase → telegram_sessions table
   - Pastikan ada record dengan chat_id Anda

### Domain Belum Aktif

```bash
# Cek DNS propagation
dig home72.otomasikan.com

# Atau online tools:
# https://dnschecker.org
```

Tunggu maksimal 24 jam (biasanya 5-10 menit).

---

## 📊 Monitoring

### Vercel Dashboard
- **Deployments**: Lihat history deployment
- **Logs**: Real-time logs
- **Analytics**: Traffic, errors
- **Domains**: DNS status

### Supabase Dashboard
- **Database**: Lihat tables, data
- **Storage**: Files uploaded
- **Logs**: Database queries
- **Auth**: User sessions

### Telegram Bot
- **GetUpdates** (manual polling for debug):
  ```bash
  curl "https://api.telegram.org/bot8227312044:AAFlTSDqFsjHeQjmSOZ_sZDIrrQ7YQ0F70w/getUpdates"
  ```

---

## 🎯 Deployment Checklist

**Sebelum Deploy:**
- [x] Code lengkap dan tested locally
- [x] Environment variables lengkap
- [x] Database migration sudah di-run
- [x] Storage buckets sudah dibuat

**Deploy ke Vercel:**
- [ ] Push code ke GitHub
- [ ] Import project di Vercel
- [ ] Set environment variables
- [ ] Deploy successful
- [ ] Custom domain configured (optional)

**Setup Telegram:**
- [ ] Bot dibuat via BotFather
- [ ] Bot token ada di env vars
- [ ] Webhook di-set ke production URL
- [ ] Webhook info menunjukkan status OK

**Testing:**
- [ ] Admin panel accessible
- [ ] Tenant portal berfungsi
- [ ] Public booking works
- [ ] Telegram bot merespon /start
- [ ] Telegram bot dapat terima foto
- [ ] Email reminders (test via cron manually)

---

## 🔄 Update Code (Setelah Deploy)

Jika ada perubahan code:

```bash
# Edit files
git add .
git commit -m "Update feature X"
git push

# Vercel auto-deploy!
# Tunggu 2-3 menit, perubahan live
```

No need to set webhook lagi, kecuali URL berubah.

---

## 💡 Tips Production

1. **Security:**
   - Jangan commit `.env.local` ke GitHub
   - Gunakan Vercel Environment Variables
   - Add CRON_SECRET untuk webhook auth (future)

2. **Performance:**
   - Vercel auto-scale
   - Supabase connection pooling otomatis
   - Monitor di Vercel Analytics

3. **Backup:**
   - Supabase auto-backup daily
   - Download manual di Supabase Dashboard

4. **Updates:**
   - Test di localhost dulu
   - Deploy ke Vercel (auto-preview untuk PR)
   - Merge ke main untuk production

---

**Selamat Deploy! 🚀**

Jika ada masalah, cek:
1. Vercel Logs
2. Supabase Logs  
3. Telegram getWebhookInfo
4. Browser Console (untuk portal errors)
