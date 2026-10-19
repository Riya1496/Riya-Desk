# Lead Leak Scan - Free SME Marketing Audit

A free, 2-minute marketing audit for small/medium businesses. Identifies gaps in ad tracking, AI visibility, lead capture, and reputation that are costing them customers.

## Structure

```
lead-leak-scan/
├── public/
│   ├── index.html        # Landing page + scan form
│   ├── results.html      # Results page (3 score bands)
│   ├── styles.css        # All styling
│   └── script.js         # Frontend form handling
├── api/
│   └── scan.mjs          # POST /api/scan endpoint
├── lib/
│   └── mvp-checks.mjs    # Core scanning logic (4 checks)
├── data/
│   └── sample-findings.json  # Sample finding templates
├── package.json
└── README.md
```

## The 4 MVP Checks

### 1. **Ad Pixel Audit** (0-25 points)
Detects: GA4, Meta Pixel, Google Ads conversion, TikTok Pixel, LinkedIn, Hotjar, Mouseflow

Panic hook: "You're spending $500-2,000/month on ads blind. Your competitor has Meta Pixel + GA4."

### 2. **AI Visibility** (0-25 points)
Checks: Does the business appear in ChatGPT/Claude/Perplexity when asked "[service] in [city]"?

Panic hook: "Your competitor appears in ChatGPT. You don't. That's 6-15 lost leads per week."

### 3. **Lead Friction** (0-25 points)
Analyzes: Contact form field count, phone link, scheduling, CTA visibility

Panic hook: "Your 8-field form costs you 60% of inquiries. Competitors use 3 fields and convert 2x more."

### 4. **Reputation Velocity** (0-25 points)
Compares: Business rating + review count vs. top 2 competitors

Panic hook: "You're 4.2★ with 12 reviews. Competitor A is 4.8★ with 186 reviews. You're ranked 3rd."

## Score Bands

- **0-40 (Critical):** You're losing leads to fixable gaps. Fixes take 2-4 weeks.
- **40-70 (Opportunity):** You're competitive but leaving money on the table. 15-20% uplift possible.
- **70+ (Good):** You're ahead. Here's how to defend and expand.

## How It Works

### User Flow

1. **Landing page** (`index.html`) → form collects business name, website, city, email
2. **Form submission** → POST to `/api/scan` with business data
3. **Backend runs checks** → fetches website HTML, analyzes pixels/friction; uses manual input for AI/reputation
4. **Results page** (`results.html`) → displays findings specific to their website with panic hooks and CTA
5. **CTA** → "Schedule Free Consultation" or "Email My Results"

### Data Flow

```
User Input → /api/scan → mvp-checks.mjs (4 parallel checks) → Score + Findings → Results Page
```

## Running Locally

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
cd lead-leak-scan
npm install
```

### Development Server

```bash
npm run dev
```

Runs on `http://localhost:3000`

- Landing: http://localhost:3000/public/index.html
- Results: http://localhost:3000/public/results.html (shows demo data)

## API Endpoint

### POST /api/scan

**Request:**
```json
{
  "businessName": "Example Insurance Co.",
  "website": "https://example.com",
  "city": "Sydney",
  "email": "user@email.com",
  "aiData": {
    "appearanceCount": 3,
    "competitorCount": 11
  },
  "reputationData": {
    "userRating": 4.2,
    "userReviewCount": 12,
    "competitors": [
      { "name": "Competitor A", "rating": 4.8, "reviewCount": 186 },
      { "name": "Competitor B", "rating": 4.7, "reviewCount": 94 }
    ]
  }
}
```

**Response:**
```json
{
  "businessName": "Example Insurance Co.",
  "website": "https://example.com",
  "city": "Sydney",
  "email": "user@email.com",
  "overallScore": 38,
  "band": "critical",
  "scannedAt": "2026-10-20T10:30:00Z",
  "checks": [
    {
      "checkId": "pixel_audit",
      "checkName": "Ad Pixel Audit",
      "found": ["GA4"],
      "missing": ["Meta Pixel", "Google Ads", "TikTok Pixel", "LinkedIn", "Hotjar", "Mouseflow"],
      "score": 4,
      "severity": "critical"
    },
    ...
  ]
}
```

## MVP Features

✅ Landing page with scan form  
✅ 4 checks: pixels, AI visibility, lead friction, reputation  
✅ Score calculation (0-100)  
✅ Results page with 3 score bands  
✅ Specific findings (no generic benchmarks)  
✅ Panic hooks with competitive context  
✅ CTAs: Schedule consult / Email results  

## Future Enhancements (V2+)

- Async Lighthouse reports (email after 10 min)
- Schema markup validation
- Review sentiment analysis
- Multi-country language support
- Lead capture to Airtable
- Email notifications
- CRM integration (Pipedrive, HubSpot)

## Hosting

### For Vercel
1. Push to GitHub
2. Deploy at vercel.com (auto-scales, free tier)
3. Add custom domain `scan.riyadesk.com`

### For Railway
1. Push to GitHub
2. Connect to Railway
3. Add PostgreSQL + Redis (free tier)
4. Add custom domain

### For local/testing
```bash
npm run dev
```

## Cost

**Monthly:**
- Hosting: $0-5 (Vercel free or Railway free tier)
- APIs: $0 (all free tiers)
- Domain: $0 (subdomain of riyadesk.com)
- **Total: $0-5/month**

**Per scan:**
- Cost: $0
- Expected revenue (20% conversion @ $150-250 fix): $30-50

## Rate Limiting

Currently: None (MVP). Add before production:

```javascript
// 5 scans per IP per 24 hours
// 10 scans per email per 24 hours
// 20 scans per domain per 24 hours
```

Use Redis (included in Railway free tier) for rate limit storage.

## Contact

For questions or feedback, email hello@riyadesk.com
