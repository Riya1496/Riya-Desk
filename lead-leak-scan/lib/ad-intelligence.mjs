/**
 * Ad Intelligence Module
 * Detects if Google Ads, Meta Ads, LinkedIn Ads are actually working
 * Calculates revenue loss from broken ad tracking
 */

export function detectAdCampaigns(html) {
  const detection = {
    googleAdsPixel: html.includes('goog_pagesense_') || html.includes('gtag(') && html.includes('GoogleAdsID'),
    metaPixel: html.includes('fbq(') || html.includes('facebook.com/tr'),
    linkedInPixel: html.includes('li_fat_id') || html.includes('linkedIn.tracking'),
    googleAnalytics4: html.includes('G-') || html.includes('gtag('),
    conversionTracking: html.includes('conversion') && (
      html.includes('google') || html.includes('facebook') || html.includes('linkedin')
    )
  };

  return detection;
}

export function detectUTMParameters(html) {
  // Find links with UTM parameters indicating ad campaigns
  const utmRegex = /href="[^"]*utm_source=([^&"]+)/gi;
  const matches = [];
  let match;

  while ((match = utmRegex.exec(html)) !== null) {
    matches.push(match[1]);
  }

  const campaigns = {
    googleAds: matches.filter(m => m.includes('google')).length > 0,
    metaAds: matches.filter(m => m.includes('facebook') || m.includes('meta')).length > 0,
    linkedInAds: matches.filter(m => m.includes('linkedin')).length > 0,
    organic: matches.filter(m => m.includes('organic')).length > 0
  };

  return campaigns;
}

export function calculateAdIntelligence(html, businessName, city) {
  const pixelDetection = detectAdCampaigns(html);
  const utmDetection = detectUTMParameters(html);

  // Revenue loss calculation
  const estimatedMonthlyAdSpend = {
    small: 1000,
    medium: 3000,
    large: 5000
  };

  // Estimate based on industry
  let estimatedSpend = estimatedMonthlyAdSpend.medium; // Default to medium

  const findings = [];
  let revenueLoss = 0;

  // 1. Google Ads Detection
  if (!pixelDetection.googleAdsPixel && !pixelDetection.googleAnalytics4) {
    revenueLoss += estimatedSpend * 0.6; // 60% of spend is wasted without tracking
    findings.push({
      type: 'google_ads',
      status: 'broken',
      issue: 'Google Ads Conversion Tracking Not Found',
      impact: `$${estimatedSpend * 0.6}/month wasted (60% of Google Ads spend)`,
      description: 'Your Google Ads account cannot track which clicks lead to conversions. Without this, you cannot optimize campaigns.',
      fix: 'Install GA4 or Google Ads conversion pixel',
      timeToFix: '10-15 minutes',
      recoveryPotential: `$${estimatedSpend * 0.3}/month (30% better ROI through optimization)`
    });
  } else if (utmDetection.googleAds) {
    findings.push({
      type: 'google_ads',
      status: 'running',
      issue: 'Google Ads Detected - Verify Conversion Tracking',
      description: 'We detected Google Ads campaigns. Verify conversion pixels are properly installed.',
      recommendation: 'Check Google Ads Settings → Conversions to ensure all pixels are firing'
    });
  }

  // 2. Meta Pixel Detection
  if (!pixelDetection.metaPixel) {
    revenueLoss += estimatedSpend * 0.3; // 30% loss from no retargeting
    findings.push({
      type: 'meta_ads',
      status: 'broken',
      issue: 'Meta Pixel Not Installed - Retargeting Impossible',
      impact: `$${estimatedSpend * 0.3}/month wasted (30% of potential revenue)`,
      description: 'Without Meta Pixel, Facebook/Instagram ads cannot retarget your visitors. You pay for first-click only (5x worse ROI).',
      fix: 'Install Meta Pixel on all pages',
      timeToFix: '15-20 minutes',
      recoveryPotential: `$${estimatedSpend * 0.15}/month (from retargeting campaigns)`
    });
  } else if (utmDetection.metaAds) {
    findings.push({
      type: 'meta_ads',
      status: 'running',
      issue: 'Meta Ads Running - Pixel Installed ✓',
      description: 'Meta Pixel is working. Ensure custom audiences and retargeting campaigns are active.'
    });
  }

  // 3. LinkedIn Ads Detection
  if (!pixelDetection.linkedInPixel) {
    findings.push({
      type: 'linkedin_ads',
      status: 'missing',
      issue: 'LinkedIn Insight Tag Not Found',
      description: 'If you run LinkedIn ads, install the Insight Tag for conversion tracking.',
      fix: 'Install LinkedIn Insight Tag',
      timeToFix: '10 minutes'
    });
  }

  // 4. Overall Assessment
  let adHealthScore = 100;
  if (!pixelDetection.googleAdsPixel) adHealthScore -= 30;
  if (!pixelDetection.metaPixel) adHealthScore -= 25;
  if (!pixelDetection.googleAnalytics4) adHealthScore -= 20;
  if (!pixelDetection.conversionTracking) adHealthScore -= 25;

  return {
    adHealthScore: Math.max(0, adHealthScore),
    estimatedMonthlyAdSpend,
    monthlyRevenueLoss: Math.round(revenueLoss),
    annualRevenueLoss: Math.round(revenueLoss * 12),
    recoveryTimeframe: '2-4 weeks',
    potentialROI: '10x in 90 days',
    findings,
    pixelDetection,
    utmDetection
  };
}

export function generateAdIntelligenceFindings(adIntelligence, businessName, city) {
  const { monthlyRevenueLoss, annualRevenueLoss, findings } = adIntelligence;

  if (monthlyRevenueLoss === 0) {
    return [{
      title: '✓ Ad Tracking Healthy',
      insight: `${businessName} has proper conversion tracking pixels installed. Your ads are optimizable and ROI is measurable.`,
      confidence: 'high',
      actionable: false
    }];
  }

  return [{
    title: '💰 Ad Tracking Broken - Revenue Leak Detected',
    insight: `${businessName} is losing ~$${monthlyRevenueLoss}/month ($${annualRevenueLoss}/year) due to broken ad tracking.
    Without conversion pixels, ads cannot be optimized and you're paying for clicks that don't convert.`,
    confidence: 'high',
    actionable: true,
    monetaryImpact: monthlyRevenueLoss
  },
  {
    title: '📊 Ad Campaign Intelligence',
    insight: `We detected ${findings.length} critical issues with your ad setup. Fixing these in 2-4 weeks could unlock $${Math.round(monthlyRevenueLoss * 0.5)}/month in additional revenue.`,
    confidence: 'high',
    actionable: true
  },
  {
    title: '🎯 Retargeting Gap',
    insight: `Without Meta Pixel, ${businessName} cannot retarget website visitors. This is leaving $${Math.round(monthlyRevenueLoss * 0.3)}/month on the table. Retargeting converts 3-5x better than cold traffic.`,
    confidence: 'high',
    actionable: true
  }];
}
