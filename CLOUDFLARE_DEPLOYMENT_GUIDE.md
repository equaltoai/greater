# Cloudflare Pages Deployment Guide

This guide explains how to deploy Greater to Cloudflare Pages with all the necessary services (KV, R2, D1).

## 🚀 Quick Start

### 1. Initial Setup

Run the automated setup script:

```bash
./scripts/setup-cloudflare.sh
```

This will:
- Create KV namespaces (Sessions, Cache, Preferences)
- Create R2 bucket (Media storage)
- Create D1 database (Analytics)
- Update `wrangler.toml` with actual resource IDs

### 2. Manual Pages Project Setup

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** > **Create application** > **Pages**
3. Connect to Git and select your repository
4. Configure build settings:
   - **Build command**: `pnpm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty)
   - **Environment variables**: Add any needed (see below)

### 3. Bind Resources to Pages

In your Pages project settings, go to **Settings** > **Functions** > **Bindings**:

#### KV Namespace Bindings
- **Variable name**: `SESSIONS` → Select your sessions KV namespace
- **Variable name**: `CACHE` → Select your cache KV namespace  
- **Variable name**: `PREFERENCES` → Select your preferences KV namespace

#### R2 Bucket Binding
- **Variable name**: `MEDIA` → Select `greater-media` bucket

#### D1 Database Binding
- **Variable name**: `ANALYTICS` → Select `greater-analytics` database

## 🔧 Configuration Details

### Environment Variables

Set these in Pages dashboard under **Settings** > **Environment variables**:

```bash
# Production variables
ENVIRONMENT=production
API_VERSION=v1
PUBLIC_APP_URL=https://greater.website

# Optional monitoring
SENTRY_DSN=your-sentry-dsn
POSTHOG_API_KEY=your-posthog-key
```

### Custom Domain

1. Go to **Custom domains** in your Pages project
2. Add `greater.website`
3. Follow DNS configuration instructions
4. SSL will be automatically provisioned

## 🛠️ Development Workflow

### Local Development

```bash
# Install dependencies
pnpm install

# Run with Cloudflare Pages dev server (recommended)
pnpm exec wrangler pages dev --compatibility-date=2024-01-01 -- pnpm run dev

# Or use Astro dev (without CF bindings)
pnpm run dev
```

### Manual Deployment

```bash
# Build the project
pnpm run build

# Deploy to Pages
pnpm exec wrangler pages deploy dist --project-name=greater
```

### Preview Deployments

Every push to a branch creates a preview deployment:
- URL format: `https://<hash>.greater.pages.dev`
- Bindings are inherited from production

## 📊 Using Cloudflare Services

### KV Storage (Key-Value)

```typescript
// In your API routes or functions
export async function onRequest({ env }) {
  // Store session
  await env.SESSIONS.put('session:123', JSON.stringify(userData), {
    expirationTtl: 86400 // 24 hours
  });
  
  // Get session
  const session = await env.SESSIONS.get('session:123');
}
```

### R2 Storage (Media)

```typescript
// Upload media
await env.MEDIA.put('images/avatar.jpg', file, {
  httpMetadata: {
    contentType: 'image/jpeg',
    cacheControl: 'public, max-age=31536000'
  }
});

// Get media URL
const object = await env.MEDIA.get('images/avatar.jpg');
```

### D1 Database (Analytics)

```typescript
// Log page view
await env.ANALYTICS.prepare(
  'INSERT INTO page_views (path, user_agent, country) VALUES (?, ?, ?)'
).bind(request.url, request.headers.get('user-agent'), request.cf?.country).run();

// Query analytics
const { results } = await env.ANALYTICS.prepare(
  'SELECT COUNT(*) as views FROM page_views WHERE date(timestamp) = date("now")'
).all();
```

## 🔍 Troubleshooting

### Common Issues

1. **"Binding not found" errors**
   - Ensure all bindings are configured in Pages dashboard
   - Check that variable names match exactly

2. **Build failures**
   - Check Node.js version (should be 20+)
   - Verify all dependencies are installed
   - Check build logs in Pages dashboard

3. **Functions not working**
   - Ensure `functions/` directory structure is correct
   - Check compatibility flags in `wrangler.toml`
   - Verify function exports match Pages format

### Debug Commands

```bash
# Check KV namespaces
wrangler kv:namespace list

# Check R2 buckets
wrangler r2 bucket list

# Check D1 databases
wrangler d1 list

# Tail function logs
wrangler pages deployment tail
```

## 🚦 Deployment Checklist

- [ ] All Cloudflare resources created (KV, R2, D1)
- [ ] `wrangler.toml` updated with resource IDs
- [ ] Pages project created and connected to Git
- [ ] All bindings configured in Pages dashboard
- [ ] Environment variables set for production
- [ ] Custom domain configured
- [ ] Build command and output directory set correctly
- [ ] First successful deployment completed

## 📚 Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [KV Documentation](https://developers.cloudflare.com/kv/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)

## 🆘 Getting Help

- Check the [Cloudflare Community](https://community.cloudflare.com/)
- Join the [Cloudflare Discord](https://discord.cloudflare.com/)
- Open an issue on [GitHub](https://github.com/aron23/greater/issues) 