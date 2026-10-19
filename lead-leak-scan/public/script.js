document.addEventListener('DOMContentLoaded', function() {
  const scanForm = document.getElementById('scanForm');

  if (scanForm) {
    scanForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Collect only 4 basic fields
      const formData = {
        businessName: document.getElementById('businessName').value,
        website: document.getElementById('website').value,
        city: document.getElementById('city').value,
        email: document.getElementById('email').value
      };

      // Show loading state
      const submitBtn = scanForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span class="btn-text">Scanning...</span>';
      submitBtn.disabled = true;

      try {
        // Call backend scan API
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

        const result = await response.json();

        // Store result in session storage for results page
        sessionStorage.setItem('scanResult', JSON.stringify(result));

        // Redirect to results page
        window.location.href = '/results.html';
      } catch (error) {
        console.error('Error:', error);
        alert('Error running scan: ' + error.message);
        submitBtn.innerHTML = originalText;
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
  const score = scanResult.overallScore;
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
  const criticalBand = document.getElementById('critical-band');
  const opportunityBand = document.getElementById('opportunity-band');
  const goodBand = document.getElementById('good-band');

  if (criticalBand) criticalBand.style.display = 'none';
  if (opportunityBand) opportunityBand.style.display = 'none';
  if (goodBand) goodBand.style.display = 'none';

  // Show selected band
  const selectedBand = document.getElementById(band + '-band');
  if (selectedBand) selectedBand.style.display = 'block';

  // Update button states
  document.querySelectorAll('.band-selector button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.toLowerCase().includes(band)) {
      btn.classList.add('active');
    }
  });
}
