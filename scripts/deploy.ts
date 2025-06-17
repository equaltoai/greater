#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const environment = process.env.PULUMI_STACK || 'dev';
const isProd = environment === 'prod';

console.log(`🚀 Deploying Greater Client to ${environment}...`);

try {
  // 1. Build the Astro application
  console.log('📦 Building Astro application...');
  execSync('npm run build', { stdio: 'inherit' });

  // 2. Update worker script with actual built content
  console.log('🔧 Preparing worker script...');
  const workerPath = path.join(process.cwd(), 'dist', '_worker.js');
  const workerContent = readFileSync(workerPath, 'utf-8');
  
  // Update the Pulumi infrastructure with the actual worker content
  const infraPath = path.join(process.cwd(), 'infrastructure', 'index.ts');
  let infraContent = readFileSync(infraPath, 'utf-8');
  
  // Replace the placeholder worker content
  infraContent = infraContent.replace(
    /content: pulumi\.interpolate`[\s\S]*?`/,
    `content: pulumi.interpolate\`${workerContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\``
  );
  
  writeFileSync(infraPath, infraContent);

  // 3. Run Pulumi deployment
  console.log(`☁️  Deploying to Cloudflare (${environment})...`);
  execSync(`pulumi up --stack ${environment} --yes`, { 
    stdio: 'inherit',
    cwd: path.join(process.cwd(), 'infrastructure')
  });

  // 4. Clear Cloudflare cache if production
  if (isProd) {
    console.log('🧹 Purging Cloudflare cache...');
    const config = JSON.parse(execSync(`pulumi config --json --stack ${environment}`, {
      cwd: path.join(process.cwd(), 'infrastructure')
    }).toString());
    
    const zoneId = config['greater-client:zoneId'];
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    
    if (zoneId && apiToken) {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ purge_everything: true }),
        }
      );
      
      if (response.ok) {
        console.log('✅ Cache purged successfully');
      } else {
        console.warn('⚠️  Failed to purge cache:', await response.text());
      }
    }
  }

  console.log(`✅ Deployment to ${environment} completed successfully!`);
  console.log(`🌐 Your app is available at: https://${isProd ? '' : 'dev.'}greater.website`);

} catch (error) {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
}