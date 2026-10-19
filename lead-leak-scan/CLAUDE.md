# Lead Leak Scan - Claude Code Instructions

This is a separate full-stack web app hosted at `scan.riyadesk.com`. It's a free SME lead audit tool that generates qualified leads for Riya Desk to quote on marketing fixes.

## Project Context

- **Purpose:** Free lead magnet. Users get a 2-minute audit, see their gaps, then contact us for paid fixes.
- **Audience:** SME businesses (Australian market, expanding to EU/LATAM)
- **Revenue model:** Free scan → identify gaps → manual quote per client → implement fix ($150-300 per client)
- **Team:** 2 people. Income target: 5 Lakh INR (~$600 USD) per month
- **Hosting:** Vercel free tier (auto-deploy from GitHub)
- **Database:** Airtable free tier (acts as CRM + manual lead tracking)

## Key Files

### Frontend
- `public/index.html` — Landing page + scan form
- `public/results.html` — Results page (shows 3 score bands with specific findings)
- `public/styles.css` — All styling (clean, professional, mobile-responsive)
- `public/script.js` — Form handling + results page logic

### Backend
- `api/scan.mjs` — POST /api/scan endpoint (runs all checks)
- `lib/mvp-checks.mjs` — Core logic for 4 checks (pixels, AI, friction, reputation)

### Data
- `data/sample-findings.json` — Template findings for each band

## The 4 Checks (MVP)

**All checks must be fast (<1 sec each, <2 sec total response)**

1. **Ad Pixel Audit** (0-25 pts)
   - Parse HTML for: GA4, Meta Pixel, Google Ads, TikTok, LinkedIn, Hotjar, Mouseflow
   - Panic: "You're spending money blind. Your competitor has these pixels."

2. **AI Visibility** (0-25 pts)
   - User enters: "How many times do I appear in ChatGPT?" + competitor names/counts
   - Panic: "Your competitor shows up when people ask ChatGPT. You don't."

3. **Lead Friction** (0-25 pts)
   - Count form fields, check for phone link, scheduling, CTA
   - Panic: "8 fields = 60% lead loss. Competitors use 3 and convert 2x more."

4. **Reputation Gap** (0-25 pts)
   - User enters: their rating + reviews + top 2 competitor ratings/reviews
   - Panic: "You're 4.2★ with 12 reviews. Competitor is 4.8★ with 186."

## Score Bands & Messaging

**0-40 (Critical):**
- Show 3 specific findings from their website
- Each finding: title + why it matters (2 bullets) + panic hook
- CTA: "These gaps are fixable in 2-4 weeks. Let's discuss your situation."

**40-70 (Opportunity):**
- Show 3 strategic opportunities
- Same structure: finding + why it matters + competitive context
- CTA: "You're competitive. Let's discuss which fix pushes you ahead."

**70+ (Good):**
- Show 3 strengths + how to scale
- Framed as "defensive" (keep leading) + "offensive" (expand)
- CTA: "You're winning. Let's talk about doubling down."

**Key:** NO generic dollar amounts. All findings are specific to THEIR website/data.

## Development Workflow

### To add a new check:
1. Add logic to `lib/mvp-checks.mjs`
2. Import in `api/scan.mjs`
3. Add to `runAllChecks()` function
4. Add sample findings to `data/sample-findings.json`
5. Update `results.html` to display new findings

### To test locally:
```bash
cd lead-leak-scan
npm run dev
# Visit http://localhost:3000/public/index.html
```

### To test the API:
```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Co.",
    "website": "https://example.com",
    "city": "Sydney",
    "email": "test@test.com"
  }'
```

## Deployment

### Step 1: Deploy to Vercel
```bash
# Vercel auto-deploys from GitHub
# Just push to main branch
git add .
git commit -m "Add lead leak scan"
git push origin main
```

### Step 2: Add custom domain
- In Vercel dashboard: Settings → Domains → Add `scan.riyadesk.com`
- In DNS: CNAME `scan.riyadesk.com` → `cname.vercel.app`
- Takes ~5 min to activate

### Step 3: Connect Airtable (for lead storage)
- Create Airtable base "Lead Scans"
- Fields: Business Name, Website, City, Email, Lead Score, Status
- (Optional: wire up API to auto-insert leads)

## Important Notes

1. **No external APIs in MVP** — all free or user-provided
   - HTML parsing (free)
   - User manual input (free)
   - No paid Google Places lookups yet

2. **Stateless design** — no permanent database needed yet
   - Results stored in user's browser (sessionStorage)
   - Can email results or manually save to Airtable

3. **Rate limiting** — add before going live
   - 5 scans per IP per 24 hours
   - 10 scans per email per 24 hours
   - Use Redis (Railway free tier) for storage

4. **Panic hooks are the conversion engine**
   - Every finding must include competitive context or market truth
   - No vague benchmarks ("industry average is...")
   - Specific to THEIR site: "We found X on your site. Your competitor has Y."

## What NOT to do

- ❌ Add complex features (schema validators, screenshot tests, etc.)
- ❌ Call expensive APIs (Playwright, Lighthouse, Google Places paid)
- ❌ Store data in complex databases yet (Airtable is enough for MVP)
- ❌ Build a subscription/payment system (manual quotes for now)
- ❌ Add user accounts/logins (one scan per submission is fine)

## When to iterate

- After 10-20 real scans, collect feedback from prospects
- What findings actually made them want to talk? (Prioritize those checks in V2)
- What findings were misleading or incorrect? (Fix or remove)
- What questions did people ask? (Build answers into findings)

## Questions?

- Check README.md for architecture & API docs
- Check public/*.html for UI structure
- Check lib/mvp-checks.mjs for check logic
