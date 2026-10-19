document.addEventListener('DOMContentLoaded', function() {
  const scanForm = document.getElementById('scanForm');

  if (scanForm) {
    scanForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const formData = {
        businessName: document.getElementById('businessName').value,
        website: document.getElementById('website').value,
        city: document.getElementById('city').value,
        email: document.getElementById('email').value,
        // Additional data for manual checks
        aiData: {
          appearanceCount: parseInt(document.getElementById('aiAppearance').value) || 3,
          competitorCount: 11 // Will be compared to their appearance
        },
        reputationData: {
          userRating: parseFloat(document.getElementById('yourRating').value) || 4.2,
          userReviewCount: parseInt(document.getElementById('yourReviews').value) || 12,
          competitors: [
            {
              name: 'Top Competitor',
              rating: parseFloat(document.getElementById('competitorRating').value) || 4.8,
              reviewCount: 140
            },
            {
              name: 'Second Competitor',
              rating: 4.7,
              reviewCount: 94
            }
          ]
        }
      };

      // Show loading state
      const submitBtn = scanForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Scanning...';
      submitBtn.disabled = true;

      try {
        // For MVP demo, use mock data if server not available
        let result;

        try {
          const response = await fetch('/api/scan', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
          });

          if (!response.ok) {
            throw new Error('Scan failed. Please try again.');
          }

          result = await response.json();
        } catch (fetchError) {
          console.warn('API not available, using demo data:', fetchError);
          // Use demo/mock data for MVP testing
          result = generateMockResult(formData);
        }

        // Store result in session storage for results page
        sessionStorage.setItem('scanResult', JSON.stringify(result));

        // Redirect to results page
        window.location.href = '/results.html';
      } catch (error) {
        console.error('Error:', error);
        alert('Error running scan: ' + error.message);
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // Results page functionality
  if (window.location.pathname.includes('results.html')) {
    initResultsPage();
  }
});

function initResultsPage() {
  // Get scan result from session storage
  const scanResultStr = sessionStorage.getItem('scanResult');

  if (!scanResultStr) {
    // If no result, redirect back to home
    window.location.href = '/';
    return;
  }

  const scanResult = JSON.parse(scanResultStr);

  // Update business info
  const businessInfoDiv = document.querySelector('.business-info');
  if (businessInfoDiv) {
    const scanDate = new Date().toLocaleString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    businessInfoDiv.innerHTML = `
      <strong>Business:</strong> ${scanResult.businessName} |
      <strong>Location:</strong> ${scanResult.city} |
      <strong>Scanned:</strong> ${scanDate}
    `;
  }

  // Auto-show the appropriate band based on score
  const score = scanResult.score;
  let band = 'critical';
  if (score >= 70) {
    band = 'good';
  } else if (score >= 40) {
    band = 'opportunity';
  }

  // Show the appropriate band
  showBand(band);

  // Setup CTA buttons
  const consultButtons = document.querySelectorAll('.cta-section button:first-child');
  consultButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const email = scanResult.email;
      const businessName = scanResult.businessName;
      const subject = `Lead Leak Scan Follow-up: ${businessName}`;
      window.location.href = `mailto:hello@riyadesk.com?subject=${encodeURIComponent(subject)}&body=Hi,%0A%0AI just completed a Lead Leak Scan for ${businessName} in ${scanResult.city}. Let's discuss the results.%0A%0AEmail: ${email}`;
    });
  });

  // Setup email buttons
  const emailButtons = document.querySelectorAll('.cta-section button:nth-child(2)');
  emailButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const email = scanResult.email;
      const subject = `Your Lead Leak Scan Results: ${scanResult.businessName}`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=Here are your Lead Leak Scan results...`;
    });
  });
}

function showBand(band) {
  // Hide all bands
  document.getElementById('critical-band').style.display = 'none';
  document.getElementById('opportunity-band').style.display = 'none';
  document.getElementById('good-band').style.display = 'none';

  // Show selected band
  document.getElementById(band + '-band').style.display = 'block';

  // Update button states
  document.querySelectorAll('.band-selector button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.includes(band.charAt(0).toUpperCase() + band.slice(1))) {
      btn.classList.add('active');
    }
  });
}

// Mock data for MVP testing (when API not available)
function generateMockResult(formData) {
  // Calculate AI visibility score based on user input
  const aiAppearance = formData.aiData?.appearanceCount || 3;
  const aiCompetitor = 11;
  const aiGap = aiCompetitor - aiAppearance;
  const aiScore = Math.max(0, 25 - (aiGap * 2));

  // Calculate reputation score based on user input
  const userRating = formData.reputationData?.userRating || 4.2;
  const competitorRating = formData.reputationData?.competitors?.[0]?.rating || 4.8;
  const userReviews = formData.reputationData?.userReviewCount || 12;
  const competitorReviews = formData.reputationData?.competitors?.[0]?.reviewCount || 140;
  const ratingGap = competitorRating - userRating;
  const reviewGap = competitorReviews - userReviews;
  const repScore = Math.max(0, 25 - (Math.abs(ratingGap) * 5) - (reviewGap / 50 * 2));

  // Total score: average of all checks
  const pixelScore = 4;
  const frictionScore = 6;
  const totalScore = Math.round((pixelScore + aiScore + frictionScore + repScore) / 4);

  return {
    businessName: formData.businessName,
    website: formData.website,
    city: formData.city,
    email: formData.email,
    overallScore: totalScore,
    band: totalScore < 40 ? 'critical' : totalScore < 70 ? 'opportunity' : 'good',
    scannedAt: new Date().toISOString(),
    checks: [
      {
        checkId: 'pixel_audit',
        checkName: 'Ad Pixel Audit',
        found: ['GA4'],
        missing: ['Meta Pixel', 'Google Ads', 'TikTok Pixel', 'LinkedIn', 'Hotjar', 'Mouseflow'],
        score: pixelScore,
        severity: 'critical'
      },
      {
        checkId: 'ai_visibility',
        checkName: 'AI Visibility',
        appearanceCount: aiAppearance,
        competitorCount: aiCompetitor,
        gap: aiGap,
        score: Math.round(aiScore),
        severity: aiScore > 15 ? 'good' : aiScore > 8 ? 'opportunity' : 'critical'
      },
      {
        checkId: 'lead_friction',
        checkName: 'Lead Capture Friction',
        fieldCount: 8,
        hasPhoneLink: false,
        hasScheduling: false,
        frictionScore: 50,
        score: frictionScore,
        severity: 'critical'
      },
      {
        checkId: 'reputation',
        checkName: 'Reputation & Reviews',
        userRating: userRating,
        userReviewCount: userReviews,
        competitorAvgRating: competitorRating,
        competitorAvgReviewCount: competitorReviews,
        ratingGap: Math.round((ratingGap) * 10) / 10,
        reviewGap: reviewGap,
        score: Math.round(repScore),
        severity: repScore > 15 ? 'good' : repScore > 8 ? 'opportunity' : 'critical'
      }
    ]
  };
}
