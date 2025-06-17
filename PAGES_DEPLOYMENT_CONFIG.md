# Pages Deployment Configuration

## Branch Setup for Dev/Prod

This project uses the following deployment strategy:
- **Production**: `main` branch → `greater.website`
- **Development**: `dev` branch → `dv.greater.website`

## How to Configure in Cloudflare Dashboard

### 1. Go to Your Pages Project
Navigate to: https://dash.cloudflare.com/pages/view/greater-bwg

### 2. Add Custom Domains
Go to **Settings** → **Custom domains** and add:

1. **Production Domain**:
   - Click "Set up a custom domain"
   - Enter: `greater.website`
   - Click "Activate domain"

2. **WWW Domain** (optional):
   - Add another custom domain
   - Enter: `www.greater.website`
   - Click "Activate domain"

3. **Development Domain**:
   - Add another custom domain
   - Enter: `dv.greater.website`
   - Click "Activate domain"

### 3. Configure Branch Deployments
Go to **Settings** → **Builds & deployments**:

1. **Production branch**: Set to `main`
2. **Preview deployments**: Include `dev` branch

### 4. Set Up Environment Variables (if needed)
For different configs between dev/prod:

**Production** (main branch):
```
ENVIRONMENT=production
API_VERSION=v1
PUBLIC_APP_URL=https://greater.website
```

**Development** (dev branch):
```
ENVIRONMENT=development
API_VERSION=v1
PUBLIC_APP_URL=https://dv.greater.website
```

## Local Development Workflow

### Working on Development
```bash
# Switch to dev branch
git checkout dev

# Make changes and test locally
npm run dev:cf

# Push to trigger dev deployment
git add .
git commit -m "feat: your feature"
git push origin dev

# Your changes will be live at https://dv.greater.website
```

### Deploying to Production
```bash
# Switch to main branch
git checkout main

# Merge dev changes
git merge dev

# Push to trigger production deployment
git push origin main

# Your changes will be live at https://greater.website
```

## DNS Records Summary

These should already be added in Cloudflare DNS:

| Type  | Name | Content                      | Proxy Status |
|-------|------|------------------------------|--------------|
| CNAME | @    | c88e6347.greater-bwg.pages.dev | Proxied     |
| CNAME | www  | c88e6347.greater-bwg.pages.dev | Proxied     |
| CNAME | dv   | c88e6347.greater-bwg.pages.dev | Proxied     |

## Deployment URLs

- **Production**: https://greater.website
- **Development**: https://dv.greater.website
- **Preview (PRs)**: https://{hash}.greater-bwg.pages.dev

## Notes

- All deployments share the same KV, R2, and D1 bindings
- Use environment variables to differentiate between dev/prod
- SSL certificates are automatically provisioned for all custom domains
- DNS changes may take 5-10 minutes to propagate 