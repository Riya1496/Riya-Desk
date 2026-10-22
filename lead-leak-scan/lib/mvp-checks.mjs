/**
 * MVP Checks for Lead Leak Scan - REAL DATA ONLY
 *
 * Four core checks - all using actual website analysis:
 * 1. Website Tracking - Fetches website HTML and detects tracking pixels
 * 2. AI Visibility - Uses Google Gemini (AQ keys) to check if business appears in AI search
 * 3. Contact Form - Parses website HTML to count form fields
 * 4. Customer Reviews - Uses public review data (manual input or basic scraping)
 */

import { GoogleGenAI } from '@google/genai';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_URL = 'https://maps.googleapis.com/maps/api/place';
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const TRUSTPILOT_API_KEY = process.env.TRUSTPILOT_API_KEY;
const TRUSTPILOT_API_URL = 'https://api.trustpilot.com/v1';

// Initialize Gemini client with explicit API key (works with AQ... keys)
let geminiClient = null;
if (GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    console.log('✅ Gemini client initialized with AQ key');
  } catch (error) {
    console.warn('⚠️ Failed to initialize Gemini client:', error.message);
  }
}

// Pixel detection patterns
const PIXEL_PATTERNS = {
  'GA4': /(gtag|G-[A-Z0-9]{10,}|analytics\.google|googletagmanager)/i,
  'Meta Pixel': /(fbq\(|facebook\.com\/[a-z-]*fbevents|facebook\.com\/en_US\/fbevents)/i,
  'Google Ads': /(google_conversion_id|gtag.*conversion|goog_pq)/i,
  'TikTok Pixel': /(ttq\.load|tiktok\.com\/pixels|tiktok\.com\/customer_data)/i,
  'LinkedIn Insight': /(_linkedin_partner|linkedin\.insights|linkedin\.com\/li\.js)/i,
  'Hotjar': /(hj\.site|hj\(|hotjar\.com\/h\.js)/i,
  'Mouseflow': /(mouseflow\(|mouseflow\.com\/.*\.js)/i
};

/**
 * CHECK 1: Website Tracking Pixels - REAL DATA
 * Fetches website and checks for actual tracking pixels in HTML
 */
export async function checkPixelAudit(html) {
  if (!html || html.length === 0) {
    return {
      checkId: 'pixel_audit',
      checkName: '📊 Website Tracking',
      found: [],
      missing: Object.keys(PIXEL_PATTERNS),
      score: 0,
      severity: 'critical',
      method: 'website_fetch',
      note: 'Website could not be analyzed'
    };
  }

  const found = [];
  const missing = [];
  const pixels = Object.keys(PIXEL_PATTERNS);

  for (const pixel of pixels) {
    const pattern = PIXEL_PATTERNS[pixel];
    if (pattern.test(html)) {
      found.push(pixel);
    } else {
      missing.push(pixel);
    }
  }

  const score = Math.round((found.length / pixels.length) * 25);

  return {
    checkId: 'pixel_audit',
    checkName: '📊 Website Tracking',
    found,
    missing,
    score,
    severity: score < 8 ? 'critical' : score < 15 ? 'warning' : 'good',
    method: 'html_parse'
  };
}

/**
 * CHECK 2: AI Visibility - REAL DATA
 * Checks if business appears in AI recommendations using Gemini
 */
async function checkAIVisibilityWithGemini(businessName, city) {
  if (!geminiClient) {
    console.log('⚠️ Gemini API not configured - using fallback');
    return null;
  }

  // Fallback models in priority order
  const models = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.5-flash'];

  const prompt = `Imagine someone searches for "best ${businessName.split(' ').slice(-1)[0].toLowerCase()} in ${city}".

Would "${businessName}" likely appear in the top 5 recommendations?

Consider:
1. Business prominence and online presence
2. Likelihood of appearing in AI search results
3. Brand recognition in the local market

Respond with ONLY valid JSON (no markdown, no extra text):
{"appears": true, "score": 15-25, "reason": "brief reason"} or {"appears": false, "score": 0-8, "reason": "brief reason"}`;

  for (const model of models) {
    try {
      console.log(`🔍 Checking real AI visibility for "${businessName}" in ${city} using Gemini (${model})`);

      const response = await geminiClient.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const text = response.candidates[0].content.parts[0].text;

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log(`  Could not parse Gemini response from ${model}`);
        continue; // Try next model
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`  AI Visibility: ${parsed.appears ? 'YES' : 'NO'} - ${parsed.reason} (${model})`);

      return {
        appears: parsed.appears,
        score: parsed.score || (parsed.appears ? 20 : 5),
        reason: parsed.reason,
        method: 'gemini_ai'
      };
    } catch (error) {
      console.log(`  ⚠️ Model ${model} failed: ${error.message}`);
      continue; // Try next model
    }
  }

  console.error('❌ All Gemini models failed - using fallback');
  return null;
}

export async function checkAIVisibility(businessName, city, html = '') {
  try {
    console.log(`🤖 Analyzing AI visibility for "${businessName}" in ${city}`);

    // Try real AI visibility check first
    const geminiResult = await checkAIVisibilityWithGemini(businessName, city);
    if (geminiResult) {
      return {
        checkId: 'ai_visibility',
        checkName: '🤖 AI Visibility',
        mentioned: geminiResult.appears,
        score: geminiResult.score,
        reason: geminiResult.reason,
        severity: geminiResult.score >= 15 ? 'good' : geminiResult.score >= 8 ? 'warning' : 'critical',
        method: geminiResult.method
      };
    }

    // Fallback to heuristic if Gemini unavailable
    console.log(`⚠️ Falling back to website analysis`);

    const nameRegex = new RegExp(businessName, 'gi');
    const nameMatches = (html.match(nameRegex) || []).length;

    let brandStrength = 0;
    if (html.toLowerCase().includes(`<title>${businessName.toLowerCase()}`)) {
      brandStrength += 3;
    }
    if (html.toLowerCase().includes(`content="${businessName.toLowerCase()}`)) {
      brandStrength += 2;
    }
    if (html.toLowerCase().includes(`<h1>`) && nameMatches > 0) {
      brandStrength += 2;
    }

    const locationMatches = (html.match(new RegExp(city, 'gi')) || []).length;
    if (locationMatches > 0) {
      brandStrength += 1;
    }

    let score = 0;
    if (brandStrength >= 5 && nameMatches >= 5) {
      score = 20;
    } else if (brandStrength >= 3 && nameMatches >= 2) {
      score = 15;
    } else if (brandStrength > 0 || nameMatches > 0) {
      score = 8;
    }

    console.log(`  Brand signals: ${brandStrength}, Name mentions: ${nameMatches}`);

    return {
      checkId: 'ai_visibility',
      checkName: '🤖 AI Visibility',
      mentioned: score >= 8,
      score,
      severity: score >= 15 ? 'good' : score >= 8 ? 'warning' : 'critical',
      method: 'heuristic_fallback'
    };
  } catch (error) {
    console.error('❌ AI Visibility check failed:', error.message);
    return {
      checkId: 'ai_visibility',
      checkName: '🤖 AI Visibility',
      mentioned: false,
      score: 0,
      severity: 'critical',
      method: 'error',
      error: error.message
    };
  }
}

/**
 * CHECK 3: Contact Form Complexity - REAL DATA
 * Parses HTML to count actual form fields
 */
export async function checkLeadFriction(html) {
  if (!html || html.length === 0) {
    return {
      checkId: 'lead_friction',
      checkName: '📋 Contact Form',
      fieldCount: 0,
      hasPhoneLink: false,
      hasScheduling: false,
      frictionScore: 100,
      score: 0,
      severity: 'critical',
      method: 'website_fetch',
      note: 'No website found'
    };
  }

  // Count form input fields (text, email, number, etc.)
  const inputMatches = html.match(/<input[^>]*type=["'](text|email|number|tel|date|datetime|password|search)["'][^>]*>/gi) || [];
  const textareaMatches = html.match(/<textarea[^>]*>/gi) || [];
  const selectMatches = html.match(/<select[^>]*>/gi) || [];

  const totalFields = inputMatches.length + textareaMatches.length + selectMatches.length;

  // Check for phone links
  const hasPhoneLink = /tel:/i.test(html) || /\+?[0-9\s\-\(\)]{10,}/i.test(html);

  // Check for scheduling tools
  const hasScheduling = /calendly|acuityscheduling|housecall|setmore|bookingcom/i.test(html);

  // Score: fewer fields = better
  let score = 0;
  let frictionScore = 100;

  if (totalFields === 0) {
    score = 0; // No form at all
    frictionScore = 100;
  } else if (totalFields <= 3) {
    score = 22; // Good
    frictionScore = 10;
  } else if (totalFields <= 5) {
    score = 18; // Acceptable
    frictionScore = 30;
  } else if (totalFields <= 7) {
    score = 12; // Needs improvement
    frictionScore = 60;
  } else {
    score = 5; // Too many fields
    frictionScore = 80;
  }

  return {
    checkId: 'lead_friction',
    checkName: '📋 Contact Form',
    fieldCount: totalFields,
    hasPhoneLink,
    hasScheduling,
    frictionScore,
    score,
    severity: score < 10 ? 'critical' : score < 15 ? 'warning' : 'good',
    method: 'html_parse'
  };
}

/**
 * Fetch Google Reviews using Places API (New)
 */
async function fetchGoogleReviews(businessName, city) {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('⚠️ Google Places API key not found');
    return null;
  }

  try {
    console.log(`🔍 Searching Google Places for "${businessName}" in ${city}`);

    // STEP 1: Search for the business using NEW Places API endpoint
    const searchResponse = await fetch(
      `https://places.googleapis.com/v1/places:searchText?key=${GOOGLE_PLACES_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-FieldMask': 'places.name,places.displayName,places.rating,places.userRatingCount,places.reviews'
        },
        body: JSON.stringify({
          textQuery: `${businessName} ${city}`,
          languageCode: 'en'
        })
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.log(`  HTTP ${searchResponse.status}: ${errorText.substring(0, 200)}`);
      throw new Error(`Google Places search failed: ${searchResponse.status} - ${errorText.substring(0, 100)}`);
    }

    const searchData = await searchResponse.json();

    if (searchData.error) {
      console.log(`  API Error: ${JSON.stringify(searchData.error)}`);
      return null;
    }

    if (!searchData.places || searchData.places.length === 0) {
      console.log(`  No results found for ${businessName}`);
      return null;
    }

    const place = searchData.places[0];
    const placeId = place.name; // In new API, name is the place ID (e.g., "places/ChIJK...")
    console.log(`  Found place: ${place.displayName.text}`);

    // STEP 2: Get detailed reviews using new API
    const detailsResponse = await fetch(
      `https://places.googleapis.com/v1/${placeId}?key=${GOOGLE_PLACES_API_KEY}`,
      {
        headers: {
          'X-Goog-FieldMask': 'displayName,rating,userRatingCount,reviews'
        }
      }
    );

    if (!detailsResponse.ok) {
      throw new Error(`Google Places details failed: ${detailsResponse.status}`);
    }

    const placeDetails = await detailsResponse.json();

    console.log(`  Rating: ${placeDetails.rating}★ (${placeDetails.userRatingCount} reviews)`);

    return {
      name: placeDetails.displayName?.text || place.displayName.text,
      rating: placeDetails.rating || 0,
      reviewCount: placeDetails.userRatingCount || 0,
      reviews: placeDetails.reviews || [],
      source: 'google_places'
    };
  } catch (error) {
    console.error('❌ Google Places API error:', error.message);
    return null;
  }
}

/**
 * Fetch Trustpilot Reviews using public API
 */
async function fetchTrustpilotReviews(businessName, city) {
  if (!TRUSTPILOT_API_KEY) {
    console.log('⚠️ Trustpilot API key not configured');
    return null;
  }

  try {
    console.log(`🔍 Searching Trustpilot for "${businessName}" in ${city}`);

    // Search for the business on Trustpilot
    const searchParams = new URLSearchParams({
      query: `${businessName} ${city}`,
      locale: 'en-US'
    });

    const searchResponse = await fetch(
      `${TRUSTPILOT_API_URL}/search/businesses?${searchParams}`,
      {
        headers: {
          'Authorization': `Bearer ${TRUSTPILOT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!searchResponse.ok) {
      console.log(`  Trustpilot search failed: ${searchResponse.status}`);
      return null;
    }

    const searchData = await searchResponse.json();

    if (!searchData.businesses || searchData.businesses.length === 0) {
      console.log(`  No Trustpilot results for ${businessName}`);
      return null;
    }

    const business = searchData.businesses[0];
    const businessId = business.id;

    console.log(`  Found on Trustpilot: ${business.name}`);

    // Fetch reviews for the business
    const reviewsResponse = await fetch(
      `${TRUSTPILOT_API_URL}/businesses/${businessId}/reviews?pageSize=10&sort=LATEST`,
      {
        headers: {
          'Authorization': `Bearer ${TRUSTPILOT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!reviewsResponse.ok) {
      console.log(`  Failed to fetch Trustpilot reviews: ${reviewsResponse.status}`);
      return null;
    }

    const reviewsData = await reviewsResponse.json();

    const trustpilotRating = business.stars || 0;
    const trustpilotReviewCount = business.reviewCount || 0;

    // Convert Trustpilot review format to match Google format
    const reviews = (reviewsData.reviews || []).map(review => ({
      text: review.review || review.reviewContent?.title || '',
      rating: review.rating || 0,
      author: review.consumer?.name || 'Anonymous',
      published: review.createdAt
    }));

    console.log(`  Rating: ${trustpilotRating}★ (${trustpilotReviewCount} reviews)`);

    return {
      name: business.name,
      rating: trustpilotRating,
      reviewCount: trustpilotReviewCount,
      reviews: reviews,
      source: 'trustpilot'
    };
  } catch (error) {
    console.error('❌ Trustpilot API error:', error.message);
    return null;
  }
}

/**
 * Analyze reviews sentiment using Gemini
 */
async function analyzeReviewSentiment(reviews) {
  if (!reviews || reviews.length === 0 || !geminiClient) {
    return null;
  }

  // Extract review text from various possible structures
  const reviewsWithText = reviews
    .map(r => {
      // Google Places API returns review with .text field
      let text = '';
      if (typeof r === 'string') {
        text = r;
      } else if (r.text && typeof r.text === 'string') {
        text = r.text;
      } else if (r.originalText && typeof r.originalText === 'string') {
        text = r.originalText;
      } else if (typeof r === 'object' && Object.keys(r).length > 0) {
        // Try to find any text-like field
        const textField = Object.values(r).find(v => typeof v === 'string' && v.length > 20);
        text = textField || '';
      }
      return {
        text: text.trim(),
        rating: r.rating || 5
      };
    })
    .filter(r => r.text && r.text.length > 0)
    .slice(0, 10); // Limit to 10 reviews for API efficiency

  if (reviewsWithText.length === 0) {
    console.log(`⚠️ No review text available for sentiment analysis`);
    return null;
  }

  const models = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.5-flash'];

  const reviewTexts = reviewsWithText
    .map(r => `"${r.text}" (${r.rating}★)`)
    .join('\n');

  const prompt = `Analyze the sentiment of these ${reviewsWithText.length} reviews. For each, classify as POSITIVE, NEGATIVE, or NEUTRAL. Identify the top 2-3 most common issues from negative reviews.

Reviews:
${reviewTexts}

Respond with ONLY valid JSON (no markdown, no extra text):
{"sentiments": ["POSITIVE"|"NEGATIVE"|"NEUTRAL"], "top_issues": ["issue1", "issue2"], "overall_sentiment": "POSITIVE"|"NEGATIVE"|"NEUTRAL"}`;

  for (const model of models) {
    try {
      console.log(`📊 Analyzing sentiment for ${reviewsWithText.length} reviews with Gemini (${model})`);

      const response = await geminiClient.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const analysisText = response.candidates[0].content.parts[0].text;

      // Parse JSON from response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        console.log(`  Sentiment: ${analysis.overall_sentiment} (${model})`);
        if (analysis.top_issues && analysis.top_issues.length > 0) {
          console.log(`  Top issues: ${analysis.top_issues.join(', ')}`);
        }
        return analysis;
      }

      console.log(`  No JSON found in response from ${model}`);
      continue; // Try next model
    } catch (error) {
      console.log(`  ⚠️ Model ${model} failed: ${error.message}`);
      continue; // Try next model
    }
  }

  console.error('❌ All Gemini sentiment models failed');
  return null;
}

/**
 * CHECK 4: Customer Reviews - REAL DATA
 * Fetches reviews from Google Places + Trustpilot + analyzes sentiment with Gemini
 */
export async function checkReputation(businessName, city, html = '') {
  try {
    console.log(`⭐ Analyzing reputation for "${businessName}" in ${city}`);

    // STRATEGY 1: Try Google Places API first (real data)
    let googleData = await fetchGoogleReviews(businessName, city);
    let trustpilotData = null;

    // STRATEGY 2: Also try Trustpilot for enriched data
    if (TRUSTPILOT_API_KEY) {
      trustpilotData = await fetchTrustpilotReviews(businessName, city);
    }

    // STRATEGY 3: Combine or use best available data
    let finalData = null;
    let combinedSources = [];

    if (googleData && googleData.reviewCount > 0) {
      finalData = googleData;
      combinedSources.push('Google Places');
      console.log(`✅ Got Google Places data: ${googleData.rating}★ (${googleData.reviewCount} reviews)`);
    }

    if (trustpilotData && trustpilotData.reviewCount > 0) {
      if (!finalData) {
        finalData = trustpilotData;
        console.log(`✅ Got Trustpilot data: ${trustpilotData.rating}★ (${trustpilotData.reviewCount} reviews)`);
      } else {
        // If we have both, combine the data
        combinedSources.push('Trustpilot');
        console.log(`✅ Also found on Trustpilot: ${trustpilotData.rating}★ (${trustpilotData.reviewCount} reviews)`);

        // Use average rating if both sources available
        const averageRating = ((googleData.rating || 0) + (trustpilotData.rating || 0)) / 2;
        const totalReviews = (googleData.reviewCount || 0) + (trustpilotData.reviewCount || 0);

        finalData = {
          name: googleData.name || trustpilotData.name,
          rating: averageRating,
          reviewCount: totalReviews,
          reviews: [...(googleData.reviews || []), ...(trustpilotData.reviews || [])],
          source: 'google_places_trustpilot',
          sources: combinedSources
        };
      }
    }

    // If we found real data from Google or Trustpilot
    if (finalData && finalData.reviewCount > 0) {
      // Sentiment analysis with Gemini AI (enabled)
      const sentiment = await analyzeReviewSentiment(finalData.reviews);

      // Calculate score based on rating and review count
      let score = 15; // Base score

      if (finalData.rating >= 4.7) {
        score += 8;
      } else if (finalData.rating >= 4.5) {
        score += 6;
      } else if (finalData.rating >= 4.0) {
        score += 4;
      } else if (finalData.rating >= 3.5) {
        score += 2;
      }

      if (finalData.reviewCount >= 20) {
        score += 2;
      }

      score = Math.max(0, Math.min(25, score));

      let severity = 'critical';
      if (score >= 20) severity = 'good';
      else if (score >= 10) severity = 'warning';

      const sourceLabel = finalData.sources?.length > 1
        ? `${combinedSources.join(' + ')}`
        : combinedSources[0] || finalData.source;

      return {
        checkId: 'reputation',
        checkName: '⭐ Customer Reviews',
        rating: parseFloat(finalData.rating.toFixed(1)),
        reviewCount: finalData.reviewCount,
        source: sourceLabel,
        sentiment: sentiment,
        score,
        severity,
        method: 'api_integrated',
        note: `Found real reviews from ${sourceLabel}: ${finalData.rating?.toFixed(1)}★ with ${finalData.reviewCount} reviews`
      };
    }

    // STRATEGY 2: Fall back to website HTML analysis
    console.log(`⚠️ No Google Places data - analyzing website HTML`);

    let reviewCount = 0;
    let averageRating = 0;
    let foundReviewSignals = false;

    // Look for review platform badges/widgets
    const reviewPlatforms = {
      'google_reviews': /(google.*reviews?|reviews\.google|google.*rating)/gi,
      'trustpilot': /trustpilot|trustpilot\.com/gi,
      'yelp': /yelp|yelp\.com/gi,
      'facebook': /(facebook.*review|review.*facebook)/gi,
      'custom': /(customer\s+review|review\s+us|rate\s+us|5\s*star|rating|review)/gi
    };

    let platformsFound = [];
    for (const [platform, regex] of Object.entries(reviewPlatforms)) {
      if (regex.test(html)) {
        platformsFound.push(platform);
      }
    }

    // Try to extract review count from HTML
    const reviewCountPattern = /(\d+)\s*(?:customer\s+)?review[s]?/gi;
    const matches = html.match(reviewCountPattern);

    if (matches && matches.length > 0) {
      const counts = matches.map(m => {
        const num = m.match(/\d+/);
        return num ? parseInt(num[0]) : 0;
      }).filter(n => n > 0);

      if (counts.length > 0) {
        reviewCount = Math.max(...counts);
        foundReviewSignals = true;
      }
    }

    // Look for star ratings
    const ratingPatterns = [
      /(\d\.?\d?)\s*out\s+of\s*5|(\d\.?\d?)\s*\/\s*5|(\d\.?\d?)\s*star[s]?/gi,
      /★★★★★|⭐{1,5}/g,
      /rating[:\s]+(\d\.?\d?)/gi
    ];

    for (const pattern of ratingPatterns) {
      const ratingMatch = html.match(pattern);
      if (ratingMatch) {
        const numMatch = ratingMatch[0].match(/\d\.?\d?/);
        if (numMatch) {
          averageRating = parseFloat(numMatch[0]);
          if (averageRating >= 1 && averageRating <= 5) {
            foundReviewSignals = true;
            break;
          }
        }
      }
    }

    // SCORING LOGIC for HTML analysis
    let score = 10;

    if (!foundReviewSignals) {
      score = 0;
      averageRating = 4.2;
      reviewCount = 12;
    } else {
      score = 5;
      if (reviewCount > 0) {
        score += Math.min(10, Math.floor(reviewCount / 20));
      }
      if (averageRating >= 4.5) {
        score += 10;
      } else if (averageRating >= 4.0) {
        score += 7;
      } else if (averageRating >= 3.5) {
        score += 4;
      }
      if (platformsFound.length > 1) {
        score += 3;
      }
    }

    score = Math.max(0, Math.min(25, score));

    let severity = 'critical';
    if (score >= 20) severity = 'good';
    else if (score >= 10) severity = 'warning';

    return {
      checkId: 'reputation',
      checkName: '⭐ Customer Reviews',
      rating: averageRating,
      reviewCount,
      source: 'Website Analysis',
      platformsFound,
      score,
      severity,
      method: foundReviewSignals ? 'website_analysis' : 'baseline',
      note: foundReviewSignals ? `Found on website: ${platformsFound.join(', ')}` : 'No reviews detected - using baseline'
    };
  } catch (error) {
    console.error('❌ Reputation check failed:', error.message);
    return {
      checkId: 'reputation',
      checkName: '⭐ Customer Reviews',
      rating: 0,
      reviewCount: 0,
      score: 0,
      severity: 'critical',
      method: 'error',
      error: error.message
    };
  }
}

/**
 * Calculate overall score (0-100)
 */
export function calculateOverallScore(checks) {
  const scores = checks.map(c => c.score || 0);
  const totalScore = scores.reduce((a, b) => a + b, 0);

  let band = 'critical';
  if (totalScore >= 70) {
    band = 'good';
  } else if (totalScore >= 40) {
    band = 'opportunity';
  }

  return {
    overallScore: totalScore,
    band,
    checks
  };
}

/**
 * Generate narrative findings with real data + AI competitor analysis
 */
async function generateNarrativeFindings(businessName, city, checks, html) {
  if (!geminiClient) return null;

  try {
    const pixelCheck = checks[0];
    const aiCheck = checks[1];
    const reputationCheck = checks[3];

    // Prepare data summary for Gemini
    const missingPixels = pixelCheck.missing || [];
    const foundPixels = pixelCheck.found || [];
    const aiScore = aiCheck.score;
    const reviewRating = reputationCheck.rating;
    const reviewCount = reputationCheck.reviewCount;

    const prompt = `Create 4 brief, catchy findings. 1-2 sentences ONLY. Only use numbers you're certain about.

Business: ${businessName} in ${city}
- Missing pixels: ${missingPixels.join(', ')}
- AI visibility: ${aiScore}/25
- Reviews: ${reviewRating}★ (${reviewCount})

4 findings needed:
1. 📊 Tracking gap (specific missing pixels vs competitor advantage)
2. 🤖 AI search gap (why they rank lower in ChatGPT/Claude)
3. 💡 Market insight (competitor strategy or market position gap)
4. ⭐ Review power (how reviews translate to conversions)

Names 2-3 actual competitors in ${city} for this industry.

JSON format - keep insights SHORT & punchy:
[
  {"title": "📊 Title", "insight": "Brief 1-2 sentence insight with specific competitor name."},
  ...
]

NO fluff. Only mention numbers if 100% certain from data above.`;

    const response = await geminiClient.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const responseText = response.candidates[0].content.parts[0].text;
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const findings = JSON.parse(jsonMatch[0]);
      console.log(`📖 Generated ${findings.length} narrative findings`);
      return findings;
    }

    console.log(`⚠️ Could not parse narrative findings`);
    return null;
  } catch (error) {
    console.error('❌ Narrative generation failed:', error.message);
    return null;
  }
}

/**
 * MAIN FUNCTION: Run all checks with REAL data
 */
export async function runAllChecks(businessName, website, city, additionalData = {}) {
  console.log(`\n🚀 Starting scan for: ${businessName} (${website}) in ${city}\n`);

  try {
    // STEP 1: Fetch website HTML
    console.log('Step 1: Fetching website...');
    let html = '';
    let websiteValid = false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const htmlResponse = await fetch(website, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      clearTimeout(timeout);

      if (htmlResponse.ok) {
        html = await htmlResponse.text();
        websiteValid = true;
        console.log(`✅ Website fetched successfully (${html.length} characters)`);
      } else {
        console.error(`❌ Website returned status ${htmlResponse.status}`);
      }
    } catch (fetchError) {
      console.error(`❌ Failed to fetch website: ${fetchError.message}`);
    }

    // STEP 2: Run checks in parallel
    console.log('\nStep 2: Running 4 checks...');
    const [pixelCheck, frictionCheck, aiCheck, reputationCheck] = await Promise.all([
      checkPixelAudit(html),
      checkLeadFriction(html),
      checkAIVisibility(businessName, city, html),
      checkReputation(businessName, city, html)
    ]);

    // STEP 3: Calculate overall score
    console.log('\nStep 3: Calculating score...');
    const checks = [pixelCheck, aiCheck, frictionCheck, reputationCheck];
    const result = calculateOverallScore(checks);

    // STEP 4: Generate narrative findings
    console.log('\nStep 4: Generating personalized insights...');
    const findings = await generateNarrativeFindings(businessName, city, checks, html);

    console.log(`\n✅ Scan complete!`);
    console.log(`   Score: ${result.overallScore}/100 (${result.band})`);
    console.log(`   Pixels: ${pixelCheck.score}/25`);
    console.log(`   AI Visibility: ${aiCheck.score}/25`);
    console.log(`   Form: ${frictionCheck.score}/25`);
    console.log(`   Reviews: ${reputationCheck.score}/25\n`);

    return {
      businessName,
      website,
      city,
      websiteValid,
      ...result,
      findings: findings || [],
      scannedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('\n❌ SCAN ERROR:', error);
    throw error;
  }
}
