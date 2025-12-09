# Home72 - Aplikasi Manajemen Kosan

Aplikasi manajemen kosan profesional berbasis web dengan fitur lengkap untuk mengelola kamar, penyewa, pembayaran, pengaduan, dan booking online.

![Home72](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)

## 🌟 Fitur Utama

- **Dashboard Interaktif**: Statistik real-time, tingkat okupansi, dan pendapatan bulanan
- **Manajemen Kamar**: CRUD kamar dengan foto, fasilitas, dan status
- **Manajemen Penyewa**: Data penyewa lengkap dengan kontrak dan KTP
- **Pembayaran**: Verifikasi pembayaran, upload bukti transfer, generate invoice
- **Pengaduan**: Sistem complaint dengan upload foto dan tracking status
- **Booking Online**: Halaman publik untuk booking kamar secara online
- **Email Otomatis**: Reminder pembayaran (H-7, H-3, H-1, H-day) dan notifikasi verifikasi
- **Multi-User**: Role-based access (Owner & Staff)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: TailwindCSS, ShadCN UI
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Email**: Resend
- **Charts**: Recharts
- **PDF**: jsPDF
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ dan npm
- Akun Supabase (gratis)
- Akun Resend (gratis)
- Akun Vercel (gratis)
- Domain (opsional, untuk Home72.otomasikan.com)

## 🚀 Quick Start

### 1. Clone Repository

```bash
cd /Users/macbookair/Desktop/Kosan\ Home72/home72
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

1. Buat project baru di [Supabase](https://supabase.com)
2. Copy URL dan Anon Key dari Settings > API
3. Jalankan SQL schema:
   - Buka SQL Editor di Supabase Dashboard
   - Copy-paste isi file `supabase-schema.sql`
   - Execute SQL

4. Buat Storage Buckets di Storage:
   - `room-photos` (public)
   - `payment-proofs` (private)
   - `tenant-documents` (private)
   - `report-photos` (public)

### 4. Setup Resend

1. Daftar di [Resend](https://resend.com)
2. Verify domain Anda (atau gunakan testing domain)
3. Generate API Key
4. Copy API Key

### 5. Configure Environment Variables

Copy `.env.local.example` ke `.env.local` dan isi:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend
RESEND_API_KEY=re_your_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron Secret (generate random string)
CRON_SECRET=your_random_secret_string
```

### 6. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### 7. Create Admin User

1. Buka Supabase Dashboard > Authentication
2. Create New User dengan email dan password
3. Atau jalankan SQL untuk insert admin:

```sql
INSERT INTO auth.users (email, encrypted_password)
VALUES ('admin@home72.com', crypt('password123', gen_salt('bf')));
```

## 📦 Deployment ke Vercel

### 1. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/home72.git
git push -u origin main
```

### 2. Deploy ke Vercel

1. Login ke [Vercel](https://vercel.com)
2. Import repository dari GitHub
3. Configure environment variables (sama seperti `.env.local`)
4. Deploy

### 3. Setup Domain (Opsional)

1. Di Vercel Dashboard, pilih project Home72
2. Settings > Domains
3. Add domain: `home72.otomasikan.com`
4. Copy DNS records
5. Di Cloudflare, tambahkan DNS records:
   - Type: CNAME
   - Name: home72
   - Target: cname.vercel-dns.com

### 4. Setup Cron Jobs

**Untuk Vercel Pro (Recommended)**:
- Cron sudah dikonfigurasi di `vercel.json`
- Akan jalan otomatis setelah deploy

**Untuk Free Tier (Alternative)**:
- Gunakan service seperti [cron-job.org](https://cron-job.org)
- Setup cron untuk hit endpoint: `https://home72.otomasikan.com/api/cron/payment-reminders`
- Schedule: `0 9 * * *` (setiap hari jam 09:00)
- Header: `Authorization: Bearer YOUR_CRON_SECRET`

## 📚 Struktur Folder

```
home72/
├── app/
│   ├── api/              # API Routes
│   │   ├── booking/
│   │   ├── payments/
│   │   ├── reports/
│   │   ├── rooms/
│   │   ├── tenants/
│   │   └── cron/
│   ├── auth/             # Authentication pages
│   ├── booking/          # Public booking page
│   ├── dashboard/        # Admin dashboard
│   ├── payments/         # Payment management
│   ├── reports/          # Complaints
│   ├── rooms/            # Room management
│   ├── tenants/          # Tenant management
│   └── layout.tsx
├── components/
│   ├── layout/           # Navbar, Footer
│   └── ui/               # ShadCN components
├── lib/
│   └── supabase/         # Supabase client
├── utils/
│   ├── email/            # Email templates & service
│   └── pdf/              # PDF generators (future)
├── supabase-schema.sql   # Database schema
└── .env.local            # Environment variables
```

## 🔑 Default Login

Setelah membuat user di Supabase:

```
Email: admin@home72.com
Password: (yang Anda set)
```

## 📊 Database Schema

### Tables

- `users` - Admin users dengan role (owner/staff)
- `rooms` - Kamar dengan harga, fasilitas, status
- `tenants` - Penyewa dengan data lengkap
- `payments` - Tracking pembayaran dan verifikasi
- `reports` - Pengaduan/complaint dari penyewa
- `booking` - Booking request dari publik

### Storage Buckets

- `room-photos` - Foto kamar
- `payment-proofs` - Bukti transfer
- `tenant-documents` - KTP & kontrak
- `report-photos` - Foto pengaduan

## 🔐 Security

- Row Level Security (RLS) aktif di semua tabel
- Protected routes dengan middleware
- API endpoints dengan authentication
- Cron jobs dengan secret authorization

## 📧 Email Automation

Email otomatis terkirim pada:

- **H-7**: "Pengingat Pembayaran Home72 - 7 hari lagi"
- **H-3**: "Pengingat Pembayaran Home72 - 3 hari lagi"
- **H-1**: "Pengingat Pembayaran Home72 - 1 hari lagi"
- **H-day**: "Hari Ini Jatuh Tempo Pembayaran Kamar"
- **Verifikasi**: "Pembayaran Diverifikasi - Terima Kasih"

## 🎨 Responsive Design

- Optimized untuk Full HD Mobile (1080x1920)
- Responsive untuk tablet dan desktop
- Mobile-first approach
- Touch-friendly UI

## 🐛 Troubleshooting

### Error: Supabase connection failed
- Cek environment variables
- Pastikan Supabase URL dan keys benar
- Cek RLS policies di Supabase

### Error: Email tidak terkirim
- Verify domain di Resend
- Cek RESEND_API_KEY
- Lihat logs di Resend Dashboard

### Cron job tidak jalan
- Pastikan Vercel Pro atau gunakan external cron
- Cek CRON_SECRET environment variable
- Test manual: `GET /api/cron/payment-reminders` dengan header Auth

## 🔄 Update & Maintenance

```bash
# Update dependencies
npm update

# Check for security issues
npm audit

# Build for production
npm run build

# Run production build locally
npm start
```

## 📝 License

MIT License - feel free to use for your own projects

## 👥 Support

Untuk bantuan dan dukungan:
- Email: info@otomasikan.com
- Website: https://otomasikan.com

---

**Home72** - Manajemen Kosan Modern & Profesional 🏠
