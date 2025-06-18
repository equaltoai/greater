# Greater Deployment Guide

This guide covers the deployment process for Greater, a modern Mastodon client built with Astro and deployed on Cloudflare Workers.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Cloudflare account with API access
- Pulumi account (free tier is fine)

## Environment Setup

1. **Copy the environment file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in required values in `.env.local`:**
   ```env
   # Required for deployment
   CLOUDFLARE_ACCOUNT_ID=your-account-id
   CLOUDFLARE_API_TOKEN=your-api-token
   
   # Required for infrastructure management
   PULUMI_ACCESS_TOKEN=your-pulumi-access-token
   
   # Optional: Custom domain
   CLOUDFLARE_ZONE_ID=your-zone-id
   DOMAIN=your-domain.com
   ```

3. **Get your Cloudflare credentials:**
   - Account ID: Found in Cloudflare dashboard → Right sidebar
   - API Token: Create at https://dash.cloudflare.com/profile/api-tokens
     - Use "Edit Cloudflare Workers" template
     - Add permissions: Account:Cloudflare Pages:Edit, Zone:Page Rules:Edit

4. **Get your Pulumi token:**
   - Sign up at https://app.pulumi.com (free)
   - Create access token: Settings → Access Tokens → Create Token

## Deployment Commands

### Full Deployment (Recommended for first time)

Deploy to development:
```bash
npm run deploy:dev
```

Deploy to production:
```bash
npm run deploy
```

### Advanced Deployment Options

The deployment script supports various flags:

```bash
# Skip infrastructure creation (use existing resources)
npm run deploy:dev -- --skip-infrastructure

# Skip build step (use existing dist folder)
npm run deploy:dev -- --skip-build

# Show help
npm run deploy -- --help
```

## Deployment Process

The deployment script performs these steps:

1. **Environment Validation**
   - Checks Node.js version (18+ required)
   - Installs dependencies if needed
   - Validates required environment variables

2. **Infrastructure Creation/Update (Pulumi)**
   - Creates/updates KV namespaces:
     - SESSIONS - User session storage
     - CACHE - API response caching
     - PREFERENCES - User preferences
     - OFFLINE - Offline queue storage
     - OAUTH_APPS - OAuth app registrations
   - Creates/updates R2 buckets:
     - MEDIA - User uploaded media
     - STATIC - Static assets
   - Creates/updates D1 database:
     - ANALYTICS - Usage analytics

3. **Configuration Generation**
   - Generates `wrangler.toml` with resource bindings
   - Configures environment variables

4. **Project Build**
   - Cleans previous build
   - Runs Astro build process
   - Generates static files and worker

5. **Cloudflare Workers Deployment**
   - Deploys using wrangler deploy
   - Configures resource bindings
   - Updates worker with latest code

## Environments

Greater supports multiple environments:

- **dev** - Development environment (default)
- **staging** - Staging environment for testing
- **production** - Production environment

Each environment has isolated resources (KV, R2, D1).

## Custom Domain Setup

1. Add domain configuration to `.env.local`:
   ```env
   CLOUDFLARE_ZONE_ID=your-zone-id
   DOMAIN=greater.yourdomain.com
   ```

2. After deployment, add CNAME record:
   - Type: CNAME
   - Name: greater (or your subdomain)
   - Target: greater-dev.[your-account-id].workers.dev

## CI/CD Deployment

For GitHub Actions deployment:

1. Add secrets to your repository:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
   - `PULUMI_ACCESS_TOKEN`

2. Use the provided workflow:
   ```yaml
   - name: Deploy
     run: npm run deploy:${{ github.event.inputs.environment || 'dev' }}
   ```

## Troubleshooting

### Common Issues

1. **"No stack named" error**
   - The Pulumi stack doesn't exist yet
   - The script will automatically create it

2. **"wrangler.toml not found" error**
   - Run without `--skip-infrastructure` flag first
   - This generates the required configuration

3. **Build failures**
   - Check Node.js version: `node --version` (should be 18+)
   - Clear cache: `rm -rf node_modules dist && npm install`

4. **Deployment failures**
   - Verify Cloudflare API token has correct permissions
   - Check account ID is correct
   - Ensure project name is unique in your account

### Debug Mode

For verbose output during deployment:
```bash
DEBUG=* npm run deploy:dev
```

## Resource Management

### Viewing Resources

Check Cloudflare dashboard:
- Workers: Workers & Pages → Workers
- KV: Workers & Pages → KV
- R2: R2 Object Storage
- D1: Workers & Pages → D1

Check Pulumi dashboard:
- https://app.pulumi.com
- View stack resources and history

### Cleanup

To remove all resources for an environment:

1. Remove Cloudflare resources:
   ```bash
   cd infrastructure
   pulumi destroy --stack dev
   ```

2. Remove Worker manually in Cloudflare dashboard

## Performance Optimization

The deployment includes:
- Static asset optimization
- Bundle splitting
- Image optimization
- Edge caching via Cloudflare

## Security Notes

- Never commit `.env.local` or `wrangler.toml`
- Use encrypted secrets in CI/CD
- Rotate API tokens regularly
- Use least-privilege API tokens

## Support

For issues:
1. Check deployment logs
2. Verify environment variables
3. Check Cloudflare dashboard for errors
4. Review Pulumi stack history

Need help? Open an issue on GitHub with:
- Deployment command used
- Error messages
- Environment (dev/staging/production)