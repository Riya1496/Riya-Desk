# Free AI Options for Lead Leak Scan

Complete guide to adding AI visibility checks for **$0 cost**.

## Option 1: Groq API (Recommended - Simplest)

**What it is:** Free LLM API, no credit card needed, blazing fast.

### Setup (5 minutes)

1. Go to **console.groq.com**
2. Click "Sign up" (Google/GitHub auth)
3. Create account
4. Go to "API Keys"
5. Create new API key
6. Copy the key (looks like: `gsk_xxxxxxxxxxxxx`)

### Add to Environment Variables

In `.env` file:
```
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
```

### Use in Code

Install Groq SDK:
```bash
npm install @groq-cloud/sdk
```

Use in `lib/mvp-checks.mjs`:
```javascript
import Groq from "@groq-cloud/sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function checkAIVisibilityGroq(businessName, city) {
  try {
    const response = await client.messages.create({
      messages: [{
        role: "user",
        content: `Is "${businessName}" mentioned as a top service provider when someone asks you "Who are the best ${businessName.split(' ')[0].toLowerCase()} businesses in ${city}?" Answer with just "yes" or "no".`
      }],
      model: "mixtral-8x7b-32768", // Free model
      max_tokens: 50,
    });

    const answer = response.content[0].text.toLowerCase();
    const mentioned = answer.includes('yes');
    
    return {
      checkId: 'ai_visibility',
      checkName: 'AI Visibility (via Groq)',
      mentioned,
      score: mentioned ? 20 : 5,
      severity: mentioned ? 'good' : 'critical'
    };
  } catch (error) {
    console.error('Groq error:', error);
    return {
      checkId: 'ai_visibility',
      checkName: 'AI Visibility',
      mentioned: false,
      score: 0,
      severity: 'critical'
    };
  }
}
```

### Limits
- Free tier: Plenty for MVP (~30 requests/minute)
- Models available: `mixtral-8x7b-32768` (free), `llama-2-70b-chat` (free)
- **Cost: $0/month**

---

## Option 2: Ollama + Llama (Local - True $0)

**What it is:** Run an LLM locally on your machine. Download once, use forever for free.

### Setup (10 minutes)

1. Download **Ollama** from https://ollama.ai
2. Install it
3. Run in terminal:
   ```bash
   ollama run llama2
   ```
4. This downloads Llama 2 (~4GB)
5. Wait for it to finish

### Use in Code

In `lib/mvp-checks.mjs`:
```javascript
export async function checkAIVisibilityOllama(businessName, city) {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama2',
        prompt: `Is "${businessName}" mentioned as a top service provider in ${city}? Answer with just "yes" or "no".`,
        stream: false,
      }),
    });

    const data = await response.json();
    const answer = data.response.toLowerCase();
    const mentioned = answer.includes('yes');

    return {
      checkId: 'ai_visibility',
      checkName: 'AI Visibility (via Ollama)',
      mentioned,
      score: mentioned ? 20 : 5,
      severity: mentioned ? 'good' : 'critical'
    };
  } catch (error) {
    console.error('Ollama error:', error);
    return {
      checkId: 'ai_visibility',
      checkName: 'AI Visibility',
      mentioned: false,
      score: 0,
      severity: 'critical'
    };
  }
}
```

### Limits
- **Cost: $0/month** (one-time 4GB download)
- Only works when Ollama is running locally
- Great for development/MVP
- Can switch to Groq in production

---

## Option 3: Hybrid (Groq + Ollama Fallback)

Use Groq in production, Ollama as fallback for development:

```javascript
export async function checkAIVisibility(businessName, city) {
  // Try Groq first
  if (process.env.GROQ_API_KEY) {
    return await checkAIVisibilityGroq(businessName, city);
  }

  // Fallback to Ollama if available
  try {
    return await checkAIVisibilityOllama(businessName, city);
  } catch (e) {
    console.warn('Neither Groq nor Ollama available');
    return {
      checkId: 'ai_visibility',
      checkName: 'AI Visibility',
      mentioned: false,
      score: 0,
      severity: 'critical'
    };
  }
}
```

---

## For Google Ratings (Completely Free)

No API needed. Just scrape Google Maps search results:

```javascript
export async function checkGoogleRating(businessName, city) {
  try {
    // Search for business on Google
    const searchQuery = `${businessName} ${city} google maps`;
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

    // Fetch search results (free, just HTML parsing)
    const response = await fetch(googleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = await response.text();

    // Parse for rating (regex pattern)
    const ratingMatch = html.match(/rating["\']?\s*:\s*([\d.]+)/i);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

    const reviewMatch = html.match(/(\d+)\s*review/i);
    const reviewCount = reviewMatch ? parseInt(reviewMatch[1]) : 0;

    return {
      rating,
      reviewCount,
      found: rating !== null
    };
  } catch (error) {
    console.error('Rating fetch error:', error);
    return { rating: null, reviewCount: 0, found: false };
  }
}
```

---

## Recommendation

**For MVP:**
- ✅ Use **Groq** (free tier, no setup needed, works everywhere)
- ✅ Use **HTML scraping** for Google ratings (100% free)
- ✅ Skip Ollama for now (unless you want local-only development)

**Cost: $0/month**

---

## Integration into Backend

Update `lib/mvp-checks.mjs` to use Groq:

```javascript
import Groq from "@groq-cloud/sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function runAllChecks(businessName, website, city, additionalData = {}) {
  // ... existing checks ...

  // Add AI visibility check with Groq
  const aiCheck = await checkAIVisibilityGroq(businessName, city);

  // Add Google rating check (free scraping)
  const ratingCheck = await checkGoogleRating(businessName, city);

  // ... return results ...
}
```

---

## Testing

```bash
# Test with mock data first
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Sydney Insurance",
    "website": "https://example.com",
    "city": "Sydney",
    "email": "test@test.com"
  }'
```

---

## Summary

| Method | Cost | Setup Time | Best For |
|--------|------|------------|----------|
| **Groq** | Free | 5 min | Production, simple |
| **Ollama** | Free | 10 min | Development, local |
| **Both** | Free | 15 min | Maximum flexibility |

**Start with Groq. It's the easiest.**
