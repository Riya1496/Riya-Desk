# Lead Leak Scan - Quick Start

Everything is ready to deploy. Choose your path:

## Path A: Test Locally First (5 min)

```bash
# 1. Install Node.js 18+ (https://nodejs.org)

# 2. Clone repo and navigate to folder
cd lead-leak-scan

# 3. Start dev server
npm run dev

# 4. Open in browser
open http://localhost:3000

# 5. Test the form
# - Fill in business details
# - Submit
# - See results page
```

## Path B: Deploy to Vercel (10 min)

### Prerequisites
- GitHub repo with `lead-leak-scan/` folder pushed
- Vercel account (sign up free at vercel.com)

### 1. Deploy on Vercel

Go to **vercel.com**:
1. Click "Add New" → "Project"
2. Select your GitHub repo (riya-desk)
3. Set **Root Directory**: `lead-leak-scan`
4. Click "Deploy"

Your app is now live at: `yourusername.vercel.app`

### 2. Add Custom Domain

1. In Vercel dashboard: **Settings → Domains**
2. Add: `scan.riyadesk.com`
3. Update DNS at your registrar (follow Vercel's instructions)

### 3. Set Up Airtable (Optional - for Lead Capture)

1. Go to **airtable.com** → create new base "Lead Scans"
2. Create table "Leads" with these columns:
   - Business Name (text)
   - Website (URL)
   - City (text)
   - Email (email)
   - Lead Score (number)
   - Band (single select: Critical, Opportunity, Good)
   - Status (single select: New, Contacted, Booked, Won)
   - Created At (date)

3. Get your credentials:
   - **Token**: airtable.com/account/tokens
   - **Base ID**: From your base URL (app**XXXXX**)

4. Add to Vercel:
   - **Settings → Environment Variables**
   - Add: `AIRTABLE_TOKEN=pat_...`
   - Add: `AIRTABLE_BASE_ID=app...`

5. Re-deploy: Click latest deployment → "Redeploy"

### 4. Test

Visit `https://scan.riyadesk.com`:
- Fill form
- Submit
- Check Airtable for new lead record

## What You Have

✅ **Landing page** — scan form  
✅ **4 MVP checks** — pixels, AI, friction, reputation  
✅ **Results page** — 3 score bands with findings  
✅ **API backend** — runs checks, saves leads  
✅ **Airtable integration** — captures leads  
✅ **Ready to deploy** — Vercel, custom domain  

## Next: Marketing

Once live, market it:

- **LinkedIn**: "Free Lead Leak Scan for SMEs. Find your marketing gaps in 2 minutes."
- **Business groups**: "Free audit - see where you're losing customers"
- **Your website**: Link from homepage
- **Emails**: "Your [City] competitors are winning leads. See your gaps for free."

## Costs

**Monthly:**
- Vercel: $0 (free tier)
- Airtable: $0 (free tier)
- Domain: $0 (subdomain)
- **Total: $0**

**Per lead:**
- Cost: $0
- Expected revenue: $30-50 (20% conversion at $150-250)

## Support

- See **DEPLOYMENT.md** for detailed guide
- See **README.md** for architecture
- See **CLAUDE.md** for development

Questions? Email hello@riyadesk.com
