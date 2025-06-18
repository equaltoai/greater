#!/bin/bash

set -e

echo "🔥 CLOUDFLARE PROJECT COMPLETE TEARDOWN"
echo "======================================="
echo ""
echo "This script will destroy ALL Cloudflare resources for this project:"
echo "  - Pulumi stack and all managed resources"
echo "  - KV namespaces"
echo "  - R2 buckets"  
echo "  - D1 databases"
echo "  - Pages project"
echo ""
echo "⚠️  WARNING: This action is IRREVERSIBLE!"
echo ""

read -p "Type 'DESTROY' to confirm you want to delete everything: " CONFIRM

if [ "$CONFIRM" != "DESTROY" ]; then
    echo "❌ Teardown cancelled."
    exit 0
fi

echo ""
echo "📦 Step 1: Destroying Pulumi stack..."
echo "-------------------------------------"

if [ -d "infrastructure" ]; then
    cd infrastructure
    
    # Check if stack exists
    if pulumi stack --show-name &>/dev/null; then
        echo "Found Pulumi stack, destroying..."
        pulumi destroy -y --skip-preview
        
        # Remove the stack
        STACK_NAME=$(pulumi stack --show-name)
        pulumi stack rm $STACK_NAME -y
        
        # Clean up state files
        rm -f Pulumi.$STACK_NAME.yaml
    else
        echo "No Pulumi stack found, skipping..."
    fi
    
    cd ..
else
    echo "No infrastructure directory found, skipping Pulumi teardown..."
fi

echo ""
echo "🗑️  Step 2: Direct Cloudflare resource cleanup..."
echo "------------------------------------------------"
echo "(This will catch any resources not managed by Pulumi)"
echo ""

# Run the TypeScript teardown script if wrangler.toml exists
if [ -f "wrangler.toml" ]; then
    echo "Running Cloudflare teardown script..."
    tsx scripts/teardown-cloudflare.ts <<< "yes"
else
    echo "No wrangler.toml found, skipping direct resource cleanup..."
fi

echo ""
echo "🧹 Step 3: Cleaning up local files..."
echo "------------------------------------"

# Remove generated files
rm -f wrangler.toml
rm -f .env
rm -f infrastructure/Pulumi.*.yaml

echo ""
echo "✅ TEARDOWN COMPLETE!"
echo ""
echo "📝 Manual cleanup may still be needed for:"
echo "  - Custom domains in Cloudflare dashboard"
echo "  - API tokens if no longer needed"
echo "  - Any manual configurations"
echo ""
echo "🔗 Check your Cloudflare dashboard to verify all resources are removed:"
echo "   https://dash.cloudflare.com/"