// Custom confirmation modal
function showConfirmationModal(businessName, website, city) {
  return new Promise((resolve) => {
    // Create modal HTML
    const modalHTML = `
      <div id="confirmation-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000;">
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
          <h3 style="margin-top: 0; color: #1976d2; font-size: 18px;">✓ Website Verified!</h3>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 14px; line-height: 1.6;">
            <div><strong>Business:</strong> ${businessName}</div>
            <div><strong>Website:</strong> ${website}</div>
            <div><strong>City:</strong> ${city}</div>
          </div>
          <p style="color: #666; font-size: 14px; margin: 15px 0;">Is this the correct business? Click "Continue Scan" to proceed.</p>
          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button id="cancel-btn" style="flex: 1; padding: 10px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: 600;">Cancel</button>
            <button id="confirm-btn" style="flex: 1; padding: 10px; background: #1976d2; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Continue Scan</button>
          </div>
        </div>
      </div>
    `;

    // Append modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('confirmation-modal');
    const confirmBtn = document.getElementById('confirm-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    confirmBtn.addEventListener('click', () => {
      modal.remove();
      resolve(true);
    });

    cancelBtn.addEventListener('click', () => {
      modal.remove();
      resolve(false);
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // Check if we have results to display
  const scanResultStr = sessionStorage.getItem('scanResult');

  // Show results if they exist, otherwise show form
  if (scanResultStr && window.location.pathname !== '/results.html') {
    try {
      const scanResult = JSON.parse(scanResultStr);
      if (scanResult && scanResult.businessName) {
        console.log('Found results in sessionStorage, initializing results page');
        initResultsPage();
        return;
      }
    } catch (e) {
      console.error('Error parsing scanResult:', e);
    }
  }

  // Setup business name autocomplete
  setupBusinessAutocomplete();

  const scanForm = document.getElementById('scanForm');

  if (scanForm) {
    console.log('✓ Form found and listener attached');

    scanForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      console.log('Form submitted');

      // Normalize website URL
      let website = document.getElementById('website').value.trim();
      if (!website.startsWith('http')) {
        website = 'https://' + website.replace(/^www\./, '');
      }

      // Collect form fields
      const formData = {
        businessName: document.getElementById('businessName').value,
        website: website,
        city: document.getElementById('city').value,
        email: document.getElementById('email').value,
        businessType: document.getElementById('businessType').value || 'other'
      };

      console.log('Form data collected:', formData);

      // Show loading state
      const submitBtn = scanForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span class="spinner"></span><span class="btn-text">🔍 Verifying your website...</span>';
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

        console.log('Step 2: Website verified. Checking for similar business names in', formData.city);

        // Show custom confirmation modal
        const confirmScan = await showConfirmationModal(formData.businessName, formData.website, formData.city);

        if (!confirmScan) {
          console.log('User cancelled scan confirmation');
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          submitBtn.classList.remove('loading');
          return;
        }

        submitBtn.innerHTML = '<span class="spinner"></span><span class="btn-text">🔎 Detecting your gaps...</span>';
        console.log('Step 3: User confirmed. Calling API...');

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

        // Show results page
        console.log('Showing results page...');
        initResultsPage();
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
    console.log('No scanResult in sessionStorage - using demo');
    const mockResult = {
      businessName: 'Demo Business',
      city: 'Demo City',
      overallScore: 54,
      band: 'opportunity'
    };
    sessionStorage.setItem('scanResult', JSON.stringify(mockResult));
    return initResultsPage();
  }

  const scanResult = JSON.parse(scanResultStr);
  console.log('Parsed scanResult:', scanResult);

  // HIDE FORM, SHOW RESULTS
  const heroSection = document.querySelector('.hero');
  const resultsSection = document.getElementById('results-section');
  const checksSection = document.querySelector('.checks-section');
  const howItWorks = document.querySelector('.how-it-works');
  const faqSection = document.querySelector('.faq-section');

  if (heroSection) heroSection.style.display = 'none';
  if (checksSection) checksSection.style.display = 'none';
  if (howItWorks) howItWorks.style.display = 'none';
  if (faqSection) faqSection.style.display = 'none';
  if (resultsSection) resultsSection.style.display = 'block';

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
  const bandLabel = document.getElementById('band-label');
  if (overallScore) overallScore.textContent = scanResult.overallScore;

  // Update score circle color and band info
  const scoreCircle = document.getElementById('score-circle');

  // Determine band and update UI
  const score = scanResult.overallScore;
  let band = 'critical';
  let bandLabelText = 'Critical';

  if (score >= 70) {
    band = 'good';
    bandLabelText = 'Excellent';
  } else if (score >= 40) {
    band = 'opportunity';
    bandLabelText = 'Opportunity';
  }

  // Update band UI
  if (scoreCircle) scoreCircle.className = 'score-circle ' + band;
  if (bandLabel) bandLabel.textContent = bandLabelText;

  // Render score breakdown
  renderScoreBreakdown(scanResult);

  // Render business intelligence (data-driven insights)
  renderBusinessIntelligence(scanResult);

  // Render narrative findings
  renderFindings(scanResult);

}

function renderScoreBreakdown(checks) {
  const container = document.getElementById('score-breakdown');
  if (!container) return;

  const checkNames = {
    'pixel_audit': '📊 Website Tracking',
    'ai_visibility': '🤖 AI Visibility',
    'lead_friction': '📋 Contact Form',
    'reputation': '⭐ Customer Reviews'
  };

  let html = `
    <h4>📊 How Your Score Breaks Down</h4>
    <p style="margin: 0 0 10px 0; font-size: 12px; color: #666;">Each area is scored out of 25 points. Here's where you stand:</p>
  `;

  checks.forEach(check => {
    const name = checkNames[check.checkId] || check.checkName;
    html += `
      <div class="score-breakdown-item">
        <span>${name}</span>
        <strong>${check.score}/25</strong>
      </div>
    `;
  });

  const total = checks.reduce((sum, c) => sum + (c.score || 0), 0);
  html += `
    <div class="score-breakdown-item" style="border-top: 2px solid #0066cc; padding-top: 10px; margin-top: 10px; font-weight: bold;">
      <span>Total Score</span>
      <strong>${total}/100</strong>
    </div>
  `;

  container.innerHTML = html;
}

function renderCheckMeters(checks, findings) {
  const grid = document.getElementById('checks-grid');
  if (!grid) return;

  grid.innerHTML = '';

  // If narrative findings are available, display those instead
  if (findings && findings.length > 0) {
    findings.forEach((finding, index) => {
      const html = `
        <div class="narrative-finding">
          <div class="finding-number">${index + 1}</div>
          <div class="finding-title">${finding.title || 'Finding'}</div>
          <div class="finding-text">${finding.insight || ''}</div>
        </div>
      `;
      grid.innerHTML += html;
    });
    return;
  }

  // Fallback to traditional check meters if no findings
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
      const rating = check.rating || check.averageRating || 0;
      const reviewCount = check.reviewCount || 0;
      const source = check.source || 'Unknown';
      const sentiment = check.sentiment;

      // Display sentiment analysis if available
      let sentimentText = '';
      if (sentiment && sentiment.overall_sentiment) {
        const positiveCount = sentiment.sentiments ? sentiment.sentiments.filter(s => s === 'POSITIVE').length : 0;
        const negativeCount = sentiment.sentiments ? sentiment.sentiments.filter(s => s === 'NEGATIVE').length : 0;

        if (negativeCount > 0 && sentiment.top_issues) {
          sentimentText = ` <strong>Issues:</strong> ${sentiment.top_issues.slice(0, 2).join(', ')}.`;
        }
      }

      // Handle different data sources
      if (check.method === 'api_integrated' || check.method === 'google_places_api') {
        if (rating >= 4.5) {
          return `<strong>We found:</strong> ${rating}★ (${reviewCount} reviews from ${source}). <strong>Status:</strong> Excellent reputation. Keep asking for reviews.${sentimentText}`;
        } else if (rating >= 4.0) {
          return `<strong>We found:</strong> ${rating}★ (${reviewCount} reviews from ${source}). <strong>Status:</strong> Good reputation. Focus on the few concerns mentioned.${sentimentText}`;
        } else {
          return `<strong>We found:</strong> ${rating}★ (${reviewCount} reviews from ${source}). <strong>Problem:</strong> Low rating hurts conversions. <strong>Action:</strong> Address customer concerns immediately.${sentimentText}`;
        }
      } else if (check.method === 'baseline') {
        return '<strong>We found:</strong> No reviews detected on your website. <strong>Problem:</strong> Missing social proof. <strong>Action:</strong> Add Google Reviews widget or collect customer testimonials. Reviews increase conversions by 30%.';
      } else if (reviewCount === 0) {
        return `<strong>We found:</strong> Review system (${source}) but no reviews yet. <strong>Action:</strong> Actively collect reviews from customers. Start with 5-10 to build momentum.`;
      } else if (rating < 4.0) {
        return `<strong>We found:</strong> ${reviewCount} reviews at ${rating}★ (from ${source}). <strong>Problem:</strong> Rating below 4.0 hurts conversions. <strong>Action:</strong> Improve service + address negative reviews.`;
      } else {
        return `<strong>We found:</strong> ${reviewCount} reviews at ${rating}★ (from ${source}). <strong>Status:</strong> Strong social proof. Keep asking for reviews.`;
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
    const response = await fetch('/api/health', { method: 'GET' });
    console.log('Network connection OK');
    return true;
  } catch (error) {
    console.error('Network check failed:', error);
    return false;
  }
}

// Render score breakdown
function renderScoreBreakdown(scanResult) {
  const container = document.getElementById('score-breakdown-items');
  if (!container) return;

  const checks = scanResult.checks || [];
  let html = '';

  checks.forEach(check => {
    const score = check.score || 0;
    html += `
      <div class="score-breakdown-item">
        <strong>${check.checkName || check.checkId}</strong>
        <strong>${score}/25</strong>
      </div>
    `;
  });

  container.innerHTML = html;

  // Update total score
  const totalDisplay = document.getElementById('total-score-display');
  if (totalDisplay) {
    totalDisplay.textContent = `${scanResult.overallScore}/100`;
  }
}

// Render business intelligence findings (DATA-DRIVEN)
function renderBusinessIntelligence(scanResult) {
  const container = document.getElementById('business-intelligence-container');
  if (!container) return;

  const findings = scanResult.businessIntelligenceFindings || [];
  const techStack = scanResult.businessIntelligence?.techStack;

  let html = '';

  // Tech Stack Summary
  if (techStack) {
    html += `
      <div style="background: white; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
        <strong>⚙️ Your Tech Stack:</strong><br>
        <div style="font-size: 13px; color: #555; margin-top: 8px; line-height: 1.6;">
    `;

    if (techStack.cms) {
      html += `<div>• CMS: <strong>${techStack.cms}</strong></div>`;
    }

    if (techStack.analytics.length > 0) {
      html += `<div>• Analytics: <strong>${techStack.analytics.join(', ')}</strong></div>`;
    } else {
      html += `<div>• Analytics: <strong style="color: #d32f2f;">⚠️ None detected</strong></div>`;
    }

    if (techStack.marketing.length > 0) {
      html += `<div>• Marketing: <strong>${techStack.marketing.join(', ')}</strong></div>`;
    } else {
      html += `<div>• Marketing: <strong style="color: #d32f2f;">⚠️ No pixels detected</strong></div>`;
    }

    if (techStack.missingSchemas.length > 0) {
      html += `<div style="color: #d32f2f; margin-top: 8px;">⚠️ Missing: ${techStack.missingSchemas.join(', ')}</div>`;
    }

    html += `</div></div>`;
  }

  // Findings
  if (findings.length > 0) {
    findings.forEach((finding, index) => {
      const bgColor = finding.actionable ? '#fff8e1' : '#f5f5f5';
      const borderColor = finding.actionable ? '#ff9800' : '#ccc';

      html += `
        <div style="background: ${bgColor}; padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid ${borderColor};">
          <div style="font-weight: 600; color: #1976d2; margin-bottom: 5px;">${finding.title}</div>
          <div style="font-size: 13px; color: #555; line-height: 1.5;">${finding.insight}</div>
          ${finding.actionable ? '<div style="font-size: 12px; color: #ff9800; margin-top: 8px;">↳ Actionable opportunity</div>' : ''}
        </div>
      `;
    });
  }

  // Next Steps CTA
  html += `
    <div style="background: #e8f4f8; padding: 15px; border-radius: 6px; margin-top: 20px; border-left: 4px solid #0277bd; text-align: center;">
      <div style="font-size: 14px; color: #01579b; margin-bottom: 12px; line-height: 1.6;">
        <strong>Based on this analysis, we see clear opportunities for ${scanResult.businessName}.</strong><br>
        We specialize in turning data insights into growth.<br>
        <strong style="font-size: 15px;">Let's discuss how we'd approach your business.</strong>
      </div>
      <a href="mailto:hello@riyadesk.com?subject=Discuss Opportunities - ${scanResult.businessName}"
         style="display: inline-block; padding: 12px 24px; background: #0277bd; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
        📊 Schedule Free Strategy Call
      </a>
    </div>
  `;

  container.innerHTML = html;
}

// Render findings
function renderFindings(scanResult) {
  const container = document.getElementById('findings-container');
  if (!container) return;

  const findings = scanResult.findings || [];
  let html = '';

  findings.forEach((finding, index) => {
    const number = index + 1;
    html += `
      <div class="narrative-finding">
        <div class="finding-number">${number}</div>
        <div>
          <div class="finding-title">${finding.title || 'Finding ' + number}</div>
          <div class="finding-text">${finding.insight || finding.description || ''}</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Setup "New Scan" button
  const newScanBtn = document.getElementById('new-scan-btn');
  if (newScanBtn) {
    newScanBtn.addEventListener('click', function() {
      // Clear session storage and show form
      sessionStorage.removeItem('scanResult');
      location.reload();
    });
  }
}

// Business Name Autocomplete
function setupBusinessAutocomplete() {
  const businessInput = document.getElementById('businessName');
  const suggestionsDropdown = document.getElementById('businessSuggestions');
  const cityInput = document.getElementById('city');

  if (!businessInput) return;

  let debounceTimer;

  businessInput.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    const query = this.value.trim();

    // Hide dropdown if query is empty
    if (query.length < 2) {
      suggestionsDropdown.style.display = 'none';
      return;
    }

    // Debounce API call
    debounceTimer = setTimeout(async () => {
      try {
        const city = cityInput ? cityInput.value : '';
        const params = new URLSearchParams({ q: query, city });

        const response = await fetch(`/api/businesses?${params}`);
        const data = await response.json();

        if (!data.suggestions || data.suggestions.length === 0) {
          suggestionsDropdown.style.display = 'none';
          return;
        }

        // Build dropdown HTML
        let html = '';
        data.suggestions.forEach(suggestion => {
          html += `
            <div class="autocomplete-item" style="padding: 12px 16px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s;">
              <div style="font-weight: 500; color: #1e3a5f;">${suggestion.name}</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">${suggestion.address}</div>
            </div>
          `;
        });

        suggestionsDropdown.innerHTML = html;
        suggestionsDropdown.style.display = 'block';

        // Add click handlers
        document.querySelectorAll('.autocomplete-item').forEach((item, index) => {
          item.addEventListener('click', () => {
            const suggestion = data.suggestions[index];
            businessInput.value = suggestion.name;
            suggestionsDropdown.style.display = 'none';

            // Show "business found" indicator
            const matchIndicator = document.getElementById('businessMatch');
            const matchDetails = document.getElementById('matchDetails');
            matchDetails.textContent = suggestion.name + (suggestion.address ? ` (${suggestion.address})` : '');
            matchIndicator.style.display = 'block';

            console.log('✓ Business selected:', suggestion.name);
          });

          // Hover effect
          item.addEventListener('mouseover', function() {
            this.style.background = '#f5f5f5';
          });
          item.addEventListener('mouseout', function() {
            this.style.background = 'white';
          });
        });
      } catch (error) {
        console.error('Autocomplete error:', error);
        suggestionsDropdown.style.display = 'none';
      }
    }, 300); // 300ms debounce
  });

  // Hide dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (e.target !== businessInput) {
      suggestionsDropdown.style.display = 'none';
    }
  });

  console.log('✓ Business autocomplete initialized (optional - manual entry works too)');
}
