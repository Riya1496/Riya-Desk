import { runAllChecks } from '../lib/mvp-checks.mjs';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { businessName, website, city, email, aiData, reputationData, manualReviews } = req.body;

    // Validate required fields
    if (!businessName || !website || !city || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Normalize website URL
    let normalizedWebsite = website;
    if (!normalizedWebsite.startsWith('http')) {
      normalizedWebsite = 'https://' + normalizedWebsite;
    }

    console.log(`[API] Scanning: ${businessName} (${normalizedWebsite})`);

    // Run all checks
    const result = await runAllChecks(
      businessName,
      normalizedWebsite,
      city,
      {
        aiData,
        reputationData
      }
    );

    // Add email to result
    result.email = email;

    console.log(`[API] Scan complete for ${businessName}: score ${result.overallScore}`);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[API] Scan error:', error);
    return res.status(500).json({
      error: 'Scan failed',
      message: error.message
    });
  }
}
