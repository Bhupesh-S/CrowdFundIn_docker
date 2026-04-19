// Simple test script for CI pipeline
const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

const tests = [
  { name: 'Homepage returns 200', path: '/', expectedStatus: 200 },
  { name: 'Health check returns 200', path: '/health', expectedStatus: 200 },
  { name: 'Metrics endpoint returns 200', path: '/metrics', expectedStatus: 200 },
];

let passed = 0;
let failed = 0;

function runTest(test) {
  return new Promise((resolve) => {
    http.get(`${BASE_URL}${test.path}`, (res) => {
      if (res.statusCode === test.expectedStatus) {
        console.log(`  ✅ PASS: ${test.name}`);
        passed++;
      } else {
        console.log(`  ❌ FAIL: ${test.name} (expected ${test.expectedStatus}, got ${res.statusCode})`);
        failed++;
      }
      resolve();
    }).on('error', (err) => {
      console.log(`  ❌ FAIL: ${test.name} (${err.message})`);
      failed++;
      resolve();
    });
  });
}

async function main() {
  console.log('\n🧪 Running Tests...\n');
  for (const test of tests) {
    await runTest(test);
  }
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
