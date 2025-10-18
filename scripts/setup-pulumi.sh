#!/bin/bash

echo "🔧 Setting up Pulumi for Greater Client deployment..."

# Check if Pulumi is installed
if ! command -v pulumi &> /dev/null; then
    echo "❌ Pulumi is not installed. Please install it first:"
    echo "   curl -fsSL https://get.pulumi.com | sh"
    exit 1
fi

# Check for required environment variables
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN is not set"
    exit 1
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "❌ CLOUDFLARE_ACCOUNT_ID is not set"
    exit 1
fi

if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
    echo "❌ CLOUDFLARE_ZONE_ID is not set"
    exit 1
fi

# Initialize Pulumi project
cd infrastructure
pulumi login

# Create stacks if they don't exist
echo "📚 Creating Pulumi stacks..."

# Development stack
pulumi stack init dev 2>/dev/null || echo "Dev stack already exists"
pulumi stack select dev
pulumi config set cloudflare:apiToken $CLOUDFLARE_API_TOKEN --secret
pulumi config set greater-client:accountId $CLOUDFLARE_ACCOUNT_ID
pulumi config set greater-client:zoneId $CLOUDFLARE_ZONE_ID

# Production stack
pulumi stack init prod 2>/dev/null || echo "Prod stack already exists"
pulumi stack select prod
pulumi config set cloudflare:apiToken $CLOUDFLARE_API_TOKEN --secret
pulumi config set greater-client:accountId $CLOUDFLARE_ACCOUNT_ID
pulumi config set greater-client:zoneId $CLOUDFLARE_ZONE_ID

# Optional: Set Sentry DSN if available
if [ ! -z "$SENTRY_DSN" ]; then
    pulumi config set greater-client:sentryDsn $SENTRY_DSN --secret --stack dev
    pulumi config set greater-client:sentryDsn $SENTRY_DSN --secret --stack prod
fi

echo "✅ Pulumi setup complete!"
echo ""
echo "Next steps:"
echo "1. Review the configuration in Pulumi.dev.yaml and Pulumi.prod.yaml"
echo "2. Deploy to development: pnpm run deploy:dev"
echo "3. Deploy to production: pnpm run deploy:prod"