# 🤖 Google Gemini API Setup (5 minutes)

**Good news:** You already have a Google Cloud account! The Gemini API uses the same account as Google Places API.

## Quick Setup

### Step 1: Go to Google Cloud Console
```
https://console.cloud.google.com/
```

### Step 2: Select Your Project
- The one where you created `GOOGLE_PLACES_API_KEY`
- (Should show: Project > Select > your project name)

### Step 3: Enable Generative Language API
```
1. Click "Search APIs & Services" (search bar at top)
2. Search for "Generative Language API"
3. Click it
4. Click "ENABLE"
5. Wait 30 seconds for it to activate
```

### Step 4: Use Existing API Key
The `GOOGLE_PLACES_API_KEY` you already have works for Gemini too!

Add to `.env`:
```bash
GOOGLE_GEMINI_API_KEY=AIzaSyDuRNf5y6lzEY9nswXLq9CSH5JzR6EaLWQ
# (Same key as GOOGLE_PLACES_API_KEY)
```

**That's it!** No new key needed.

---

## Why Same Key Works?

Both APIs are in the same Google Cloud project:
- Google Places API ← in your project
- Generative Language API (Gemini) ← same project
- One key = access to both

---

## Verify It Works

```bash
# Add to .env
echo "GOOGLE_GEMINI_API_KEY=AIzaSyDuRNf5y6lzEY9nswXLq9CSH5JzR6EaLWQ" >> .env

# Test
npm run dev

# Try a scan
# Open http://localhost:3000
# Submit: "Pizza Palace Sydney" / "pizzapalacesydney.com.au"
# Check server logs for:
#   ✓ "Checking real AI visibility..."
#   ✓ "Analyzing sentiment for X reviews with Gemini"
#   ✓ "Sentiment: POSITIVE/NEGATIVE/NEUTRAL"
```

---

## What It Does Now

### 1. Real AI Visibility Check
**Before:** Guessed based on website HTML
**Now:** Asks Gemini: "Does [Business] appear in top 5 for [Service] in [City]?"
**Result:** REAL answer from AI analysis

### 2. Sentiment Analysis
**Before:** Broke (Groq models deprecated)
**Now:** Gemini analyzes reviews and identifies issues
**Result:** Shows top complaints from negative reviews

### 3. Competitor Analysis (Ready)
**Future:** Can ask Gemini to compare competitors
**Capability:** Already built in, just needs UI update

---

## Cost

### Free Tier
- 60 API calls per minute
- $0/month
- Enough for: 1000+ scans/month

### Paid Tier (if needed)
- $35/month for 1.5M tokens
- At 50 scans/month: $0-2/month
- At 1000 scans/month: $30-35/month

---

## Rate Limits

| Metric | Free Tier | Paid Tier |
|--------|-----------|-----------|
| Requests/min | 60 | 1500+ |
| Tokens/min | 60k | 1M+ |
| Price | $0 | $35/mo |

At 20 scans/day (600/month):
- Free tier: ✓ (uses ~20 calls/day)
- Cost: $0

At 100 scans/day (3000/month):
- Free tier: ✓ (uses ~100 calls/day)
- Cost: $0

---

## Troubleshooting

### Error: "Gemini API key not configured"
```
Check .env file:
- GOOGLE_GEMINI_API_KEY=... should exist
- No quotes around key
- Restart dev server: npm run dev
```

### Error: "INVALID_ARGUMENT: Generative Language API... not activated"
```
Go back to Step 3:
1. console.cloud.google.com
2. Search "Generative Language API"
3. Click "ENABLE"
4. Wait 1-2 minutes
5. Retry scan
```

### Error: "API key has ip address restrictions"
```
If you set IP restrictions for Places API:
1. Add localhost (127.0.0.1)
2. Or remove IP restrictions temporarily for testing
3. In Google Cloud: APIs & Services > Credentials > Select key > Restrictions
```

### Sentiment shows "null" but other data works?
```
This means Gemini API is slow or unreachable.
Check:
1. API key is correct
2. Generative Language API is enabled
3. Network connection is good
4. Try again in a few seconds

Sentiment is optional - core scan still works.
```

---

## What's Happening Now

When you run a scan:

```
User submits: "Pizza Palace Sydney"
         ↓
Backend:
1. Fetch website HTML
2. Check pixels, forms, etc.
3. Query Google Places for reviews
         ↓ (NEW)
4. Ask Gemini: "Does Pizza Palace appear in top recommendations?"
5. Get sentiment from Gemini: "Reviews are 78% positive, issues: slow service"
         ↓
Display results with REAL data
```

---

## Next Steps

1. **Add Gemini API key to .env** (same as Places key)
2. **Test locally**: `npm run dev`
3. **Verify** sentiment analysis works
4. **Deploy** to Vercel with `GOOGLE_GEMINI_API_KEY`

---

See Also:
- `AI_VISIBILITY_PROBLEM.md` - Why we switched
- `README.md` - Project overview
- `API_INTEGRATION_REFERENCE.md` - API details
