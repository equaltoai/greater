#!/bin/bash
# Setup script for Cloudflare resources

set -e

echo "🚀 Setting up Cloudflare resources for Greater..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ wrangler CLI not found. Installing...${NC}"
    npm install -g wrangler
fi

# Login to Cloudflare
echo -e "${YELLOW}📝 Please login to Cloudflare...${NC}"
wrangler login

# Create KV namespaces
echo -e "${GREEN}📦 Creating KV namespaces...${NC}"

# Sessions KV
SESSIONS_RESULT=$(wrangler kv:namespace create "SESSIONS" 2>&1)
SESSIONS_ID=$(echo "$SESSIONS_RESULT" | grep -oE 'id = "[^"]*"' | cut -d'"' -f2)
echo "Sessions KV ID: $SESSIONS_ID"

# Cache KV
CACHE_RESULT=$(wrangler kv:namespace create "CACHE" 2>&1)
CACHE_ID=$(echo "$CACHE_RESULT" | grep -oE 'id = "[^"]*"' | cut -d'"' -f2)
echo "Cache KV ID: $CACHE_ID"

# Preferences KV
PREFERENCES_RESULT=$(wrangler kv:namespace create "PREFERENCES" 2>&1)
PREFERENCES_ID=$(echo "$PREFERENCES_RESULT" | grep -oE 'id = "[^"]*"' | cut -d'"' -f2)
echo "Preferences KV ID: $PREFERENCES_ID"

# Create R2 bucket
echo -e "${GREEN}🪣 Creating R2 bucket...${NC}"
wrangler r2 bucket create greater-media || echo "Bucket may already exist"

# Create D1 database
echo -e "${GREEN}🗄️ Creating D1 database...${NC}"
D1_RESULT=$(wrangler d1 create greater-analytics 2>&1)
D1_ID=$(echo "$D1_RESULT" | grep -oE '"[a-f0-9-]{36}"' | tr -d '"' | head -1)
echo "D1 Database ID: $D1_ID"

# Update wrangler.toml with actual IDs
echo -e "${GREEN}📝 Updating wrangler.toml with resource IDs...${NC}"

# Backup original
cp wrangler.toml wrangler.toml.backup

# Update with actual IDs
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/YOUR_SESSIONS_KV_ID/$SESSIONS_ID/g" wrangler.toml
    sed -i '' "s/YOUR_CACHE_KV_ID/$CACHE_ID/g" wrangler.toml
    sed -i '' "s/YOUR_PREFERENCES_KV_ID/$PREFERENCES_ID/g" wrangler.toml
    sed -i '' "s/YOUR_D1_DATABASE_ID/$D1_ID/g" wrangler.toml
else
    # Linux
    sed -i "s/YOUR_SESSIONS_KV_ID/$SESSIONS_ID/g" wrangler.toml
    sed -i "s/YOUR_CACHE_KV_ID/$CACHE_ID/g" wrangler.toml
    sed -i "s/YOUR_PREFERENCES_KV_ID/$PREFERENCES_ID/g" wrangler.toml
    sed -i "s/YOUR_D1_DATABASE_ID/$D1_ID/g" wrangler.toml
fi

# Create Pages project
echo -e "${GREEN}📄 Creating Cloudflare Pages project...${NC}"
echo -e "${YELLOW}Note: You'll need to connect your GitHub repository in the dashboard${NC}"

# Initialize D1 database with schema
echo -e "${GREEN}🗄️ Initializing D1 database schema...${NC}"
cat > /tmp/schema.sql << 'EOF'
-- Analytics schema for Greater
CREATE TABLE IF NOT EXISTS page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    path TEXT NOT NULL,
    user_agent TEXT,
    referer TEXT,
    country TEXT,
    city TEXT
);

CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    type TEXT NOT NULL, -- 'boost', 'favorite', 'reply', 'follow'
    instance TEXT,
    user_id TEXT
);

CREATE INDEX idx_page_views_timestamp ON page_views(timestamp);
CREATE INDEX idx_interactions_timestamp ON interactions(timestamp);
CREATE INDEX idx_interactions_type ON interactions(type);
EOF

wrangler d1 execute greater-analytics --file=/tmp/schema.sql

echo -e "${GREEN}✅ Setup complete!${NC}"
echo
echo "Next steps:"
echo "1. Go to https://dash.cloudflare.com/pages"
echo "2. Create a new Pages project named 'greater'"
echo "3. Connect your GitHub repository"
echo "4. Set the build command to: npm run build"
echo "5. Set the build output directory to: dist"
echo "6. Configure environment variables:"
echo "   - Add any API keys or secrets using the dashboard"
echo
echo "For local development, run:"
echo "  npm run dev"
echo
echo "To deploy manually:"
echo "  npm run build && wrangler pages deploy dist" 