#!/bin/bash

echo "🔥 Tearing down Pulumi stack..."
echo ""

# Navigate to infrastructure directory
cd infrastructure

# Get current stack
CURRENT_STACK=$(pulumi stack --show-name 2>/dev/null || echo "")

if [ -z "$CURRENT_STACK" ]; then
    echo "❌ No Pulumi stack selected"
    echo "Available stacks:"
    pulumi stack ls
    exit 1
fi

echo "📋 Current stack: $CURRENT_STACK"
echo ""
echo "⚠️  WARNING: This will destroy all resources managed by this Pulumi stack!"
echo "This includes all KV namespaces, R2 buckets, D1 databases, and Pages projects."
echo ""
read -p "Are you sure you want to destroy the stack '$CURRENT_STACK'? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Teardown cancelled."
    exit 0
fi

echo ""
echo "🗑️  Destroying Pulumi stack..."

# Destroy the stack
pulumi destroy -y

echo ""
echo "🧹 Removing Pulumi stack..."
pulumi stack rm -y

echo ""
echo "✅ Pulumi teardown complete!"

# Return to project root
cd ..

echo ""
echo "📝 You may also want to:"
echo "  - Remove the Pulumi.<stack>.yaml file"
echo "  - Remove any local state files"
echo "  - Clean up your Cloudflare API token if no longer needed"