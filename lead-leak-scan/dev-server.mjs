import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runAllChecks } from './lib/mvp-checks.mjs';
import { initAirtable } from './lib/airtable.mjs';

// Load .env file
function loadEnv() {
  try {
    const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          process.env[key.trim()] = value;
        }
      }
    });
    console.log('✓ Loaded .env file');
    if (process.env.GROQ_API_KEY) {
      console.log('✓ GROQ_API_KEY found');
    }
  } catch (e) {
    console.log('⚠ .env file not found (optional)');
  }
}

loadEnv();
const airtable = initAirtable();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Options request
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API endpoints
  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/scan') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        // Validate
        if (!data.businessName || !data.website || !data.city || !data.email) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing required fields' }));
          return;
        }

        // Normalize URL
        let website = data.website;
        if (!website.startsWith('http')) {
          website = 'https://' + website;
        }

        // Run scan
        console.log(`Scanning: ${data.businessName} (${website})`);
        const result = await runAllChecks(
          data.businessName,
          website,
          data.city,
          {
            aiData: data.aiData,
            reputationData: data.reputationData
          }
        );

        result.email = data.email;

        // Save lead to Airtable (optional, continues without it)
        if (airtable) {
          await airtable.createLead({
            businessName: data.businessName,
            website: website,
            city: data.city,
            email: data.email,
            score: result.overallScore,
            band: result.band
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        console.error('Scan error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Scan failed',
          message: error.message
        }));
      }
    });
    return;
  }

  // Static files
  let filePath = req.url;
  if (filePath === '/') {
    filePath = '/index.html';
  }

  const fullPath = path.join(PUBLIC_DIR, filePath);

  // Security: prevent directory traversal
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }

  // Check if file exists
  try {
    const stat = fs.statSync(fullPath);

    if (!stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    // Determine content type
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });

    const fileContent = fs.readFileSync(fullPath);
    res.end(fileContent);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    } else {
      console.error('Error reading file:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════════════╗
  ║          Lead Leak Scan - Dev Server                   ║
  ╚════════════════════════════════════════════════════════╝

  🌐 Frontend:  http://localhost:${PORT}
  📊 API:       http://localhost:${PORT}/api/scan
  🏥 Health:    http://localhost:${PORT}/api/health

  Test it:
  1. Open http://localhost:${PORT} in your browser
  2. Fill the form and submit
  3. View results

  Quit: Press Ctrl+C
  `);
});

process.on('SIGINT', () => {
  console.log('\n✋ Shutting down...');
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});
