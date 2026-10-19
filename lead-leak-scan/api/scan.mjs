/**
 * POST /api/scan
 *
 * Receives scan request, runs all checks, returns results
 *
 * Request body:
 * {
 *   businessName: string,
 *   website: string,
 *   city: string,
 *   email: string,
 *   aiData?: { appearanceCount, competitorCount },
 *   reputationData?: { userRating, userReviewCount, competitors: [{name, rating, reviewCount}] }
 * }
 */

import http from 'http';
import { runAllChecks } from '../lib/mvp-checks.mjs';

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // Scan endpoint
  if (req.method === 'POST' && req.url === '/api/scan') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        // Validate required fields
        if (!data.businessName || !data.website || !data.city || !data.email) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Missing required fields' }));
          return;
        }

        // Normalize website URL
        let website = data.website;
        if (!website.startsWith('http')) {
          website = 'https://' + website;
        }

        // Run scan
        const result = await runAllChecks(
          data.businessName,
          website,
          data.city,
          {
            aiData: data.aiData,
            reputationData: data.reputationData
          }
        );

        // Add email to result
        result.email = data.email;

        // Return result
        res.writeHead(200);
        res.end(JSON.stringify(result));
      } catch (error) {
        console.error('Scan error:', error);
        res.writeHead(500);
        res.end(JSON.stringify({
          error: 'Scan failed',
          message: error.message
        }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Lead Leak Scan API running on http://localhost:${PORT}`);
});

export default server;
