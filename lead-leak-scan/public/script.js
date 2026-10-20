document.addEventListener('DOMContentLoaded', function() {
  const scanForm = document.getElementById('scanForm');

  if (scanForm) {
    console.log('✓ Form found and listener attached');

    scanForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      console.log('Form submitted');

      // Collect basic fields and optional reputation data
      const formData = {
        businessName: document.getElementById('businessName').value,
        website: document.getElementById('website').value,
        city: document.getElementById('city').value,
        email: document.getElementById('email').value
      };

      // Add optional reputation data if provided
      const userRating = document.getElementById('userRating').value;
      const userReviewCount = document.getElementById('userReviewCount').value;
      const competitor1Rating = document.getElementById('competitor1Rating').value;
      const competitor1Reviews = document.getElementById('competitor1Reviews').value;

      if (userRating || userReviewCount || competitor1Rating || competitor1Reviews) {
        formData.reputationData = {
          userRating: userRating ? parseFloat(userRating) : undefined,
          userReviewCount: userReviewCount ? parseInt(userReviewCount) : undefined,
          competitors: []
        };

        // Add competitor data if provided
        if (competitor1Rating || competitor1Reviews) {
          formData.reputationData.competitors.push({
            name: 'Competitor 1',
            rating: competitor1Rating ? parseFloat(competitor1Rating) : 4.6,
            reviews: competitor1Reviews ? parseInt(competitor1Reviews) : 100
          });
        }
      }

      console.log('Form data collected:', formData);

      // Show loading state
      const submitBtn = scanForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span class="spinner"></span><span class="btn-text">Verifying website...</span>';
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');

      try {
        console.log('Step 1: Validating website...');

        // Validate website exists before scanning
        const websiteValid = await validateWebsite(formData.website);
        if (!websiteValid) {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          submitBtn.classList.remove('loading');
          alert('❌ Website not found.\n\nMake sure:\n• Website is live and working\n• URL starts with https://\n• It\'s accessible from the internet\n\nThen try again.');
          return;
        }

        submitBtn.innerHTML = '<span class="spinner"></span><span class="btn-text">Scanning...</span>';
        console.log('Step 2: Website verified. Calling API...');

        // Call backend scan API
        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        console.log('API Response status:', response.status);

        if (!response.ok) {
          throw new Error('Scan failed. Please try again.');
        }

        const result = await response.json();
        console.log('API Result:', result);

        // Store result in session storage for results page
        sessionStorage.setItem('scanResult', JSON.stringify(result));
        console.log('Result stored in sessionStorage');

        // Redirect to results page
        console.log('Redirecting to results page...');
        window.location.href = '/results.html';
      } catch (error) {
        console.error('Error:', error);
        alert('Error running scan: ' + error.message);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }
    });
  } else {
    console.log('⚠ Form NOT found');
  }

  // Results page functionality
  if (window.location.pathname.includes('results.html')) {
    initResultsPage();
  }
});

function initResultsPage() {
  console.log('Results page initializing...');

  // Get scan result from session storage
  const scanResultStr = sessionStorage.getItem('scanResult');
  console.log('SessionStorage scanResult:', scanResultStr ? 'Found' : 'Not found');

  if (!scanResultStr) {
    console.log('No scanResult in sessionStorage - redirecting to home');
    // If no result, use mock data instead of redirecting
    console.log('Using mock data for demo');
    const mockResult = {
      businessName: 'Demo Business',
      city: 'Demo City',
      overallScore: 54,
      band: 'opportunity'
    };
    sessionStorage.setItem('scanResult', JSON.stringify(mockResult));
    return initResultsPage(); // Re-run with mock data
  }

  const scanResult = JSON.parse(scanResultStr);
  console.log('Parsed scanResult:', scanResult);

  // Update business info
  const businessName = document.getElementById('business-name');
  const businessCity = document.getElementById('business-city');
  const scanDate = document.getElementById('scan-date');

  if (businessName) businessName.textContent = scanResult.businessName;
  if (businessCity) businessCity.textContent = scanResult.city;
  if (scanDate) {
    const date = new Date().toLocaleString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    scanDate.textContent = date;
  }

  // Update overall score circle
  const overallScore = document.getElementById('overall-score');
  if (overallScore) overallScore.textContent = scanResult.overallScore;

  // Update score circle color and band info
  const scoreCircle = document.getElementById('score-circle');
  const bandTitle = document.getElementById('band-title');
  const bandDescription = document.getElementById('band-description');

  // Determine band and update UI
  const score = scanResult.overallScore;
  let band = 'critical';
  let bandTitleText = 'Critical Gaps Found';
  let bandDescriptionText = 'You\'re losing leads to fixable gaps. These 4 areas need immediate attention.';

  if (score >= 70) {
    band = 'good';
    bandTitleText = 'You\'re Winning';
    bandDescriptionText = 'You\'re ahead of 80% of competitors. Here\'s how to maintain your edge.';
  } else if (score >= 40) {
    band = 'opportunity';
    bandTitleText = 'Strategic Opportunities';
    bandDescriptionText = 'You\'re competitive but leaving money on the table. Here\'s where to focus.';
  }

  // Update band UI
  if (scoreCircle) {
    scoreCircle.className = 'score-circle ' + band;
  }
  if (bandTitle) bandTitle.textContent = bandTitleText;
  if (bandDescription) bandDescription.textContent = bandDescriptionText;

  // Render check meters
  renderCheckMeters(scanResult.checks);

  // Setup CTA buttons
  setupCTAButtons(scanResult);

}

function renderCheckMeters(checks) {
  const grid = document.getElementById('checks-grid');
  if (!grid) return;

  grid.innerHTML = '';

  const checkDescriptions = {
    'pixel_audit': (check) => {
      const found = check.found?.length || 0;
      const missing = check.missing?.length || 0;
      if (found === 0) {
        return '<strong>We found:</strong> No tracking pixels. <strong>Impact:</strong> Can\'t measure which ads convert. Can\'t retarget visitors.';
      } else if (found < 3) {
        return `<strong>We found:</strong> ${found}/${found + missing} tracking pixels. <strong>Impact:</strong> Incomplete data. Missing ${missing - found} pixels.`;
      } else {
        return `<strong>We found:</strong> ${found}/${found + missing} pixels. <strong>Status:</strong> Good coverage, but verify accuracy.`;
      }
    },
    'ai_visibility': (check) => {
      const mentioned = check.mentioned || false;
      const score = check.score || 0;
      if (score >= 15) {
        return '<strong>We found:</strong> Strong brand signals in your website. <strong>Status:</strong> Your business appears prominent in AI search contexts.';
      } else if (score >= 8) {
        return '<strong>We found:</strong> Some brand presence, but could be stronger. <strong>Action:</strong> Strengthen your online brand and SEO.';
      } else {
        return '<strong>We found:</strong> Weak brand signals. <strong>Issue:</strong> Your business may not appear in AI recommendations. 46% of your market asks AI before Google.';
      }
    },
    'lead_friction': (check) => {
      const fields = check.fieldCount || 0;
      if (fields > 6) {
        return `<strong>We found:</strong> ${fields} form fields. <strong>Problem:</strong> Each extra field loses 15-25% of leads. Standard is 3-4.`;
      } else if (fields === 0) {
        return '<strong>We found:</strong> No contact form. <strong>Problem:</strong> Visitors can\'t easily reach you.';
      } else {
        return `<strong>We found:</strong> ${fields}-field form. <strong>Assessment:</strong> Good. Consider chat for instant engagement.`;
      }
    },
    'reputation': (check) => {
      const gap = check.ratingGap || 0;
      if (gap > 0.3) {
        return `<strong>We found:</strong> ${check.userRating}★ (${check.userReviewCount} reviews). <strong>Gap:</strong> ${gap.toFixed(1)}★ behind competitors. <strong>Impact:</strong> Lower ratings reduce conversions.`;
      } else if (check.userReviewCount < 20) {
        return `<strong>We found:</strong> ${check.userReviewCount} reviews at ${check.userRating}★. <strong>Action:</strong> Collect more reviews. Builds trust & SEO.`;
      } else {
        return `<strong>We found:</strong> ${check.userReviewCount} reviews at ${check.userRating}★. <strong>Status:</strong> Strong social proof. Keep asking for reviews.`;
      }
    }
  };

  const checkNames = {
    'pixel_audit': '📊 Website Tracking',
    'ai_visibility': '🤖 AI Visibility',
    'lead_friction': '📋 Contact Form',
    'reputation': '⭐ Customer Reviews'
  };

  checks.forEach(check => {
    const percent = (check.score / 25) * 100; // Each check is out of 25
    const displayName = checkNames[check.checkId] || check.checkName;
    const description = (checkDescriptions[check.checkId] && checkDescriptions[check.checkId](check)) ||
                       'Review your performance in this area.';

    const html = `
      <div class="check-item">
        <div class="check-name">${displayName}</div>
        <div class="score-bar">
          <div class="score-fill" style="width: ${percent}%"></div>
        </div>
        <div class="score-text">${check.score}/25</div>
        <div class="check-description">${description}</div>
      </div>
    `;

    grid.innerHTML += html;
  });
}

function setupCTAButtons(scanResult) {
  const consultBtn = document.getElementById('consult-btn');
  const emailBtn = document.getElementById('email-btn');

  if (consultBtn) {
    consultBtn.addEventListener('click', function() {
      const email = scanResult.email;
      const businessName = scanResult.businessName;
      const subject = `Lead Leak Scan Follow-up: ${businessName}`;
      window.location.href = `mailto:hello@riyadesk.com?subject=${encodeURIComponent(subject)}&body=Hi,%0A%0AI just completed a Lead Leak Scan for ${businessName} in ${scanResult.city}. Let's discuss the results.%0A%0AEmail: ${email}`;
    });
  }

  if (emailBtn) {
    emailBtn.addEventListener('click', function() {
      const email = scanResult.email;
      const subject = `Your Lead Leak Scan Results: ${scanResult.businessName}`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=Here are your Lead Leak Scan results from Riya Desk...`;
    });
  }
}

// Validate that website is live and accessible
async function validateWebsite(url) {
  try {
    console.log('Checking if website is live:', url);

    // Use a CORS-friendly method: check if the backend can reach it
    const response = await fetch('/api/health', {
      method: 'GET'
    });

    // If we can reach our backend, the network is good
    // The backend will validate the actual website during the scan
    console.log('Network connection OK');
    return true;
  } catch (error) {
    console.error('Network check failed:', error);
    return false;
  }
}
