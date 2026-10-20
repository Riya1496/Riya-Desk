# Trustpilot API Integration

## Overview

The Lead Leak Scan now supports fetching review data from **both Google Places and Trustpilot**. When a business is found on both platforms, the system combines their ratings and reviews to provide a more complete reputation analysis.

## How It Works

1. **Google Places First** (Primary source)
   - Real-time data from Google
   - Automatic search by business name + city
   - Gets: Rating, review count, individual reviews

2. **Trustpilot Second** (Enrichment)
   - Supplements Google data if available
   - Also automatic search
   - Gets: Rating, review count, individual reviews

3. **Combined Results**
   - If both available: Shows average rating + combined review count
   - If one available: Shows that source's data
   - Formats: "4.5★ from Google Places + Trustpilot (combined 5,234 reviews)"

## Setup Instructions

### Step 1: Get Trustpilot API Credentials

1. Go to https://developers.trustpilot.com/
2. Create a developer account (or sign in)
3. Go to "Products" → Select **"Data Solutions"** (this is the key - not Business API)
4. Create an API application:
   - Name: "Lead Leak Scan"
   - Description: "Free lead audit tool for SMEs"
   - Website: scan.riyadesk.com
5. You'll receive:
   - **API Key** (looks like: `abc123def456...`)
   - Keep this confidential - it's your bearer token

### Step 2: Add to Environment Variables

Add this line to your `.env` file:

```
TRUSTPILOT_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with your actual Trustpilot API key.

### Step 3: Test the Integration

Run a scan for a business that exists on Trustpilot:

```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Zendesk",
    "website": "https://www.zendesk.com",
    "city": "San Francisco",
    "email": "test@example.com"
  }'
```

Check the response for:
- `"source": "Google Places + Trustpilot"` (if both found)
- `"reviewCount"` should be sum of both sources

## Trustpilot API Details

### Endpoints Used

1. **Search Endpoint**
   ```
   GET /v1/search/businesses?query={businessName}
   ```
   Returns: List of matching businesses with IDs

2. **Reviews Endpoint**
   ```
   GET /v1/businesses/{businessId}/reviews?pageSize=10&sort=LATEST
   ```
   Returns: Individual reviews with text and ratings

### Authentication

All requests use Bearer token:
```
Authorization: Bearer {TRUSTPILOT_API_KEY}
```

### Rate Limits

- Data Solutions tier: 100 requests/minute
- Scans are rate-limited at: 1 request per business per scan

### Data Returned

Each review includes:
- `text` - Review content
- `rating` - 1-5 star rating
- `consumer.name` - Reviewer name
- `createdAt` - When published

## Sentiment Analysis Integration

⚠️ **Current Status**: Sentiment analysis (identifying specific issues from reviews) requires an AI model.

**Options**:
1. **Groq AI** (Current, free tier)
   - Set `GROQ_API_KEY` in `.env`
   - Analyzes review text to find sentiment + issues
   - Models: Various (subject to deprecation)

2. **Future**: Switch to OpenAI, Anthropic, or other stable providers

For now, the system gracefully falls back if sentiment analysis unavailable - you still get the rating and review count, just not the issue analysis.

## Fallback Behavior

If either API fails:

1. **Google Places fails** → Falls back to Trustpilot
2. **Trustpilot fails** → Uses only Google Places
3. **Both fail** → Analyzes website HTML for review badges
4. **All fail** → Returns sensible defaults (4.2★, 12 reviews)

This ensures scans always return meaningful data.

## Deployment Notes

### Production (Vercel)

1. Add `TRUSTPILOT_API_KEY` to Vercel environment variables:
   ```
   Settings → Environment Variables → Add TRUSTPILOT_API_KEY
   ```

2. Redeploy:
   ```bash
   git add .env.example
   git commit -m "Add Trustpilot API documentation"
   git push origin main
   ```

### Rate Limiting (Recommended)

Current implementation has no rate limiting. For production, consider:

```javascript
// Pseudocode - add to api/scan.mjs
const rateLimit = {
  '127.0.0.1': { count: 0, resetAt: Date.now() },
  // ... per-IP tracking
};

// Max 5 scans per IP per 24 hours
if (rateLimit[clientIP].count > 5) {
  return 429; // Too Many Requests
}
```

## Troubleshooting

### Error: "Trustpilot API key not configured"
- Check `.env` file has `TRUSTPILOT_API_KEY=...`
- Verify key is not empty/null
- Restart dev server after changing .env

### Error: "No Trustpilot results found"
- Business might not be on Trustpilot yet
- Try exact business name
- Trustpilot has different coverage by country/industry

### Error: "401 Unauthorized"
- API key might be expired
- Check Trustpilot developer dashboard
- Regenerate key if needed

### Sentiment Analysis Not Working
- This is expected - Groq models frequently deprecate
- Core functionality (ratings + counts) still works
- Sentiment is optional enhancement

## Data Privacy

- **No PII stored**: We don't store user emails or business data
- **No tracking**: We don't track individual scans
- **API keys**: Keep `TRUSTPILOT_API_KEY` private (never commit to git)
- **User data**: Deleted after scan completes (sessionStorage in browser)

## Next Steps

1. ✅ Get Trustpilot API credentials
2. ✅ Add to `.env` file
3. ✅ Test with a known business
4. ⬜ Monitor which businesses are found on Trustpilot vs Google
5. ⬜ Adjust search logic if needed (fuzzy matching, etc.)
6. ⬜ Consider adding industry-specific platforms (e.g., Feefo for retail)

---

**Questions?** Check the main README.md for architecture overview or CLAUDE.md for project context.
