#!/usr/bin/env node
// Minimal smoke test to call deployed Supabase functions using service role key
// Configure env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import fetch from 'node-fetch'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}

async function invokeFunction(name, body) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify(body)
  })
  const text = await res.text()
  console.log(`Function ${name} responded (${res.status}):`, text)
  return res
}

;(async () => {
  console.log('Running smoke tests...')
  await invokeFunction('deploy-contract', { action: 'estimate' })
  await invokeFunction('arbitrage-engine', { action: 'scan_opportunities' })
  console.log('Smoke tests complete')
})().catch((e) => { console.error(e); process.exit(1) })
