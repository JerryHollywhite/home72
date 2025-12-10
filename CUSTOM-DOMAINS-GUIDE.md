# Setup Custom Domains - Multiple Subdomains

## 🎯 Goal:
- **jerry.adminkos.otomasikan.com** → Admin Login
- **userkos.otomasikan.com** → Tenant Portal  
- **bookingkos.otomasikan.com** → Public Booking

---

## Part 1: Vercel Domain Setup

### Step 1: Add Domains to Vercel

1. **Buka Vercel:** https://vercel.com
2. **Project home72** → **Settings** → **Domains**
3. **Add Domain** (lakuk 3 kali untuk 3 subdomain):

**Domain 1:**
```
jerry.adminkos.otomasikan.com
```

**Domain 2:**
```
userkos.otomasikan.com
```

**Domain 3:**
```
bookingkos.otomasikan.com
```

4. Vercel akan kasih instruksi DNS untuk setiap domain
5. **Screenshot** DNS instructions nya

---

## Part 2: Cloudflare DNS Setup

### Step 1: Login Cloudflare

1. https://dash.cloudflare.com
2. Pilih domain: **otomasikan.com**
3. Klik **DNS** → **Records**

### Step 2: Add CNAME Records

**Tambahkan 3 CNAME records:**

**Record 1 - Admin:**
```
Type: CNAME
Name: jerry.adminkos
Target: cname.vercel-dns.com
Proxy: ON (Orange cloud)
TTL: Auto
```

**Record 2 - Tenant:**
```
Type: CNAME  
Name: userkos
Target: cname.vercel-dns.com
Proxy: ON (Orange cloud)
TTL: Auto
```

**Record 3 - Booking:**
```
Type: CNAME
Name: bookingkos  
Target: cname.vercel-dns.com
Proxy: ON (Orange cloud)
TTL: Auto
```

### Step 3: Save & Wait

- Klik **Save** untuk setiap record
- Tunggu 5-10 menit untuk DNS propagation
- Vercel akan automatically verify domains

---

## Part 3: Update Environment Variables

Setelah domains active, update env vars:

1. **Vercel** → **Settings** → **Environment Variables**
2. **Edit** variables berikut:

**Update 1:**
```
NEXT_PUBLIC_APP_URL
jerry.adminkos.otomasikan.com
```
(Atau pakai main domain jika ada)

**Update 2:**
```
TELEGRAM_WEBHOOK_URL
https://jerry.adminkos.otomasikan.com/api/telegram/webhook
```
(Atau tetap pakai vercel.app URL)

3. **Redeploy:** Settings → Deployments → Latest → Redeploy

---

## Part 4: Test Domains

**Test setelah DNS propagation (5-10 menit):**

### Test 1: Admin Domain
```
https://jerry.adminkos.otomasikan.com
```
→ Should redirect to `/auth/login`

### Test 2: Tenant Domain
```
https://userkos.otomasikan.com
```
→ Should redirect to `/tenant/login`

### Test 3: Booking Domain
```
https://bookingkos.otomasikan.com
```
→ Should redirect to `/booking`

---

## Part 5: Update Telegram Webhook

Setelah domains active, update webhook:

```bash
curl -X POST "https://api.telegram.org/bot8227312044:AAFlTSDqFsjHeQjmSOZ_sZDIrrQ7YQ0F70w/setWebhook" \
  -d "url=https://jerry.adminkos.otomasikan.com/api/telegram/webhook"
```

---

## Troubleshooting

### DNS Not Resolving
- Wait 10-30 minutes
- Check Cloudflare DNS records are correct
- Ensure Proxy is ON (orange cloud)

### Vercel Domain Not Verified
- Check CNAME target is correct: `cname.vercel-dns.com`
- Wait for DNS propagation
- Click "Refresh" in Vercel

### Redirect Not Working
- Clear browser cache
- Check middleware.ts was deployed
- Verify subdomain names match exactly

---

## Next Steps After Domains Active:

1. ✅ Setup Supabase database (`supabase-schema.sql`)
2. ✅ Create admin user in Supabase Auth
3. ✅ Test all 3 domains
4. ✅ Update Telegram webhook

**Siap mulai? Beritahu saya progress Anda!** 🚀
