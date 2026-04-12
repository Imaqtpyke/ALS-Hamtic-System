// test.mjs
import fs from 'fs';
import path from 'path';

// Read .env.local for credentials
const envPath = path.resolve('.env');
const envLocalPath = path.resolve('.env.local');

let envContent = '';
if (fs.existsSync(envLocalPath)) {
  envContent = fs.readFileSync(envLocalPath, 'utf8');
} else if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

let supabaseUrl = '';
let supabaseAnonKey = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseAnonKey = line.split('=')[1].trim();
});

async function run() {
  console.log('Testing Supabase PATCH...');
  const res = await fetch(`${supabaseUrl}/rest/v1/enrollments?id=eq.22cc3fe4-4d53-431c-ba41-437e077c6b49`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ status: 'enrolled', approved_at: new Date().toISOString() })
  });

  const text = await res.text();
  console.log('Status code:', res.status);
  console.log('Response body:', text);
}

run().catch(console.error);
