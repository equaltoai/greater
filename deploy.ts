import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as pulumi from '@pulumi/pulumi';
import * as cloudflare from '@pulumi/cloudflare';
import dotenv from 'dotenv';
import { spawn } from 'child_process';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface DeployConfig {
  environment: string;
  accountId: string;
  apiToken: string;
  pulumiAccessToken?: string;
  zoneId?: string;
  domain?: string;
  skipInfrastructure?: boolean;
  skipBuild?: boolean;
}

class Deployer {
  private config: DeployConfig;
  
  constructor(config: DeployConfig) {
    this.config = config;
    
    // Set environment variables for wrangler
    process.env.CLOUDFLARE_ACCOUNT_ID = config.accountId;
    process.env.CLOUDFLARE_API_TOKEN = config.apiToken;
  }

  async deploy() {
    console.log(`🚀 Starting deployment for environment: ${this.config.environment}`);
    
    try {
      // Pre-flight checks
      this.validateEnvironment();
      
      let infrastructure = null;
      
      if (!this.config.skipInfrastructure) {
        // Step 1: Create/update infrastructure with Pulumi
        infrastructure = await this.createInfrastructure();
        
        // Step 2: Generate wrangler config
        await this.generateWranglerConfig(infrastructure);
      } else {
        console.log('⏩ Skipping infrastructure creation (--skip-infrastructure flag)');
        
        // Check if wrangler.toml exists
        if (!existsSync('wrangler.toml')) {
          throw new Error('wrangler.toml not found. Run without --skip-infrastructure flag first.');
        }
      }
      
      if (!this.config.skipBuild) {
        // Step 3: Build project
        this.buildProject();
      } else {
        console.log('⏩ Skipping build (--skip-build flag)');
        
        // Check if dist exists
        if (!existsSync('dist')) {
          throw new Error('dist folder not found. Run without --skip-build flag first.');
        }
      }
      
      // Step 4: Deploy to Cloudflare Workers
      await this.deployToPages();
      
      // Step 5: Post-deployment tasks
      await this.postDeploy();
      
      console.log('✅ Deployment complete!');
      console.log(`🔗 Your site will be available at: https://greater-${this.config.environment}.${this.config.accountId}.workers.dev`);
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    }
  }
  
  private validateEnvironment() {
    console.log('🔍 Validating environment...');
    
    // Check Node version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
    if (majorVersion < 18) {
      throw new Error(`Node.js 18+ required. Current version: ${nodeVersion}`);
    }
    
    // Check if npm packages are installed
    if (!existsSync('node_modules')) {
      console.log('📦 Installing dependencies...');
      execSync('npm install', { stdio: 'inherit' });
    }
    
    console.log('✅ Environment validated');
  }

  private async createInfrastructure() {
    console.log('🏗️  Creating/updating infrastructure with Pulumi...');
    
    // Set Pulumi access token if provided
    if (this.config.pulumiAccessToken) {
      process.env.PULUMI_ACCESS_TOKEN = this.config.pulumiAccessToken;
    }
    
    // Change to infrastructure directory
    const originalDir = process.cwd();
    process.chdir(resolve(__dirname, 'infrastructure'));
    
    try {
      // Use the existing infrastructure/index.ts
      const stack = await pulumi.automation.LocalWorkspace.selectStack({
        stackName: this.config.environment,
        workDir: '.',
      });
      
      // Set configuration
      await stack.setConfig('environment', { value: this.config.environment });
      await stack.setConfig('accountId', { value: this.config.accountId });
      await stack.setConfig('cloudflare:apiToken', { value: this.config.apiToken, secret: true });
      
      // Run update
      console.log('📈 Updating infrastructure...');
      const upResult = await stack.up({ 
        onOutput: (msg) => process.stdout.write(msg),
        color: 'always'
      });
      
      // Get outputs
      const outputs = await stack.outputs();
      
      return outputs;
    } catch (error) {
      // Try to create the stack if it doesn't exist
      if (error.message?.includes('no stack named')) {
        console.log('📝 Creating new stack...');
        
        const stack = await pulumi.automation.LocalWorkspace.createStack({
          stackName: this.config.environment,
          workDir: '.',
        });
        
        // Set configuration
        await stack.setConfig('environment', { value: this.config.environment });
        await stack.setConfig('accountId', { value: this.config.accountId });
        await stack.setConfig('cloudflare:apiToken', { value: this.config.apiToken, secret: true });
        
        // Run update
        const upResult = await stack.up({ 
          onOutput: (msg) => process.stdout.write(msg),
          color: 'always'
        });
        
        // Get outputs
        const outputs = await stack.outputs();
        
        return outputs;
      }
      throw error;
    } finally {
      // Change back to original directory
      process.chdir(originalDir);
    }
  }
  
  private async createInfrastructureOld() {
    // Keep the old inline version as backup
    const stack = await pulumi.automation.LocalWorkspace.createOrSelectStack({
      stackName: this.config.environment,
      projectName: 'greater-infrastructure',
      program: async () => {
        const accountId = this.config.accountId;
        const environment = this.config.environment;
        
        // Create KV namespaces
        const sessionKV = new cloudflare.WorkersKvNamespace("session-kv", {
          accountId,
          title: `greater-sessions-${environment}`,
        });

        const cacheKV = new cloudflare.WorkersKvNamespace("cache-kv", {
          accountId,
          title: `greater-cache-${environment}`,
        });

        const offlineKV = new cloudflare.WorkersKvNamespace("offline-kv", {
          accountId,
          title: `greater-offline-${environment}`,
        });

        const preferencesKV = new cloudflare.WorkersKvNamespace("preferences-kv", {
          accountId,
          title: `greater-preferences-${environment}`,
        });
        
        const oauthAppsKV = new cloudflare.WorkersKvNamespace("oauth-apps-kv", {
          accountId,
          title: `greater-oauth-apps-${environment}`,
        });

        // Create R2 buckets
        const mediaBucket = new cloudflare.R2Bucket("media-bucket", {
          accountId,
          name: `greater-media-${environment}`,
          location: "enam",
        });

        const staticBucket = new cloudflare.R2Bucket("static-bucket", {
          accountId,
          name: `greater-static-${environment}`,
          location: "enam",
        });

        // Create D1 database
        const analyticsDb = new cloudflare.D1Database("analytics-db", {
          accountId,
          name: `greater-analytics-${environment}`,
        });

        return {
          sessionKvId: sessionKV.id,
          cacheKvId: cacheKV.id,
          offlineKvId: offlineKV.id,
          preferencesKvId: preferencesKV.id,
          oauthAppsKvId: oauthAppsKV.id,
          mediaBucketName: mediaBucket.name,
          staticBucketName: staticBucket.name,
          analyticsDbId: analyticsDb.id,
          analyticsDbName: analyticsDb.name,
        };
      },
    });

    // Configure the stack
    await stack.setConfig('cloudflare:apiToken', { value: this.config.apiToken, secret: true });
    
    // Run the update
    const upResult = await stack.up({ onOutput: console.log });
    return upResult.outputs;
  }

  private async generateWranglerConfig(outputs: any) {
    console.log('📝 Generating wrangler.toml...');
    
    // Use the wranglerConfigContent output from Pulumi if available
    if (outputs.wranglerConfigContent?.value) {
      writeFileSync('wrangler.toml', outputs.wranglerConfigContent.value);
      console.log('✅ Generated wrangler.toml from Pulumi output');
      return;
    }
    
    // Fallback to manual generation
    const config = `# Auto-generated - DO NOT EDIT
name = "greater-${this.config.environment}"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
main = "dist/_worker.js/index.js"
account_id = "${this.config.accountId}"

[site]
bucket = "./dist"
exclude = ["*.map"]

[vars]
ENVIRONMENT = "${this.config.environment}"

[[kv_namespaces]]
binding = "SESSIONS"
id = "${outputs.sessionKvId?.value || outputs.sessionKvId}"

[[kv_namespaces]]
binding = "CACHE"
id = "${outputs.cacheKvId?.value || outputs.cacheKvId}"

[[kv_namespaces]]
binding = "PREFERENCES"
id = "${outputs.preferencesKvId?.value || outputs.preferencesKvId}"

[[kv_namespaces]]
binding = "OFFLINE"
id = "${outputs.offlineKvId?.value || outputs.offlineKvId}"

[[kv_namespaces]]
binding = "OAUTH_APPS"
id = "${outputs.oauthAppsKvId?.value || outputs.oauthAppsKvId}"

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "${outputs.mediaBucketName?.value || outputs.mediaBucketName}"

[[r2_buckets]]
binding = "STATIC"
bucket_name = "${outputs.staticBucketName?.value || outputs.staticBucketName}"

[[d1_databases]]
binding = "ANALYTICS"
database_name = "${outputs.analyticsDbName?.value || outputs.analyticsDbName || `greater-analytics-${this.config.environment}`}"
database_id = "${outputs.analyticsDbId?.value || outputs.analyticsDbId}"
`;

    writeFileSync('wrangler.toml', config);
    console.log('✅ Generated wrangler.toml');
  }

  private buildProject() {
    console.log('🔨 Building project...');
    
    // Clean previous build
    if (existsSync('dist')) {
      console.log('🧹 Cleaning previous build...');
      execSync('rm -rf dist', { stdio: 'inherit' });
    }
    
    // Run build
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Build completed');
    } catch (error) {
      throw new Error('Build failed. Check the error messages above.');
    }
  }

  private async deployToPages() {
    console.log('☁️  Deploying to Cloudflare Workers...');
    
    try {
      // Deploy using wrangler deploy (for Workers, not Pages)
      const deployCommand = 'wrangler deploy';
      
      console.log(`📤 Deploying with: ${deployCommand}`);
      execSync(deployCommand, { stdio: 'inherit' });
      
      console.log('✅ Deployment to Cloudflare Workers completed');
    } catch (error) {
      throw new Error('Deployment to Cloudflare Workers failed');
    }
  }
  
  private async postDeploy() {
    console.log('🎯 Running post-deployment tasks...');
    
    // If custom domain is configured, show instructions
    if (this.config.domain && this.config.zoneId) {
      console.log(`\n📌 Custom domain configuration:`);
      console.log(`   Domain: ${this.config.domain}`);
      console.log(`   Zone ID: ${this.config.zoneId}`);
      console.log(`   Add a CNAME record pointing to: greater-${this.config.environment}.${this.config.accountId}.workers.dev`);
    }
    
    // Show deployment info
    console.log(`\n🎉 Deployment Summary:`);
    console.log(`   Environment: ${this.config.environment}`);
    console.log(`   Worker: greater-${this.config.environment}`);
  }
}

// CLI interface
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const environment = args.find(arg => !arg.startsWith('--')) || 'dev';
  const skipInfrastructure = args.includes('--skip-infrastructure');
  const skipBuild = args.includes('--skip-build');
  const help = args.includes('--help') || args.includes('-h');
  
  if (help) {
    console.log(`
Greater Deployment Script

Usage: npm run deploy [environment] [options]

Environments:
  dev         Development environment (default)
  staging     Staging environment
  production  Production environment

Options:
  --skip-infrastructure  Skip Pulumi infrastructure creation/update
  --skip-build          Skip building the project
  --help, -h            Show this help message

Examples:
  npm run deploy                    Deploy to dev environment
  npm run deploy production         Deploy to production
  npm run deploy dev --skip-build   Deploy dev without rebuilding

Required Environment Variables:
  CLOUDFLARE_ACCOUNT_ID   Your Cloudflare account ID
  CLOUDFLARE_API_TOKEN    Your Cloudflare API token
  
Optional Environment Variables:
  PULUMI_ACCESS_TOKEN     Pulumi access token (for CI/CD)
  CLOUDFLARE_ZONE_ID      Zone ID for custom domain
  DOMAIN                  Custom domain name
`);
    process.exit(0);
  }
  
  // Validate environment
  const validEnvironments = ['dev', 'staging', 'production', 'preview'];
  if (!validEnvironments.includes(environment)) {
    console.error(`❌ Invalid environment: ${environment}`);
    console.error(`   Valid environments: ${validEnvironments.join(', ')}`);
    process.exit(1);
  }
  
  const config: DeployConfig = {
    environment,
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    apiToken: process.env.CLOUDFLARE_API_TOKEN!,
    pulumiAccessToken: process.env.PULUMI_ACCESS_TOKEN,
    zoneId: process.env.CLOUDFLARE_ZONE_ID,
    domain: process.env.DOMAIN,
    skipInfrastructure,
    skipBuild,
  };

  if (!config.accountId || !config.apiToken) {
    console.error('❌ Missing required environment variables:');
    console.error('   CLOUDFLARE_ACCOUNT_ID');
    console.error('   CLOUDFLARE_API_TOKEN');
    console.error('\n💡 Tip: Copy .env.example to .env.local and fill in your values');
    process.exit(1);
  }

  console.log('🌟 Greater Deployment Tool\n');
  const deployer = new Deployer(config);
  await deployer.deploy();
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}

export { Deployer, DeployConfig };