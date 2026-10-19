document.addEventListener('DOMContentLoaded', function() {
  const scanForm = document.getElementById('scanForm');

  if (scanForm) {
    scanForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const formData = {
        businessName: document.getElementById('businessName').value,
        website: document.getElementById('website').value,
        city: document.getElementById('city').value,
        email: document.getElementById('email').value
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
  const scores = [38, 58, 79];
  const score = scores[Math.floor(Math.random() * scores.length)];

  return {
    businessName: formData.businessName,
    website: formData.website,
    city: formData.city,
    email: formData.email,
    overallScore: score,
    band: score < 40 ? 'critical' : score < 70 ? 'opportunity' : 'good',
    scannedAt: new Date().toISOString(),
    checks: [
      {
        checkId: 'pixel_audit',
        checkName: 'Ad Pixel Audit',
        found: ['GA4'],
        missing: ['Meta Pixel', 'Google Ads', 'TikTok Pixel', 'LinkedIn', 'Hotjar', 'Mouseflow'],
        score: 4,
        severity: 'critical'
      },
      {
        checkId: 'ai_visibility',
        checkName: 'AI Visibility',
        appearanceCount: 3,
        competitorCount: 11,
        gap: 8,
        score: 8,
        severity: 'critical'
      },
      {
        checkId: 'lead_friction',
        checkName: 'Lead Capture Friction',
        fieldCount: 8,
        hasPhoneLink: false,
        hasScheduling: false,
        frictionScore: 50,
        score: 6,
        severity: 'critical'
      },
      {
        checkId: 'reputation',
        checkName: 'Reputation & Reviews',
        userRating: 4.2,
        userReviewCount: 12,
        competitorAvgRating: 4.75,
        competitorAvgReviewCount: 140,
        ratingGap: 0.55,
        reviewGap: 128,
        score: 5,
        severity: 'critical'
      }
    ]
  };
}
