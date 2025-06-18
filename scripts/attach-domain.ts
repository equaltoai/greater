#!/usr/bin/env tsx

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const PROJECT_NAME = process.argv[2] || 'greater';
const DOMAIN = process.argv[3] || 'dev.greater.website';

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN');
  process.exit(1);
}

async function attachDomain() {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/domains`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: DOMAIN,
    }),
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log(`✅ Domain ${DOMAIN} attached to ${PROJECT_NAME}`);
    console.log(data);
  } else {
    console.error(`❌ Failed to attach domain:`, data);
  }
}

attachDomain().catch(console.error);