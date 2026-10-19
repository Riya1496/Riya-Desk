# Lead Leak Scan - Deployment Guide

Deploy to **Vercel** in 5 minutes.

## Step 1: Prepare the Code

1. Create a new directory in your GitHub repo (if not already there):
   ```bash
   mkdir lead-leak-scan
   cd lead-leak-scan
   ```

2. Copy all files from this folder into `lead-leak-scan/`

3. Push to GitHub:
   ```bash
   git add lead-leak-scan/
   git commit -m "Add Lead Leak Scan app"
   git push origin main
   ```

## Step 2: Set Up Vercel

1. Go to **vercel.com**
2. Sign in with GitHub (or create account)
3. Click **Add New → Project**
4. Select your GitHub repo (riya-desk)
5. Configure project:
   - **Framework**: Next.js (select, even though we're not using it - Vercel will just serve static + functions)
   - **Root Directory**: `lead-leak-scan`
   - **Build Command**: Leave empty (we don't need a build step)
   - **Output Directory**: `public`
   - **Environment Variables**: (add in next step)
6. Click **Deploy**

## Step 3: Add Environment Variables

After deployment starts, go to **Settings → Environment Variables** and add:

```
AIRTABLE_TOKEN=pat_xxxxxxxxxxxxx
AIRTABLE_BASE_ID=appXXXXXXXX
```

(See "Getting Airtable Credentials" below)

Re-deploy: Click **Deployments** → click latest deploy → **Redeploy**

## Step 4: Add Custom Domain

1. In Vercel project: **Settings → Domains**
2. Add domain: `scan.riyadesk.com`
3. Choose DNS provider:
   - If using registrar's DNS, add CNAME record:
     - **Name**: `scan`
     - **Value**: `cname.vercel.app`
   - If using Vercel DNS, Vercel will update DNS automatically

Takes ~5 min to activate.

## Step 5: Set Up Airtable (Optional but Recommended)

### Get Airtable Credentials

1. Go to **airtable.com** → sign in
2. Create new base:
   - Name: "Lead Scans"
   - Template: Start fresh
3. Create table "Leads" with columns:
   - `Business Name` (text)
   - `Website` (URL)
   - `City` (text)
   - `Email` (email)
   - `Lead Score` (number, 0-100)
   - `Band` (single select: "Critical", "Opportunity", "Good")
   - `Status` (single select: "New", "Contacted", "Booked", "Won")
   - `Created At` (date)

4. Get API token:
   - Go to **account/tokens** → **Create token**
   - Give it permissions: `data.records:read`, `data.records:write`
   - Copy the token
5. Get base ID:
   - Open your base, look at URL: `airtable.com/appXXXXXXXX/`
   - Copy the `appXXXXXXXX` part

6. Add to Vercel:
   - **Settings → Environment Variables**
   - `AIRTABLE_TOKEN=pat_xxx`
   - `AIRTABLE_BASE_ID=appXXX`

## Step 6: Test

1. Open `https://scan.riyadesk.com`
2. Fill form and submit
3. Check Airtable base → should see new record in "Leads" table

## Troubleshooting

### "Build failed"
- Check build logs in Vercel dashboard
- Make sure `lead-leak-scan/` folder has all files
- Try re-deploying

### "API not working"
- Check Vercel function logs: **Deployments → Functions**
- Make sure `api/scan.mjs` exists
- Check environment variables are set

### "Airtable not saving leads"
- Check Vercel logs for Airtable errors
- Verify API token is correct (not expired)
- Verify base ID is correct format

## Environment Variables Reference

| Variable | Where to get | Example |
|---|---|---|
| `AIRTABLE_TOKEN` | airtable.com/account/tokens | `pat_abc123def456` |
| `AIRTABLE_BASE_ID` | Your base URL | `appXYZ123ABC` |
| `PORT` | Optional, defaults to 3000 | `3000` |

## Development

To test locally before deploying:

```bash
# Copy .env.example to .env and add your credentials
cp .env.example .env
# Edit .env with your Airtable credentials

# Start dev server
npm run dev

# Visit http://localhost:3000
```

## Next Steps After Launch

1. **Monitor leads**: Check Airtable daily for new signups
2. **Update status**: Mark leads as "Contacted", "Booked", "Won"
3. **Iterate findings**: If certain findings don't drive conversions, improve them
4. **Expand**: Add checks or duplicate for other markets

## Monitoring

### Check if live:
```bash
curl https://scan.riyadesk.com/api/health
# Should return: {"status":"ok"}
```

### Test a scan:
```bash
curl -X POST https://scan.riyadesk.com/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Co.",
    "website": "https://example.com",
    "city": "Sydney",
    "email": "test@example.com"
  }'
```

## Support

- Vercel docs: vercel.com/docs
- Airtable API: airtable.com/api
- Ask in project Slack or email hello@riyadesk.com
