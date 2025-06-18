#!/bin/bash
set -e

# Deployment script for Astro + Cloudflare Pages
# Works both locally and in CI/CD

echo "🚀 Starting deployment process..."

# Check if required environment variables are set
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "❌ Error: CLOUDFLARE_ACCOUNT_ID is not set"
    exit 1
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ Error: CLOUDFLARE_API_TOKEN is not set"
    exit 1
fi

# Determine environment from branch or argument
ENVIRONMENT=${1:-${GITHUB_REF_NAME:-dev}}
PROJECT_NAME="greater-${ENVIRONMENT}"

echo "📦 Building for environment: $ENVIRONMENT"

# Build the project
npm run build

# Deploy to Cloudflare Pages
echo "☁️  Deploying to Cloudflare Pages..."

if [ "$ENVIRONMENT" = "production" ]; then
    # Production deployment
    wrangler pages deploy dist \
        --project-name="greater" \
        --branch="main" \
        --commit-dirty=true
else
    # Preview/dev deployment
    wrangler pages deploy dist \
        --project-name="greater" \
        --branch="$ENVIRONMENT" \
        --commit-dirty=true
fi

echo "✅ Deployment complete!"