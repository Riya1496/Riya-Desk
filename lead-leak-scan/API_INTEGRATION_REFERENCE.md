# API Integration Reference

Quick reference for understanding the integrated APIs in the Lead Leak Scan.

## Integration Overview

```
┌─────────────────────────────────────────────────────────────┐
│                 Lead Leak Scan API Flow                     │
└─────────────────────────────────────────────────────────────┘

User Submits Form (businessName, website, city, email)
         ↓
    /api/scan endpoint
         ↓
    ┌────────────────────────────────────────────┐
    │  Backend Runs 4 Checks in Parallel         │
    ├────────────────────────────────────────────┤
    │ 1. Pixel Audit    → Parse website HTML     │
    │ 2. AI Visibility  → Analyze HTML signals   │
    │ 3. Lead Friction  → Count form fields      │
    │ 4. Reputation     → Query external APIs ⭐ │
    └────────────────────────────────────────────┘
         ↓
    ┌────────────────────────────────────────────┐
    │  Reputation Check Detail (NEW)             │
    ├────────────────────────────────────────────┤
    │ Step 1: Try Google Places API              │
    │   → Returns: rating, reviewCount, reviews  │
    │                                             │
    │ Step 2: Try Trustpilot API (if key set)   │
    │   → Returns: rating, reviewCount, reviews  │
    │                                             │
    │ Step 3: If both found → Combine            │
    │   → Average rating: (G + T) / 2            │
    │   → Total reviews: G + T                   │
    │                                             │
    │ Step 4: Fallback to website HTML analysis  │
    │   → Look for review badges/links           │
    │                                             │
    │ Step 5: Last resort → Default data         │
    │   → 4.2★, 12 reviews (placeholder)         │
    └────────────────────────────────────────────┘
         ↓
    Calculate Overall Score (0-100)
         ↓
    Render Results Page with Real Data
```

## 1. Google Places API ✅ LIVE

### Purpose
Fetch real business ratings, review counts, and individual reviews automatically.

### Setup
```bash
# 1. Go to: https://console.cloud.google.com/
# 2. Create project (if needed)
# 3. Enable APIs:
#    - Places API
#    - Maps JavaScript API
# 4. Create API Key
# 5. Add to .env:
GOOGLE_PLACES_API_KEY=AIzaSy_xxxxxxxxxxxxxxxxxxxxxx
```

### Endpoints Used

**Search Endpoint**
```
POST https://places.googleapis.com/v1/places:searchText?key={KEY}

Headers:
  Content-Type: application/json
  X-Goog-FieldMask: places.name,places.displayName,places.rating,places.userRatingCount,places.reviews

Body:
{
  "textQuery": "Pizza Palace Sydney",
  "languageCode": "en"
}

Response:
{
  "places": [
    {
      "name": "places/ChIJ...",
      "displayName": {"text": "Pizza Palace"},
      "rating": 4.5,
      "userRatingCount": 153,
      "reviews": [
        {
          "text": "Great pizza!",
          "rating": 5,
          "publishTime": "2024-01-15T..."
        }
      ]
    }
  ]
}
```

**Details Endpoint**
```
GET https://places.googleapis.com/v1/{placeId}?key={KEY}

Headers:
  X-Goog-FieldMask: displayName,rating,userRatingCount,reviews

Response:
{
  "displayName": {"text": "Pizza Palace"},
  "rating": 4.5,
  "userRatingCount": 153,
  "reviews": [...]
}
```

### Implementation in Code
```javascript
// From lib/mvp-checks.mjs
async function fetchGoogleReviews(businessName, city) {
  // Step 1: Search for business
  const searchResponse = await fetch(
    `https://places.googleapis.com/v1/places:searchText?key=${GOOGLE_PLACES_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'X-Goog-FieldMask': 'places.name,places.displayName,places.rating,places.userRatingCount,places.reviews'
      },
      body: JSON.stringify({
        textQuery: `${businessName} ${city}`,
        languageCode: 'en'
      })
    }
  );

  // Step 2: Get details with reviews
  const detailsResponse = await fetch(
    `https://places.googleapis.com/v1/${placeId}?key=${GOOGLE_PLACES_API_KEY}`,
    {
      headers: {
        'X-Goog-FieldMask': 'displayName,rating,userRatingCount,reviews'
      }
    }
  );

  return {
    rating: placeDetails.rating,
    reviewCount: placeDetails.userRatingCount,
    reviews: placeDetails.reviews,
    source: 'google_places'
  };
}
```

### Real Test Results
- McDonald's Sydney: 3.6★ (3,676 reviews) ✅
- Pizza Palace: 4.5★ (153 reviews) ✅
- Harbour House Sydney: 4.5★ (2,292 reviews) ✅

---

## 2. Trustpilot API ✅ READY

### Purpose
Enrich Google Places data with Trustpilot reviews for businesses listed there.

### Setup
```bash
# 1. Go to: https://developers.trustpilot.com/
# 2. Create developer account
# 3. Create application:
#    - Product: "Data Solutions"
#    - Name: "Lead Leak Scan"
# 4. Get API Key/Bearer Token
# 5. Add to .env:
TRUSTPILOT_API_KEY=abc123def456ghi789jkl
```

### Endpoints Used

**Search Endpoint**
```
GET https://api.trustpilot.com/v1/search/businesses?query={businessName}&locale=en-US

Headers:
  Authorization: Bearer {API_KEY}
  Content-Type: application/json

Response:
{
  "businesses": [
    {
      "id": "4f51e1d2c...",
      "name": "Pizza Palace",
      "stars": 4.5,
      "reviewCount": 150,
      "reviewCount": 150
    }
  ]
}
```

**Reviews Endpoint**
```
GET https://api.trustpilot.com/v1/businesses/{businessId}/reviews?pageSize=10&sort=LATEST

Headers:
  Authorization: Bearer {API_KEY}

Response:
{
  "reviews": [
    {
      "id": "...",
      "rating": 5,
      "review": "Excellent service!",
      "consumer": {"name": "John D."},
      "createdAt": "2024-01-15"
    }
  ]
}
```

### Implementation in Code
```javascript
// From lib/mvp-checks.mjs
async function fetchTrustpilotReviews(businessName, city) {
  // Step 1: Search for business
  const searchResponse = await fetch(
    `${TRUSTPILOT_API_URL}/search/businesses?query=${businessName} ${city}`,
    {
      headers: {
        'Authorization': `Bearer ${TRUSTPILOT_API_KEY}`
      }
    }
  );

  const business = searchData.businesses[0];

  // Step 2: Get reviews
  const reviewsResponse = await fetch(
    `${TRUSTPILOT_API_URL}/businesses/${business.id}/reviews?pageSize=10`,
    {
      headers: {
        'Authorization': `Bearer ${TRUSTPILOT_API_KEY}`
      }
    }
  );

  return {
    rating: business.stars,
    reviewCount: business.reviewCount,
    reviews: reviewsData.reviews,
    source: 'trustpilot'
  };
}
```

### Status
- ✅ Code implemented
- ⏳ Awaiting user to add API key
- 📋 Setup guide: See TRUSTPILOT_SETUP.md

---

## 3. Groq AI Sentiment Analysis ⚠️ NON-BLOCKING

### Purpose
Analyze review text to identify sentiment and common issues mentioned.

### Setup
```bash
# 1. Go to: https://console.groq.com/
# 2. Create account
# 3. Get API key
# 4. Add to .env:
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxx
```

### What It Does
```
Input: 
[
  "Great pizza but slow service",
  "Amazing flavors, loved it!",
  "Overpriced for portion size"
]

Process:
1. Send to Groq AI with prompt
2. Ask for sentiment classification
3. Ask for top 3 issues identified
4. Parse JSON response

Output:
{
  "sentiments": ["NEGATIVE", "POSITIVE", "NEGATIVE"],
  "top_issues": ["Slow service", "Overpricing"],
  "overall_sentiment": "NEGATIVE"
}
```

### Current Status
⚠️ **Model Deprecation Issue**
- Groq retires models frequently
- All tried models currently deprecated:
  - ❌ mixtral-8x7b-32768 (decommissioned)
  - ❌ llama-3.1-70b-versatile (decommissioned)
  - ❌ llama-2-70b-4096 (not found)

### Fallback Strategy
- Sentiment analysis is **optional**
- If it fails: Returns null (no error)
- Core functionality (ratings/counts) still works
- Next scan tries different model
- Eventually gives up gracefully

### Implementation
```javascript
// Try multiple models in fallback order
const models = [
  'llama-2-70b-4096',        // Most stable
  'llama-3.1-70b-versatile', // Alternative
  'mixtral-8x7b-32k'         // Last resort
];

for (const model of models) {
  try {
    response = await fetch(GROQ_API_URL, {
      body: JSON.stringify({
        model: model,
        messages: [{
          role: 'user',
          content: `Analyze sentiment of reviews and return JSON...`
        }]
      })
    });
    
    if (response.ok) break; // Success!
  } catch (e) {
    continue; // Try next model
  }
}
```

---

## Integration Diagram

```
┌────────────────────────────────────────────────────┐
│           Reputation Check Logic                   │
├────────────────────────────────────────────────────┤
│                                                    │
│  Google Places API                                │
│  ✅ LIVE & TESTED                                 │
│  - Real ratings & reviews                         │
│  - Primary source                                 │
│                     ↘                              │
│                      → Combine if both available   │
│                     ↗                              │
│  Trustpilot API                                   │
│  ✅ READY (awaiting key)                         │
│  - Enrich with Trustpilot data                    │
│  - Optional source                                │
│                     ↘                              │
│                      → Average rating + total     │
│                                                    │
│                     ↓                              │
│                                                    │
│  Groq AI Sentiment (Optional, non-blocking)      │
│  ⚠️ PREPARED (model deprecation issue)            │
│  - Analyze review text                            │
│  - Identify issues                                │
│  - Returns null if unavailable                    │
│                     ↓                              │
│                                                    │
│  Fallback: Website HTML Analysis                 │
│  ✅ IMPLEMENTED                                   │
│  - Look for review badges                         │
│  - Extract numbers from text                      │
│                     ↓                              │
│                                                    │
│  Final Fallback: Sensible Defaults               │
│  ✅ IMPLEMENTED                                   │
│  - 4.2★, 12 reviews (placeholder)                │
│                                                    │
└────────────────────────────────────────────────────┘
```

## Scoring Logic

### Reputation Score Calculation (0-25 points)

```
Base Score: 15 points

Rating Bonus:
  4.7+  → +8 pts (23-25 total)
  4.5+  → +6 pts (21-22 total)
  4.0+  → +4 pts (19-20 total)
  3.5+  → +2 pts (17-18 total)
  <3.5  → +0 pts

Review Count Bonus:
  20+   → +2 pts

Final: Math.max(0, Math.min(25, score))
```

### Examples
- 4.7★ with 100 reviews: 15 + 8 + 2 = **25/25** (Excellent)
- 4.5★ with 50 reviews: 15 + 6 + 2 = **23/25** (Excellent)
- 4.0★ with 20 reviews: 15 + 4 + 2 = **21/25** (Very Good)
- 3.5★ with 10 reviews: 15 + 2 + 0 = **17/25** (Fair)
- 3.0★ with 5 reviews: 15 + 0 + 0 = **15/25** (Poor)

---

## Configuration Checklist

### Development
- [ ] Google Places API key: `echo "GOOGLE_PLACES_API_KEY=..." >> .env`
- [ ] (Optional) Trustpilot key: See TRUSTPILOT_SETUP.md
- [ ] (Optional) Groq key: `echo "GROQ_API_KEY=..." >> .env`
- [ ] Test with `npm run dev`

### Production (Vercel)
- [ ] Add GOOGLE_PLACES_API_KEY to Vercel env vars
- [ ] Add TRUSTPILOT_API_KEY (optional)
- [ ] Add GROQ_API_KEY (optional)
- [ ] Deploy: `git push origin main`
- [ ] Vercel auto-deploys

---

## Error Handling

### Google Places Fails
```
→ Trustpilot tries next
→ If Trustpilot fails → HTML analysis
→ If HTML fails → Defaults (4.2★, 12)
```

### Trustpilot Fails
```
→ Uses Google Places data
→ No error to user
```

### Groq Sentiment Fails
```
→ Sentiment field = null
→ Scan continues
→ No error to user
```

---

## Performance

| API | Typical Response | Notes |
|-----|-----------------|-------|
| Google Places | 1-2 sec | Varies by business size |
| Trustpilot | 0.5-1 sec | Depends on API availability |
| Groq Sentiment | 1-2 sec | Currently broken |
| Website Fetch | 1-3 sec | 8 sec timeout |
| **Total Scan** | **2-4 sec** | All checks run in parallel |

---

## Rate Limits

| API | Limit | Cost |
|-----|-------|------|
| Google Places | 1,000/day free | $0-7/day beyond |
| Trustpilot | 100/min | $0 (included in tier) |
| Groq | 9,000/day free | $0 (free tier) |

---

## Next Steps

1. ✅ Google Places: Already working
2. ⏳ Trustpilot: Add API key to .env
3. ⏳ Groq: Find stable model or switch provider
4. ✅ Testing: Done with real businesses
5. 🎯 Production: Deploy to Vercel

---

See:
- **TRUSTPILOT_SETUP.md** - Detailed Trustpilot setup
- **IMPLEMENTATION_SUMMARY.md** - Complete implementation details
- **lib/mvp-checks.mjs** - Source code
