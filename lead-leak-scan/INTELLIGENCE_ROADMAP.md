# Lead Leak Scan - Intelligence Roadmap

## Current Implementation (✅ LIVE)

### Business Type Context
- User selects: E-commerce, B2B SaaS, Local Service, Agency, Content Creator, Other
- Scoring adjusted based on type (TikTok irrelevant for B2B SaaS, etc.)
- Confidence scores show data quality: High/Medium/Low

### Current Data Sources
| Check | Data Source | Confidence | What We Actually Know |
|-------|-----------|-----------|----------------------|
| **Pixel Audit** | HTML JavaScript detection | HIGH | Real GA4/Meta/Google Ads pixels found |
| **AI Visibility** | Website mentions | LOW | Business name appears on site (not actual AI recommendations) |
| **Contact Form** | HTML form parsing | HIGH | We count form fields |
| **Reviews** | Google Places API | HIGH | Real ratings + review count |

## Future Enhancements

### 🔍 Google Search Console Integration

**Why it matters:**
- Replace guessing with REAL search visibility data
- Show: impressions, clicks, CTR, ranking keywords
- Detect if business is missing from Google entirely

**Data we'd get:**
```
- Monthly impressions for keywords
- Click-through rate (CTR)
- Average ranking position
- Mobile usability issues
- Crawl errors & indexation status
- Security issues detected
```

**Implementation:**
```javascript
// User connects Google Search Console via OAuth
// We fetch real performance data:

{
  "impressions": 1240,
  "clicks": 87,
  "avgCTR": 7.0,
  "topKeywords": [
    "fast printing sydney",
    "bulk printing",
    "business cards"
  ],
  "indexedPages": 42,
  "crawlErrors": 2,
  "mobileUsability": "good"
}

// New "SEO Visibility" score (0-25 points):
// - Impressions high = +15 pts
// - CTR > 3% = +5 pts
// - No crawl errors = +5 pts
```

**Timeline:** 1-2 sprints (OAuth flow + API integration)

---

### 📊 Ahrefs Data Integration

**Why it matters:**
- Domain Authority (how strong is this domain?)
- Backlink profile (link quality)
- Organic traffic estimate
- Competitor benchmarking

**Data we'd get:**
```
- Domain Rating (DR): 0-100 scale
- Backlink count & quality
- Referring domains
- Organic traffic estimate
- Top pages by traffic
- Competitor analysis
```

**Implementation:**
```javascript
// User provides Ahrefs API key (or we use ours)
// We fetch domain metrics:

{
  "domainRating": 28,
  "backlinks": 342,
  "referringDomains": 89,
  "estimatedOrganicTraffic": 1240,
  "topPages": [
    { "url": "/services", "traffic": 450 },
    { "url": "/about", "traffic": 320 }
  ]
}

// New "Domain Authority" score (0-25 points):
// - DR > 30 = +10 pts
// - Backlinks > 200 = +8 pts
// - Organic traffic > 500 = +7 pts
```

**Requirement:** 
- ⚠️ Ahrefs paid account needed (~$99/month minimum)
- Alternative: Use free APIs (Moz, Similarweb) with limited data

**Timeline:** 1 sprint (API integration)

---

### 🎯 Context-Aware Scoring

**Current Implementation:**
```javascript
function calculatePixelScore(businessType, foundPixels) {
  const requirements = {
    'ecommerce': ['GA4', 'Meta Pixel', 'Google Ads', 'Hotjar'],
    'b2b_saas': ['GA4', 'Google Ads', 'LinkedIn Insight'], // No TikTok
    'local_service': ['GA4', 'Meta Pixel'], // Basic tracking only
    'content_creator': ['GA4', 'Hotjar', 'Mouseflow'],
    'agency': ['GA4', 'Google Ads', 'LinkedIn Insight']
  };
  
  const required = requirements[businessType] || requirements.ecommerce;
  const found = foundPixels.filter(p => required.includes(p)).length;
  return (found / required.length) * 25;
}
```

**Benefit:**
- Local plumber isn't penalized for missing TikTok Pixel
- B2B SaaS gets credit for LinkedIn, not docked for Hotjar
- More relevant, business-specific scoring

---

### 📈 Confidence Indicators

**Current Implementation:**
```javascript
{
  "checkId": "pixel_audit",
  "confidence": "high",
  "dataSource": "HTML analysis (JavaScript detection)",
  "note": "We directly scanned your website"
}
```

**Display in results:**
```
📊 Website Tracking: 0/25 [HIGH CONFIDENCE]
   Data: Direct HTML analysis
   Finding: No GA4, Meta Pixel, or Google Ads tracking found
```

---

## Implementation Priority

| Phase | Feature | Effort | Impact | Timeline |
|-------|---------|--------|--------|----------|
| **Live** | Business Type + Context | ✅ Done | Medium | Complete |
| **Phase 1** | Confidence Scores | Easy | Low | 1 day |
| **Phase 2** | Search Console OAuth | Medium | High | 1-2 weeks |
| **Phase 3** | Ahrefs Integration | Medium | Medium | 1 week |
| **Phase 4** | Similarweb Integration | Easy | Low | 3 days |

---

## User Experience Impact

### Before Enhancement
```
User: "Why am I getting docked for missing TikTok Pixel?"
Response: "TikTok is important for all businesses"
Reality: ❌ Irrelevant for their B2B SaaS
```

### After Enhancement
```
User: "Why am I getting docked for missing TikTok Pixel?"
Response: "TikTok is not relevant for B2B SaaS businesses. 
          You're strong on GA4 and LinkedIn. ✓"
Reality: ✅ Contextual, accurate scoring
```

---

## Questions for Implementation

1. **Ahrefs:** Do you have an Ahrefs API key? Or should we use Moz (free) instead?
2. **Search Console:** Are you comfortable with OAuth flow (user grants access)?
3. **Privacy:** Should we store API keys or just use session-based auth?

---

## Confidence Assessment

| Aspect | Before | After |
|--------|--------|-------|
| Pixel Audit | ⭐⭐⭐ Medium | ⭐⭐⭐⭐ High (context-aware) |
| AI Visibility | ⭐⭐ Low | ⭐⭐⭐ Medium (with Search Console) |
| Overall | 65% | 80-85% (with Search Console + Ahrefs) |

Search Console + Ahrefs = **90%+ confidence** (real data, not guesses)
