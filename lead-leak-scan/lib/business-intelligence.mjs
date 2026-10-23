/**
 * Business Intelligence Module
 * Combines data from GSC, Semrush, BuiltWith to create actionable insights
 * NO REVENUE CLAIMS - pure data-driven analysis
 */

export async function gatherBusinessIntelligence(businessName, website, city, html) {
  const intelligence = {
    searchVisibility: null,
    techStack: null,
    competitorAnalysis: null,
    opportunities: []
  };

  // These will be populated in phases
  // Phase 1.5: GSC integration
  // Phase 2: Semrush + BuiltWith
  // Phase 2.5: Competitor analysis

  return intelligence;
}

export function detectTechStackFromHTML(html) {
  const techStack = {
    cms: null,
    ecommerce: null,
    analytics: [],
    marketing: [],
    missingSchemas: []
  };

  // CMS Detection
  if (html.includes('wp-content') || html.includes('wp-includes')) {
    techStack.cms = 'WordPress';
  } else if (html.includes('Shopify.theme')) {
    techStack.cms = 'Shopify';
  } else if (html.includes('__NUXT__') || html.includes('_next')) {
    techStack.cms = 'Headless (Next.js/Nuxt)';
  }

  // Analytics Detection
  if (html.includes('gtag(') || html.includes('G-')) {
    techStack.analytics.push('Google Analytics 4');
  }
  if (html.includes('mixpanel')) {
    techStack.analytics.push('Mixpanel');
  }
  if (html.includes('segment')) {
    techStack.analytics.push('Segment');
  }

  // Marketing Tools
  if (html.includes('fbq(') || html.includes('facebook.com/tr')) {
    techStack.marketing.push('Meta Pixel');
  }
  if (html.includes('gtag') && html.includes('GoogleAdsID')) {
    techStack.marketing.push('Google Ads Conversion');
  }
  if (html.includes('li_fat_id')) {
    techStack.marketing.push('LinkedIn Insight');
  }

  // Missing Schema Detection
  if (!html.includes('schema.org/Organization') && !html.includes('"@type":"Organization"')) {
    techStack.missingSchemas.push('Organization Schema');
  }
  if (!html.includes('schema.org/FAQPage') && !html.includes('"@type":"FAQPage"')) {
    techStack.missingSchemas.push('FAQ Schema (for AI search)');
  }
  if (!html.includes('schema.org/Product') && !html.includes('"@type":"Product"')) {
    techStack.missingSchemas.push('Product Schema');
  }
  if (!html.includes('schema.org/AggregateRating') && !html.includes('"@type":"AggregateRating"')) {
    techStack.missingSchemas.push('Reviews Schema');
  }

  return techStack;
}

export function generateBusinessIntelligenceFindings(intelligence, businessName, city) {
  const findings = [];

  // Tech Stack Findings
  if (intelligence.techStack) {
    const { cms, analytics, marketing, missingSchemas } = intelligence.techStack;

    if (cms) {
      findings.push({
        title: '⚙️ Tech Stack Detected',
        insight: `${businessName} runs on ${cms}. Good choice for scalability.`,
        confidence: 'high'
      });
    }

    if (missingSchemas.length > 0) {
      findings.push({
        title: '🤖 AI Search Gap - Missing Schema',
        insight: `${missingSchemas.join(', ')} not found. This prevents AI (ChatGPT, Claude) from understanding your business structure. Installing these takes 2-4 hours and significantly improves AI visibility.`,
        confidence: 'high',
        actionable: true
      });
    }

    if (analytics.length === 0) {
      findings.push({
        title: '📊 No Analytics Installed',
        insight: `${businessName} has no analytics installed. You can't measure what you can't see. Installing GA4 is critical for understanding customer behavior.`,
        confidence: 'high',
        actionable: true
      });
    }

    if (marketing.length === 0) {
      findings.push({
        title: '📢 No Marketing Pixels Detected',
        insight: `No Facebook Pixel, Google Ads, or LinkedIn tracking found. If you run paid ads, you're flying blind. If not, this is less critical.`,
        confidence: 'high',
        actionable: true
      });
    }
  }

  // Search Visibility Findings (when GSC integrated)
  if (intelligence.searchVisibility) {
    const { impressions, clicks, ctr, avgPosition, topKeywords } = intelligence.searchVisibility;

    if (avgPosition > 10) {
      findings.push({
        title: '🔍 Below Page 1 - Major Traffic Opportunity',
        insight: `${businessName} ranks outside top 10 for most keywords. Moving to page 1 (positions 1-3) could unlock significant organic traffic. This is a 4-8 week SEO project.`,
        confidence: 'high',
        actionable: true
      });
    } else if (avgPosition > 5) {
      findings.push({
        title: '📈 Ranking Opportunity - Page 1, Lower Positions',
        insight: `Currently on page 1 but positions 6-10. Moving to top 3 could double traffic. Requires on-page SEO + content strategy.`,
        confidence: 'high',
        actionable: true
      });
    }

    if (ctr < 2) {
      findings.push({
        title: '💬 CTR Below Average',
        insight: `Only ${ctr}% of searchers click your result. Industry average is 3-5%. Your title/description aren't compelling. Fixing this takes 1-2 hours and is a quick win.`,
        confidence: 'high',
        actionable: true
      });
    }

    if (impressions > 1000 && clicks < 20) {
      findings.push({
        title: '⚠️ High Impressions, Low Clicks',
        insight: `${businessName} appears in search results ${impressions} times monthly but only gets ${clicks} clicks. Your title/description are underperforming. This is easily fixable.`,
        confidence: 'high',
        actionable: true
      });
    }
  }

  // Competitor Analysis Findings (when available)
  if (intelligence.competitorAnalysis && intelligence.competitorAnalysis.length > 0) {
    const topCompetitor = intelligence.competitorAnalysis[0];
    findings.push({
      title: '🏆 Competitive Landscape',
      insight: `Top competitor (${topCompetitor.name}) ranks #${topCompetitor.position} vs. your #${intelligence.searchVisibility?.avgPosition || 'unknown'}. They get ~${topCompetitor.estimatedTraffic}/month vs. your estimated ${intelligence.searchVisibility?.estimatedTraffic || 'low'} monthly searches. The gap is closeable in 8-12 weeks.`,
      confidence: 'medium',
      actionable: true
    });
  }

  return findings;
}

// Placeholder for GSC integration (Phase 1.5)
export async function fetchGoogleSearchConsoleData(website, userOAuth) {
  // TODO: Implement GSC OAuth flow
  // This will fetch real impression, click, and ranking data
  return null;
}

// Placeholder for Semrush integration (Phase 2)
export async function fetchSemrushData(domain) {
  // TODO: Integrate Semrush free API
  // https://api.semrush.com/json/
  // Requires API key (we can use our own or user's)
  return null;
}

// Placeholder for BuiltWith integration (Phase 2)
export async function fetchBuiltWithData(domain) {
  // TODO: Integrate BuiltWith API
  // https://api.builtwith.com/v22/api.json?url=domain&key=apikey
  // Get tech stack, CMS, plugins
  return null;
}

// Placeholder for Competitor Analysis (Phase 2.5)
export async function analyzeCompetitors(businessName, city, topKeywords) {
  // TODO: Find competitors from GSC top keywords
  // Analyze their rankings, traffic, backlinks
  return null;
}
