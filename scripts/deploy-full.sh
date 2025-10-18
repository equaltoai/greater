#!/bin/bash
set -e

# Full deployment script that handles both infrastructure and code deployment
# Works both locally and in CI/CD

echo "🚀 Starting full deployment process..."

# Check if required environment variables are set
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "❌ Error: CLOUDFLARE_ACCOUNT_ID is not set"
    exit 1
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ Error: CLOUDFLARE_API_TOKEN is not set"
    exit 1
fi

# Determine environment
ENVIRONMENT=${1:-dev}
echo "📦 Deploying environment: $ENVIRONMENT"

# Step 1: Run Pulumi to create/update infrastructure
echo "🏗️  Creating/updating infrastructure with Pulumi..."
cd infrastructure

# Set Pulumi config if needed
pulumi config set environment $ENVIRONMENT --stack $ENVIRONMENT
pulumi config set accountId $CLOUDFLARE_ACCOUNT_ID --stack $ENVIRONMENT

# Run Pulumi
pulumi up -y --stack $ENVIRONMENT

# Get outputs and generate wrangler.toml
echo "📝 Generating wrangler.toml from infrastructure outputs..."
pulumi stack output wranglerConfigContent --stack $ENVIRONMENT > ../wrangler.generated.toml

cd ..

# Step 2: Build the Astro project
echo "🔨 Building Astro project..."
pnpm run build

# Step 3: Deploy to Cloudflare Pages with bindings
echo "☁️  Deploying to Cloudflare Pages..."

# Use the generated wrangler.toml for deployment
cp wrangler.generated.toml wrangler.toml

if [ "$ENVIRONMENT" = "production" ]; then
    wrangler pages deploy dist \
        --project-name="greater" \
        --branch="main" \
        --commit-dirty=true
else
    wrangler pages deploy dist \
        --project-name="greater" \
        --branch="$ENVIRONMENT" \
        --commit-dirty=true
fi

echo "✅ Full deployment complete!"
echo "🔗 Your site will be available at your Cloudflare Pages URL"