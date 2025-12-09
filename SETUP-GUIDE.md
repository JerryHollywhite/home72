# Home72 - Quick Setup Guide

## ✅ Step 1: Environment Variables (COMPLETED)
Your Supabase URL and Anon Key have been configured in `.env.local`.

## 🔑 Step 2: Get Service Role Key

1. Open your Supabase project: https://supabase.com/dashboard/project/crxpyjtsqjqvjdduuslb
2. Go to **Settings** → **API**
3. Find the **service_role** key (it's marked as secret)
4. Copy it and update line 3 in `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
   ```

## 📊 Step 3: Run Database Schema

1. In your Supabase Dashboard, go to **SQL Editor**
2. Click **+ New Query**
3. Copy the ENTIRE contents of `supabase-schema.sql` (this file)
4. Paste into the SQL Editor
5. Click **Run** (or press Ctrl/Cmd + Enter)
6. You should see: "Success. No rows returned"

This will create:
- ✅ All 6 tables (users, rooms, tenants, payments, reports, booking)
- ✅ Row Level Security policies
- ✅ Indexes for performance
- ✅ Triggers for timestamps
- ✅ Sample data (1 admin user + 4 rooms)

## 🗂️ Step 4: Create Storage Buckets

1. In Supabase Dashboard, go to **Storage**
2. Create these 4 buckets:

   **Bucket 1: room-photos**
   - Name: `room-photos`
   - Public: ✅ Yes
   - File size limit: 5MB
   - Allowed MIME types: image/*

   **Bucket 2: payment-proofs**
   - Name: `payment-proofs`
   - Public: ❌ No (private)
   - File size limit: 5MB
   - Allowed MIME types: image/*

   **Bucket 3: tenant-documents**
   - Name: `tenant-documents`
   - Public: ❌ No (private)
   - File size limit: 5MB
   - Allowed MIME types: image/*, application/pdf

   **Bucket 4: report-photos**
   - Name: `report-photos`
   - Public: ✅ Yes
   - File size limit: 5MB
   - Allowed MIME types: image/*

## 👤 Step 5: Create Your Admin Account

After running the schema, you'll have a sample admin user:
- Email: `admin@home72.com`
- Password: `password123`

**IMPORTANT**: Change this password immediately!

Or create your own admin via Supabase Auth:
1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Enter your email and password
4. Click **Send Magic Link** or **Create User**

## 🧪 Step 6: Test the Application

```bash
cd /Users/macbookair/Desktop/Kosan\ Home72/home72
npm run dev
```

Then visit: http://localhost:3000

Login with:
- Email: `admin@home72.com`
- Password: `password123`

You should see:
- ✅ Dashboard with 4 sample rooms
- ✅ 1 active tenant (Budi Santoso in room 103)
- ✅ Occupancy rate: 25%

## 📧 Step 7: Email Setup (Optional but Recommended)

For payment reminders to work:

1. Sign up at https://resend.com
2. Verify your domain (or use their test domain)
3. Get API key from Dashboard
4. Update `.env.local`:
   ```
   RESEND_API_KEY=re_your_actual_api_key
   ```

## 🚀 Step 8: Build & Deploy

Test the build:
```bash
npm run build
```

If successful, deploy to Vercel:
```bash
# Initialize git if not done
git init
git add .
git commit -m "Initial Home72 setup"

# Push to GitHub
git remote add origin https://github.com/yourusername/home72.git
git push -u origin main

# Then deploy via Vercel dashboard
```

## ✅ Checklist

- [ ] Service Role Key added to `.env.local`
- [ ] Database schema executed in Supabase SQL Editor
- [ ] 4 Storage buckets created
- [ ] Admin user created/password changed
- [ ] Dev server runs successfully (`npm run dev`)
- [ ] Can login at http://localhost:3000
- [ ] Dashboard displays sample data
- [ ] (Optional) Resend API key configured
- [ ] Build succeeds (`npm run build`)

## 🆘 Troubleshooting

**Error: "Invalid Supabase URL"**
- Make sure `.env.local` is saved
- Restart dev server

**Error: "Row Level Security"**
- Make sure you ran the ENTIRE `supabase-schema.sql`
- RLS policies are at the bottom of the file

**Can't login**
- Check Authentication → Users in Supabase Dashboard
- Password might be case-sensitive
- Try creating a new user

**No data in dashboard**
- Sample data is at the bottom of `supabase-schema.sql`
- Make sure SQL executed completely

---

Need help? Check the main README.md for detailed documentation.
