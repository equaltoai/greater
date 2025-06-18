#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import * as path from 'path';

async function generateWranglerConfig() {
  console.log('📝 Generating wrangler.toml from Pulumi outputs...\n');

  try {
    // Get Pulumi outputs
    const outputs = JSON.parse(
      execSync('cd infrastructure && pulumi stack output --json', { encoding: 'utf8' })
    );

    // Generate wrangler.toml content
    const wranglerContent = `# Auto-generated - DO NOT EDIT
name = "greater-${outputs.environment}"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
main = "dist/_worker.js"
account_id = "${outputs.accountId || 'f32d4379a27d6dd9fe076cc3cf0dae44'}"

[site]
bucket = "./dist"

[vars]
ENVIRONMENT = "${outputs.environment}"

[[kv_namespaces]]
binding = "SESSIONS"
id = "${outputs.sessionKvId}"

[[kv_namespaces]]
binding = "CACHE"
id = "${outputs.cacheKvId}"

[[kv_namespaces]]
binding = "PREFERENCES"
id = "${outputs.preferencesKvId}"

[[kv_namespaces]]
binding = "OFFLINE"
id = "${outputs.offlineKvId}"

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "${outputs.mediaBucketName}"

[[r2_buckets]]
binding = "STATIC"
bucket_name = "${outputs.staticBucketName}"

[[d1_databases]]
binding = "ANALYTICS"
database_name = "${outputs.analyticsDbName}"
database_id = "${outputs.analyticsDbId}"
`;

    // Write to file
    const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
    writeFileSync(wranglerPath, wranglerContent);

    console.log('✅ Generated wrangler.toml successfully!');
    console.log(`📍 File location: ${wranglerPath}`);
    console.log('\n📋 Resource summary:');
    console.log(`  - Environment: ${outputs.environment}`);
    console.log(`  - KV Namespaces: 4 (SESSIONS, CACHE, PREFERENCES, OFFLINE)`);
    console.log(`  - R2 Buckets: 2 (MEDIA, STATIC)`);
    console.log(`  - D1 Database: 1 (ANALYTICS)`);

  } catch (error) {
    console.error('❌ Failed to generate wrangler.toml:', error);
    process.exit(1);
  }
}

generateWranglerConfig();