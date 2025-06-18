#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import * as path from 'path';

interface CloudflareResource {
  type: string;
  name: string;
  id?: string;
}

const ACCOUNT_ID = 'f32d4379a27d6dd9fe076cc3cf0dae44';

async function teardownCloudflare() {
  console.log('🔥 Starting Cloudflare teardown process...\n');

  // Read wrangler.toml to get resource IDs
  const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
  const wranglerContent = readFileSync(wranglerPath, 'utf8');

  const resources: CloudflareResource[] = [];

  // Extract KV namespace IDs
  const kvMatches = wranglerContent.matchAll(/\[\[kv_namespaces\]\]\s*binding = "(\w+)"\s*id = "([^"]+)"/g);
  for (const match of kvMatches) {
    resources.push({
      type: 'kv',
      name: match[1],
      id: match[2]
    });
  }

  // Extract R2 bucket names
  const r2Matches = wranglerContent.matchAll(/\[\[r2_buckets\]\]\s*binding = "(\w+)"\s*bucket_name = "([^"]+)"/g);
  for (const match of r2Matches) {
    resources.push({
      type: 'r2',
      name: match[2],
      id: match[2]
    });
  }

  // Extract D1 database ID
  const d1Matches = wranglerContent.matchAll(/\[\[d1_databases\]\]\s*binding = "(\w+)"\s*database_name = "([^"]+)"\s*database_id = "([^"]+)"/g);
  for (const match of d1Matches) {
    resources.push({
      type: 'd1',
      name: match[2],
      id: match[3]
    });
  }

  // Extract Pages project name
  const nameMatch = wranglerContent.match(/name = "([^"]+)"/);
  if (nameMatch) {
    resources.push({
      type: 'pages',
      name: nameMatch[1],
      id: nameMatch[1]
    });
  }

  console.log('📋 Found the following resources to delete:');
  resources.forEach(r => console.log(`  - ${r.type.toUpperCase()}: ${r.name} (${r.id})`));
  console.log('');

  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise<string>(resolve => {
    rl.question('⚠️  Are you sure you want to delete ALL these resources? This cannot be undone! (yes/no): ', resolve);
  });
  rl.close();

  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ Teardown cancelled.');
    process.exit(0);
  }

  console.log('\n🗑️  Deleting resources...\n');

  // Delete KV namespaces
  for (const kv of resources.filter(r => r.type === 'kv')) {
    try {
      console.log(`Deleting KV namespace: ${kv.name} (${kv.id})`);
      execSync(`wrangler kv:namespace delete --namespace-id=${kv.id} --force`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`Failed to delete KV namespace ${kv.name}: ${error}`);
    }
  }

  // Delete R2 buckets
  for (const r2 of resources.filter(r => r.type === 'r2')) {
    try {
      console.log(`Deleting R2 bucket: ${r2.name}`);
      // First, delete all objects in the bucket
      execSync(`wrangler r2 object delete ${r2.name}/* --force`, { stdio: 'inherit' });
      // Then delete the bucket
      execSync(`wrangler r2 bucket delete ${r2.name} --force`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`Failed to delete R2 bucket ${r2.name}: ${error}`);
    }
  }

  // Delete D1 databases
  for (const d1 of resources.filter(r => r.type === 'd1')) {
    try {
      console.log(`Deleting D1 database: ${d1.name} (${d1.id})`);
      execSync(`wrangler d1 delete ${d1.name} --force`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`Failed to delete D1 database ${d1.name}: ${error}`);
    }
  }

  // Delete Pages project
  for (const pages of resources.filter(r => r.type === 'pages')) {
    try {
      console.log(`Deleting Pages project: ${pages.name}`);
      execSync(`wrangler pages project delete ${pages.name} --force`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`Failed to delete Pages project ${pages.name}: ${error}`);
    }
  }

  console.log('\n✅ Cloudflare resources teardown complete!');
  console.log('\n📝 Next steps:');
  console.log('  1. Run: npm run pulumi destroy (to remove Pulumi stack)');
  console.log('  2. Remove local configuration files');
  console.log('  3. Remove the project from Cloudflare dashboard if needed');
}

// Run the teardown
teardownCloudflare().catch(console.error);