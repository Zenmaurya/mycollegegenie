const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🔍 Running Frontend Configuration & Connectivity Diagnostics...');

// 1. Verify that .env or .env.local exists and loads correctly
const envPath = path.resolve(__dirname, '../.env.local');
const defaultEnvPath = path.resolve(__dirname, '../.env');
let envFile = envPath;

if (!fs.existsSync(envPath)) {
  console.log('ℹ️  .env.local not found, falling back to .env');
  envFile = defaultEnvPath;
}

if (!fs.existsSync(envFile)) {
  console.error('❌ CRITICAL: No environment configuration file found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envFile, 'utf8');
const configVars = {};
envContent.split('\n').forEach(line => {
  const cleanLine = line.trim();
  if (cleanLine && !cleanLine.startsWith('#')) {
    const [key, ...valueParts] = cleanLine.split('=');
    const value = valueParts.join('=').replace(/['"]/g, ''); // strip quotes
    configVars[key.trim()] = value.trim();
  }
});

console.log('✅ Found configuration file:', path.basename(envFile));

// 2. Validate Supabase URL
assert.ok(configVars.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL is missing!');
console.log('✅ Supabase URL configured:', configVars.VITE_SUPABASE_URL);

// 3. Validate API URL points to local dev backend
assert.ok(configVars.VITE_API_URL, 'VITE_API_URL is missing!');
assert.strictEqual(configVars.VITE_API_URL, 'http://localhost:3001', 'VITE_API_URL should point to http://localhost:3001 for local testing!');
console.log('✅ Local API URL configured correctly:', configVars.VITE_API_URL);

// 4. Test connection to the local API server
const API_URL = configVars.VITE_API_URL;
fetch(`${API_URL}/health`)
  .then(res => {
    if (res.ok) {
      console.log('✅ Successfully connected to local API health check!');
      return res.json();
    } else {
      throw new Error(`Health check returned status ${res.status}`);
    }
  })
  .then(data => {
    console.log('✅ Backend info:', data);
    console.log('🎉 Diagnostics complete! Frontend is fully configured and backend is reachable.');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Failed to connect to local API backend. Make sure backend is running with "npm start" or "npm run dev".');
    console.error('   Error details:', err.message);
    process.exit(1);
  });
