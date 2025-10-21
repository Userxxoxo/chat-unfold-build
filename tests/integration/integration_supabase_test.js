const fetch = require('node-fetch')
require('dotenv').config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env to run integration tests')
  process.exit(2)
}

const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_KEY}` }

async function testDeployEstimate() {
  const url = `${SUPABASE_URL}/functions/v1/deploy-contract?action=estimate`
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ bytecode: '0x60006000' }) })
  console.log('deploy estimate status', res.status)
  const json = await res.json()
  if (res.status !== 200) throw new Error('deploy estimate failed: ' + res.status)
  if (!json.estimatedGas) throw new Error('deploy estimate missing estimatedGas')
  console.log('deploy estimate OK', json.estimatedGas)
}

async function testArbitrageScan() {
  const url = `${SUPABASE_URL}/functions/v1/arbitrage-engine?action=scan`
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ pairs: [] }) })
  console.log('arbitrage scan status', res.status)
  const json = await res.json()
  if (res.status !== 200) throw new Error('arbitrage scan failed: ' + res.status)
  if (!Array.isArray(json.candidates)) throw new Error('arbitrage scan did not return candidates array')
  console.log('arbitrage scan OK, candidates', json.candidates.length)
}

async function run() {
  try {
    await testDeployEstimate()
    await testArbitrageScan()
    console.log('Integration smoke tests passed')
    process.exit(0)
  } catch (err) {
    console.error('Integration tests failed', err)
    process.exit(1)
  }
}

run()
