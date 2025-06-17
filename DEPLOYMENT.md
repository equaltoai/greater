# Greater Client Deployment Guide

This guide covers deploying the Greater Client to Cloudflare using Pulumi for infrastructure as code.

## Prerequisites

1. **Cloudflare Account** with:
   - API Token with appropriate permissions
   - Account ID
   - Zone ID for your domain

2. **Pulumi Account** (free tier is sufficient)

3. **Domain** configured in Cloudflare (greater.website)

## Setup Instructions

### 1. Environment Configuration

Copy the example environment file and fill in your credentials:

```bash
cp env.example .env
```

Edit `.env` with your values:
```env
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_ZONE_ID=your_cloudflare_zone_id
PULUMI_ACCESS_TOKEN=your_pulumi_access_token
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Initialize Pulumi

Run the setup script to configure Pulumi:

```bash
npm run setup:pulumi
```

This will:
- Login to Pulumi
- Create development and production stacks
- Configure Cloudflare credentials
- Set up environment-specific configurations

### 4. Deploy to Development

```bash
npm run deploy:dev
```

This deploys to `dev.greater.website` with development settings.

### 5. Deploy to Production

```bash
npm run deploy:prod
```

This deploys to `greater.website` with production optimizations.

## Infrastructure Components

### Cloudflare Workers
- Main application worker with Node.js compatibility
- Automatic scaling and global distribution

### KV Namespaces
- **SESSION**: User session storage
- **CACHE**: API response caching
- **OFFLINE**: Offline queue storage

### R2 Buckets
- **MEDIA**: User-uploaded media files
- **STATIC**: Static assets and builds

### Additional Services
- **D1 Database**: Analytics data
- **Durable Objects**: Real-time coordination
- **Page Rules**: Caching optimization
- **Rate Limiting**: API protection

## GitHub Actions CI/CD

The repository includes automated deployment workflows:

### Pull Requests
- Runs tests and linting
- Deploys preview to dev.greater.website
- Comments on PR with preview URL

### Main Branch
- Runs full test suite
- Deploys to production
- Purges Cloudflare cache
- Creates GitHub release

### Required GitHub Secrets
Set these in your repository settings:
- `PULUMI_ACCESS_TOKEN`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ZONE_ID`

## Manual Deployment Commands

### View Current Infrastructure
```bash
cd infrastructure
pulumi stack select dev  # or prod
pulumi preview
```

### Update Specific Resources
```bash
cd infrastructure
pulumi up --yes
```

### Destroy Infrastructure
```bash
cd infrastructure
pulumi destroy --yes
```

## Monitoring and Debugging

### Cloudflare Dashboard
- Workers analytics
- Error logs
- Performance metrics
- Cache hit rates

### Pulumi Console
- Infrastructure state
- Deployment history
- Resource dependencies

### Application Logs
- Real-time logs in Cloudflare Workers dashboard
- Sentry integration for error tracking (optional)

## Performance Optimization

### Caching Strategy
- Static assets cached for 1 day at edge
- API responses cached in KV with TTL
- Browser cache headers optimized

### Bundle Optimization
- Code splitting by route
- Lazy loading for heavy components
- Compression enabled

### Global Distribution
- Workers deployed to 200+ locations
- Automatic routing to nearest edge
- Sub-50ms response times globally

## Security Considerations

### API Token Permissions
Ensure your Cloudflare API token has only necessary permissions:
- Zone:Read
- Zone:Cache Purge
- Workers Scripts:Edit
- Workers KV Storage:Edit
- Workers R2 Storage:Edit

### Environment Variables
- Never commit `.env` files
- Use GitHub Secrets for CI/CD
- Rotate tokens regularly

### Rate Limiting
- API endpoints protected
- 100 requests/minute default
- Cloudflare challenge for exceeded limits

## Troubleshooting

### Deployment Fails
1. Check Pulumi logs: `pulumi logs -f`
2. Verify Cloudflare credentials
3. Ensure domain is properly configured

### Worker Errors
1. Check Workers dashboard logs
2. Verify KV namespace bindings
3. Check environment variables

### Cache Issues
1. Purge cache manually if needed
2. Check Page Rules configuration
3. Verify cache headers

## Cost Estimation

### Cloudflare Workers (Free Tier)
- 100,000 requests/day
- 10ms CPU time per request
- Sufficient for moderate traffic

### Cloudflare KV (Free Tier)
- 100,000 reads/day
- 1,000 writes/day
- 1GB storage

### Cloudflare R2 (Pricing)
- $0.015/GB stored per month
- $0.01/GB bandwidth
- No egress fees

### Pulumi (Free Tier)
- Unlimited resources
- 1 concurrent deployment
- Community support

## Next Steps

1. Set up monitoring dashboards
2. Configure custom domains
3. Enable Web Analytics
4. Set up backup strategies
5. Configure A/B testing with Workers

For questions or issues, please refer to:
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Pulumi Cloudflare Provider](https://www.pulumi.com/registry/packages/cloudflare/)
- [Greater Client Issues](https://github.com/greater/client/issues)