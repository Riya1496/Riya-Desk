# Launch Checklist - Get Scan.RiyaDesk.com Live

Follow these steps in order. Should take **15-20 minutes total**.

## Phase 1: Prepare Code (Already Done ✓)

- [x] Code written
- [x] Pushed to GitHub (commit 636f0ee)
- [x] All files in `/lead-leak-scan` folder

## Phase 2: Deploy to Vercel (10 min)

### Step 1: Create Vercel Account (if needed)
- [ ] Go to **vercel.com**
- [ ] Click "Sign up"
- [ ] Select "GitHub" and authorize
- [ ] Done

### Step 2: Deploy Project
- [ ] Go to **vercel.com/dashboard**
- [ ] Click "Add New" → "Project"
- [ ] Select your **riya-desk** GitHub repo
- [ ] Configure:
  - Root Directory: `lead-leak-scan`
  - Framework: **None** (or Next.js, we'll override)
  - Build Command: Leave blank
  - Output Directory: `public`
- [ ] Click "Deploy"
- [ ] Wait ~2-3 min for deployment to finish
- [ ] You'll see: "Congratulations! Your project has been deployed"
- [ ] Note your deployment URL (e.g., `riya-desk.vercel.app`)

**✓ Your app is now live at** `your-username.vercel.app/lead-leak-scan/`

## Phase 3: Set Up Airtable (Optional but Recommended - 5 min)

### Step 3A: Create Airtable Base
- [ ] Go to **airtable.com**
- [ ] Sign up or log in
- [ ] Click "Create a workspace" or "Add base"
- [ ] Create base called: `Lead Scans`
- [ ] Create table called: `Leads`
- [ ] Add these columns:
  - `Business Name` (text)
  - `Website` (URL)
  - `City` (text)
  - `Email` (email)
  - `Lead Score` (number, 0-100)
  - `Band` (single select: Critical, Opportunity, Good)
  - `Status` (single select: New, Contacted, Booked, Won)
  - `Created At` (date)

### Step 3B: Get Airtable Credentials
- [ ] Go to **airtable.com/account/tokens**
- [ ] Click "Create token"
- [ ] Name it: "Lead Leak Scan"
- [ ] Permissions: `data.records:read`, `data.records:write`
- [ ] Generate token
- [ ] **Copy and save the token** (you won't see it again!)
  ```
  AIRTABLE_TOKEN=pat_xxxxxxxxxxxxx
  ```

- [ ] Go back to your Airtable base
- [ ] Look at URL: `airtable.com/appXXXXXXXX/tbl...`
- [ ] Copy the app ID (appXXXXXXXX)
  ```
  AIRTABLE_BASE_ID=appXXXXXXXX
  ```

### Step 3C: Add Credentials to Vercel
- [ ] Go back to **Vercel dashboard**
- [ ] Click your **riya-desk** project
- [ ] Go to **Settings** → **Environment Variables**
- [ ] Add new variable:
  - **Name:** `AIRTABLE_TOKEN`
  - **Value:** `pat_xxxxxxxxxxxxx` (paste your token)
  - Click "Add"
- [ ] Add another variable:
  - **Name:** `AIRTABLE_BASE_ID`
  - **Value:** `appXXXXXXXX` (paste your base ID)
  - Click "Add"

### Step 3D: Re-Deploy
- [ ] Go to **Deployments**
- [ ] Find latest deployment
- [ ] Click the "..." menu → "Redeploy"
- [ ] Wait for it to finish (1-2 min)
- [ ] Check: **Deployments** → should show status "Ready"

## Phase 4: Add Custom Domain (5 min)

### Step 4A: Add Domain in Vercel
- [ ] In Vercel project: **Settings** → **Domains**
- [ ] Type: `scan.riyadesk.com`
- [ ] Click "Add"

### Step 4B: Update DNS (varies by registrar)

**If using your registrar's DNS:**
- [ ] Go to your domain registrar (GoDaddy, Namecheap, etc.)
- [ ] Find DNS settings
- [ ] Add new CNAME record:
  - **Name/Host:** `scan`
  - **Value/Points to:** `cname.vercel.app`
  - Click Save
- [ ] Wait ~5-30 min for DNS to propagate

**If using Vercel nameservers:**
- [ ] Follow Vercel's on-screen instructions
- [ ] Point your domain to Vercel nameservers
- [ ] Wait ~5-30 min for propagation

### Step 4C: Verify Domain
- [ ] In Vercel, after ~5-30 min, the domain should show "Valid"
- [ ] **Test:** Open https://scan.riyadesk.com in your browser
- [ ] Should see your Landing page ✓

## Phase 5: Test Everything (5 min)

### Step 5A: Test Landing Page
- [ ] Visit **https://scan.riyadesk.com**
- [ ] Page loads
- [ ] Form inputs work
- [ ] Styling looks good
- [ ] ✓ Success

### Step 5B: Test Form Submission
- [ ] Fill form with test data:
  - Business: "Test Insurance Co"
  - Website: `https://example.com`
  - City: "Sydney"
  - Email: `your@email.com`
- [ ] Click "Get Your Free Scan"
- [ ] Wait ~2-3 seconds
- [ ] See results page appear
- [ ] ✓ Success

### Step 5C: Test Airtable (if you set it up)
- [ ] Go to your Airtable base → "Leads" table
- [ ] You should see a new row with your test data
- [ ] Check all columns filled: name, website, city, email, score, band
- [ ] ✓ Success

### Step 5D: Test Results Page
- [ ] On results page, change score bands (Critical/Opportunity/Good)
- [ ] Each shows different findings
- [ ] Panic hooks are visible
- [ ] CTAs work
- [ ] ✓ Success

## Phase 6: Go Live (1 min)

You're done! Your app is live at **https://scan.riyadesk.com**

### What to do now:

1. **Share it:**
   - LinkedIn: "Free 2-minute Lead Leak Scan for SMEs. See where you're losing customers."
   - Email list: "Get your free audit"
   - Business groups: Post the link

2. **Monitor leads:**
   - Check Airtable daily
   - Call/email every lead within 24 hours
   - Update status: "Contacted" → "Booked" → "Won"

3. **Iterate:**
   - After 10 scans: Review feedback
   - What findings drive conversations?
   - What needs improvement?

4. **Track metrics:**
   - Scans per week
   - Conversion rate (scans → calls)
   - Deal size (average quote)

## Troubleshooting

### "Deployment failed"
- Check build logs in Vercel
- Make sure folder structure is correct
- Try re-deploying

### "Domain not working"
- DNS changes take 5-30 min, be patient
- Check Vercel domain settings
- Verify DNS record at your registrar

### "Form not submitting"
- Check browser console for errors (F12)
- Check Vercel function logs
- Make sure API path is correct (`/api/scan`)

### "Airtable not saving"
- Verify token is correct (long string, starts with `pat_`)
- Verify base ID is correct (starts with `app`)
- Check Vercel function logs
- Make sure Airtable base/table names are exact

### "Results page blank"
- Check browser console for errors
- Make sure sessionStorage is working
- Clear browser cache and try again

## Support Contacts

- **Vercel docs:** vercel.com/docs
- **Airtable docs:** airtable.com/api
- **GitHub issue:** Create issue in riya-desk repo
- **Email:** hello@riyadesk.com

---

## After Launch

### Week 1
- Monitor leads
- Respond to every inquiry
- Gather feedback
- Iterate on messaging

### Week 2-4
- Optimize based on feedback
- Plan v2 features
- Consider expansion to other markets

### Month 2+
- Scale: add more checks, features
- Integrate with CRM/email tools
- Plan paid tier

---

**You've got this! 🚀 Go live and start getting leads.**

Save this checklist for reference.
