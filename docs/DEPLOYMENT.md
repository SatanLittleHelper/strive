# Deployment Guide - Strive Angular App

This guide explains how to deploy the Strive Angular application to GitHub Pages.

## 🚀 Quick Start

### Automatic Deployment (Recommended)

The application is configured for automatic deployment using GitHub Actions. Simply push to the `main` branch and the deployment will happen automatically.

### Manual Deployment

If you need to deploy manually:

```bash
# Install dependencies (if not already installed)
npm install

# Build for GitHub Pages
npm run build:github

# Deploy to GitHub Pages
npm run deploy
```

## 📋 Prerequisites

1. **GitHub Repository**: The project must be in a GitHub repository
2. **GitHub Pages Enabled**: GitHub Pages must be enabled in repository settings
3. **Node.js**: Version 20 or higher
4. **npm**: Latest version

## ⚙️ Configuration

### GitHub Pages Settings

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Set **Source** to "GitHub Actions"
4. Save the settings

### Build Configuration

The project includes a special build configuration for GitHub Pages:

- **Configuration**: `github-pages`
- **Base Href**: `/strive/`
- **Output Directory**: `dist/strive`
- **Service Worker**: Enabled
- **PWA**: Enabled

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build:github` | Build the app for GitHub Pages deployment |
| `npm run deploy` | Build and deploy to GitHub Pages manually |
| `npm run test:ci` | Run tests in CI mode (headless) |

## 🌐 Deployment URLs

After successful deployment, your application will be available at:

```
https://[your-username].github.io/strive/
```

## 🔍 Troubleshooting

### Common Issues

1. **404 Error on Routes**
   - Ensure `baseHref` is set to `/strive/` in `angular.json`
   - Check that GitHub Pages is serving from the correct directory

2. **Assets Not Loading**
   - Verify that the build output directory is `dist/strive`
   - Check that all assets are included in the build

3. **Service Worker Issues**
   - Ensure `ngsw-config.json` is properly configured
   - Check that the service worker is enabled in the build configuration

4. **Telegram Web App Integration**
   - Verify that the Telegram Web App API is accessible from the deployed domain
   - Check CORS settings if needed

### Build Failures

If the build fails:

1. **Check Dependencies**
   ```bash
   npm ci
   ```

2. **Run Tests Locally**
   ```bash
   npm run test:ci
   ```

3. **Check Linting**
   ```bash
   npm run lint
   ```

4. **Verify Build Configuration**
   ```bash
   npm run build:github
   ```

## 📊 Monitoring

### GitHub Actions

Monitor deployment status in the **Actions** tab of your GitHub repository:

1. Go to your repository
2. Click on **Actions** tab
3. View the "Deploy to GitHub Pages" workflow
4. Check for any failures or warnings

### Application Health

After deployment, verify:

- [ ] Application loads correctly
- [ ] All routes work (try navigating to different pages)
- [ ] PWA functionality works
- [ ] Service Worker is active
- [ ] Telegram Web App integration works
- [ ] All assets load properly

## 🔄 Rollback

If you need to rollback to a previous version:

1. Go to your repository's **Actions** tab
2. Find the successful deployment you want to rollback to
3. Click on the deployment
4. Click **Re-run jobs** to redeploy that version

## 📝 Notes

- The deployment process runs tests before building
- Only successful builds are deployed
- The workflow uses Node.js 20 for consistency
- All dependencies are cached for faster builds
- The deployment is configured to use the latest GitHub Pages actions

## 🆘 Support

If you encounter issues:

1. Check the GitHub Actions logs
2. Verify your repository settings
3. Ensure all dependencies are up to date
4. Check the troubleshooting section above

For additional help, refer to:
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Angular Deployment Guide](https://angular.io/guide/deployment)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
