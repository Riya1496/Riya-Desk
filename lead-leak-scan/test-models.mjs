import fs from 'fs';
import crypto from 'crypto';

const key = JSON.parse(fs.readFileSync('./service-account-key.json'));

// Create JWT
const now = Math.floor(Date.now() / 1000);
const header = { alg: 'RS256', typ: 'JWT' };
const payload = {
  iss: key.client_email,
  sub: key.client_email,
  scope: 'https://www.googleapis.com/auth/generative-language',
  aud: key.token_uri,
  iat: now,
  exp: now + 3600
};

const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
const signature = crypto.createSign('RSA-SHA256').update(encodedHeader + '.' + encodedPayload).sign(key.private_key, 'base64url');
const jwt = encodedHeader + '.' + encodedPayload + '.' + signature;

// Get access token
const tokenResp = await fetch(key.token_uri, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + jwt
});

const tokenData = await tokenResp.json();
console.log('✓ Got access token\n');

// List available models
const modelsResp = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
  headers: { 'Authorization': 'Bearer ' + tokenData.access_token }
});

const data = await modelsResp.json();
console.log('Available models:');
if (data.models) {
  data.models.forEach(m => console.log('  -', m.name));
} else {
  console.log(JSON.stringify(data, null, 2));
}
