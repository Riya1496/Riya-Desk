# Supabase Setup for Lead Leak Scan

This guide walks you through setting up Supabase to store all scan results.

## Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" → Sign up with GitHub or email
3. Create a new organization (e.g., "Riya Desk")

## Step 2: Create a Project

1. Click "New Project"
2. Name: `lead-leak-scan`
3. Password: Generate a strong password (you'll need this for the SQL setup)
4. Region: Pick closest to your target customers (e.g., Singapore for APAC)
5. Click "Create new project" — wait ~2 minutes for setup

## Step 3: Create the `scans` Table

Once your project is ready:

1. Go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Paste this SQL:

```sql
CREATE TABLE scans (
  id BIGSERIAL PRIMARY KEY,
  business_name TEXT NOT NULL,
  website TEXT NOT NULL,
  city TEXT,
  email TEXT NOT NULL,
  business_type TEXT DEFAULT 'other',
  overall_score INT,
  pixel_audit_score INT,
  ai_visibility_score INT,
  lead_friction_score INT,
  reputation_gap_score INT,
  findings JSONB DEFAULT '[]'::jsonb,
  business_intelligence_findings JSONB DEFAULT '[]'::jsonb,
  tech_stack JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_scans_email ON scans(email);
CREATE INDEX idx_scans_website ON scans(website);
CREATE INDEX idx_scans_created_at ON scans(created_at DESC);
```

4. Click **Run** (the play button)
5. You should see "Success" message

## Step 4: Get Your API Keys

1. Go to **Settings** (left sidebar)
2. Click **API**
3. Under "Your API keys" you'll see:
   - `Project URL` — copy this
   - `anon public` key — copy this
4. Keep these safe!

## Step 5: Add to Vercel Environment

1. Open your terminal and run:

```bash
npx vercel env add SUPABASE_URL
# Paste your Project URL

npx vercel env add SUPABASE_ANON_KEY
# Paste your anon public key
```

2. Select `production` for both

## Step 6: Deploy

```bash
cd lead-leak-scan
git add .
git commit -m "Add Supabase integration for scan data persistence"
git push origin main
```

Vercel will auto-deploy. After ~1-2 minutes, check `https://scan.riyadesk.com`

## Step 7: Test It

1. Go to https://scan.riyadesk.com
2. Run a test scan
3. Go back to Supabase → **Table Editor**
4. Click **scans** table
5. You should see your scan result!

## Viewing Your Data

**In Supabase Dashboard:**
- Click **Table Editor** → **scans** to see all scans
- Click any row to see full details
- Export as CSV: Click table name → **Export** → **CSV**

**Via SQL:**
```sql
SELECT * FROM scans ORDER BY created_at DESC LIMIT 10;
```

## Troubleshooting

**"Scan failed" error after deploying:**
- Check Vercel logs: `vercel logs` or dashboard
- Make sure env vars are set: `vercel env list`
- Restart deployment: `vercel deploy --prod`

**No data appearing in Supabase:**
- Check Vercel logs for errors: `vercel logs`
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Make sure they're set to `production` environment

**"INSERT permission denied" error:**
- Go to Supabase → **Authentication** → **Policies**
- Make sure "Enable Row Level Security" is OFF for now (we can lock it down later)

## Next Steps

- Set up email notifications when new scans arrive
- Create a dashboard to track leads by score/city
- Add automated follow-up emails to leads
