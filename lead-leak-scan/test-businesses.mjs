/**
 * Test Harness: Debug why certain businesses score 0
 * Testing 10+ businesses with URL variations
 */

import { runAllChecks } from './lib/mvp-checks.mjs';
import fetch from 'node-fetch';

const TEST_CASES = [
  // Duplicates/Similar Names
  { name: 'Fast Printing', url: 'https://www.fastprinting.com.au', city: 'Sydney', desc: 'Main - fastprinting.com.au' },
  { name: 'Fast Printing', url: 'https://fastprinting.com.au', city: 'Sydney', desc: 'No www' },
  { name: 'FastPrinting', url: 'https://www.fastprinting.com.au', city: 'Sydney', desc: 'No space' },
  { name: 'FAST PRINTING', url: 'https://www.fastprinting.com.au', city: 'Sydney', desc: 'Uppercase' },

  // Real businesses - small
  { name: 'Joe\'s Coffee', url: 'https://joescoffee.com', city: 'Melbourne', desc: 'Small cafe' },
  { name: 'Local Plumber Sydney', url: 'https://localplumberssydney.com.au', city: 'Sydney', desc: 'Local service' },
  { name: 'Sunny Dental', url: 'https://sunnydental.com.au', city: 'Brisbane', desc: 'Medical' },

  // Real businesses - medium
  { name: 'Google Australia', url: 'https://www.google.com.au', city: 'Sydney', desc: 'Large - should have everything' },
  { name: 'Amazon AU', url: 'https://www.amazon.com.au', city: 'Sydney', desc: 'Large - tracking heavy' },
  { name: 'Westpac Banking', url: 'https://www.westpac.com.au', city: 'Sydney', desc: 'Enterprise' },

  // Edge cases
  { name: 'Example Business', url: 'https://example.com', city: 'Sydney', desc: 'Generic placeholder' },
  { name: 'Test Company', url: 'https://test.local', city: 'Sydney', desc: 'Non-TLD' },
];

async function fetchWebsite(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 5000
    });

    if (!response.ok) {
      return { html: '', status: response.status, error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    return { html, status: 200, error: null, size: html.length };
  } catch (error) {
    return { html: '', status: 0, error: error.message };
  }
}

async function runTests() {
  console.log('🔍 DIAGNOSTIC TEST: Business Data Matching\n');
  console.log('='.repeat(100));

  const results = [];

  for (const testCase of TEST_CASES) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    console.log(`   URL: ${testCase.url}`);
    console.log(`   City: ${testCase.city}`);
    console.log(`   Note: ${testCase.desc}`);
    console.log('-'.repeat(100));

    try {
      // Fetch website
      const webData = await fetchWebsite(testCase.url);
      console.log(`   Fetch Status: ${webData.status} | HTML Size: ${webData.size} bytes`);

      if (webData.error) {
        console.log(`   ⚠️ Error: ${webData.error}`);
      }

      // Run scan
      const scanResult = await runAllChecks(
        testCase.name,
        testCase.url,
        testCase.city,
        {}
      );

      console.log(`\n   RESULTS:`);
      console.log(`   ├─ Overall Score: ${scanResult.overallScore}/100 (${scanResult.band})`);

      scanResult.checks.forEach((check, idx) => {
        console.log(`   ├─ ${idx + 1}. ${check.checkName}: ${check.score}/25`);
        if (check.method) console.log(`   │  Method: ${check.method}`);
        if (check.error) console.log(`   │  ERROR: ${check.error}`);
      });

      results.push({
        name: testCase.name,
        url: testCase.url,
        score: scanResult.overallScore,
        band: scanResult.band,
        methods: scanResult.checks.map(c => c.method || 'unknown'),
        errors: scanResult.checks.filter(c => c.error).map(c => `${c.checkName}: ${c.error}`)
      });

    } catch (error) {
      console.error(`   ❌ SCAN FAILED: ${error.message}`);
      results.push({
        name: testCase.name,
        url: testCase.url,
        error: error.message
      });
    }
  }

  // Summary report
  console.log('\n' + '='.repeat(100));
  console.log('\n📊 SUMMARY REPORT:\n');

  const scoreGroups = {
    '0-10': results.filter(r => r.score !== undefined && r.score <= 10),
    '11-30': results.filter(r => r.score !== undefined && r.score > 10 && r.score <= 30),
    '31-60': results.filter(r => r.score !== undefined && r.score > 30 && r.score <= 60),
    '61-100': results.filter(r => r.score !== undefined && r.score > 60)
  };

  Object.entries(scoreGroups).forEach(([range, items]) => {
    if (items.length > 0) {
      console.log(`\n${range} (${items.length} businesses):`);
      items.forEach(item => {
        console.log(`  • ${item.name} (${item.url}) → ${item.score}/100`);
        if (item.errors.length > 0) {
          item.errors.forEach(err => console.log(`    ⚠️ ${err}`));
        }
      });
    }
  });

  // Pattern analysis
  console.log('\n\n🔎 PATTERN ANALYSIS:\n');
  const zeroScores = results.filter(r => r.score === 0);
  const lowScores = results.filter(r => r.score !== undefined && r.score > 0 && r.score < 25);

  if (zeroScores.length > 0) {
    console.log(`❌ Zero Scores (${zeroScores.length}):`);
    zeroScores.forEach(r => console.log(`   - ${r.name}: ${r.error || 'All checks returned 0'}`));
  }

  if (lowScores.length > 0) {
    console.log(`⚠️ Low Scores <25 (${lowScores.length}):`);
    lowScores.forEach(r => console.log(`   - ${r.name}: ${r.score} (methods: ${r.methods?.join(', ')})`));
  }

  console.log('\n\n💡 RECOMMENDATIONS:');
  console.log('Based on this diagnostic, fixes needed:');

  if (zeroScores.length > 0) {
    console.log('\n1. BASELINE SCORING - Already implemented');
    console.log('   → Minimum score should be ~15-20 even for minimal websites');
  }

  console.log('\n2. AUTOCOMPLETE / SEARCH - RECOMMENDED');
  console.log('   → Add business name search to prevent typos');
  console.log('   → Use Google Places API to suggest correct names');
  console.log('   → Show "Did you mean?" suggestions');

  console.log('\n3. URL NORMALIZATION - RECOMMENDED');
  console.log('   → Standardize inputs (www, capitalization, etc)');
  console.log('   → Handle internationalized domains');

  console.log('\n4. ERROR HANDLING - Check results above');
  console.log('   → Wrap Gemini API calls with better timeout handling');
  console.log('   → Add retry logic for flaky API calls');
}

// Run tests
runTests().catch(console.error);
