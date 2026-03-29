# Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up / log in
3. Click "New Project"
4. Choose:
   - **Organization:** Your personal org
   - **Project name:** `random-academic-app` (or your choice)
   - **Database password:** Save this securely
   - **Region:** Choose closest to you
5. Click "Create new project" (takes ~2 minutes)

---

## Step 2: Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy the entire contents of `packages/database/schema.sql`
4. Paste into the SQL editor
5. Click "Run" (or Cmd/Ctrl + Enter)
6. Verify all tables created successfully (check the **Table Editor** in left sidebar)

---

## Step 3: Create Storage Bucket

1. Go to **Storage** in the left sidebar
2. Click "New bucket"
3. Configure:
   - **Name:** `documents`
   - **Public:** ❌ Uncheck (private bucket)
   - **File size limit:** `104857600` (100MB - adjust as needed)
   - **Allowed MIME types:** Leave blank (all types)
4. Click "Create bucket"

### Add Storage RLS Policies

1. Still in **Storage**, click on the `documents` bucket
2. Go to **Policies** tab
3. Click "New policy" → "Create a policy from scratch"
4. Add these three policies:

**Policy 1 - Upload:**
```sql
Name: Users can upload own documents
Action: INSERT
Target: storage.objects
Policy: 
```
```sql
(bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text)
```

**Policy 2 - View:**
```sql
Name: Users can view own documents
Action: SELECT
Target: storage.objects
Policy: 
```
```sql
(bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text)
```

**Policy 3 - Delete:**
```sql
Name: Users can delete own documents
Action: DELETE
Target: storage.objects
Policy: 
```
```sql
(bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text)
```

---

## Step 4: Get API Credentials

1. Go to **Settings** (gear icon in left sidebar)
2. Click **API**
3. Copy these values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

---

## Step 5: Configure Environment Variables

1. In `apps/web/`, create a `.env` file:
   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

2. Edit `apps/web/.env` and paste your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## Step 6: Enable Email Auth (Optional but Recommended)

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure:
   - **Confirm email:** Enable (recommended for production)
   - **Secure email change:** Enable
4. For local development, you can disable email confirmation temporarily

---

## Step 7: Test the Connection

1. Make sure the dev server is running:
   ```bash
   npm run dev
   ```

2. The app should connect to Supabase without errors
3. Check browser console for any connection warnings

---

## Troubleshooting

### "Missing Supabase credentials" warning
- Make sure `.env` file exists in `apps/web/`
- Verify variable names are exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart the dev server after changing `.env`

### RLS policy errors
- Double-check that all RLS policies are correctly applied
- Test in Supabase SQL Editor: `SELECT auth.uid();` should return your user ID after login

### Storage upload fails
- Verify the `documents` bucket exists and is private
- Check that all three storage policies are in place
- Ensure the user is authenticated before uploading

---

## Next Steps

After setup is complete:
1. Implement authentication UI (login/signup forms)
2. Create document upload functionality
3. Build the library view with real data
4. Set up offline sync layer
