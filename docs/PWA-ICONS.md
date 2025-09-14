# PWA Icons Guide

This guide explains how to manage and update PWA icons for the Strive application.

## Overview

The application uses a comprehensive set of icons for Progressive Web App (PWA) functionality, including:
- App icons for iOS and Android home screens
- Icons for different device resolutions
- Maskable icons for Android adaptive icons
- Apple touch icons for iOS

## Icon Requirements

### Source Logo
- **File**: `public/icons/logo.svg`
- **Format**: SVG (preferred) or high-resolution PNG
- **Dimensions**: Square aspect ratio
- **Design**: Should work well at small sizes (clear, simple design)
- **Background**: Transparent background recommended

### Generated Icons
The script generates the following icons:

| Size | Filename | Purpose |
|------|----------|---------|
| 32x32 | favicon.ico | Browser tab icon |
| 72x72 | icon-72x72.png | Android Chrome |
| 96x96 | icon-96x96.png | Google TV |
| 120x120 | icon-120x120.png | iPhone Retina |
| 128x128 | icon-128x128.png | Chrome Web Store |
| 144x144 | icon-144x144.png | Android Chrome |
| 152x152 | icon-152x152.png | iPad Retina |
| 167x167 | icon-167x167.png | iPad Pro |
| 180x180 | apple-touch-icon.png | iOS Home Screen |
| 192x192 | icon-192x192.png | Android Chrome |
| 256x256 | icon-256x256.png | Progressive Web App |
| 384x384 | icon-384x384.png | Android Chrome |
| 512x512 | icon-512x512.png | PWA Splash Screen |
| 512x512 | icon-512x512-maskable.png | Android Adaptive Icon |

## How to Update Icons

### 1. Replace the Logo
Replace the source logo file:
```bash
# Add your new logo
cp /path/to/your/logo.svg public/icons/logo.svg
```

### 2. Generate All Icon Sizes
Run the generation script:
```bash
npm run generate:icons
```

### 3. Verify Generation
Check that all icons were generated:
```bash
ls -la public/icons/
```

### 4. Test the Icons

#### On iOS:
1. Deploy the app or run locally with HTTPS
2. Open in Safari on iOS device
3. Tap Share → Add to Home Screen
4. Verify the icon appears correctly

#### On Android:
1. Open in Chrome on Android device
2. Tap menu → Add to Home Screen
3. Verify the icon appears correctly

### 5. Clear Cache
After updating icons, users may need to:
- Clear browser cache
- Remove and re-add the PWA to home screen
- Wait for Service Worker to update (automatic)

## Troubleshooting

### Common Issues

1. **Icons not updating on devices**
   - Clear browser cache
   - Increment version in `ngsw-config.json`
   - Remove and re-install PWA

2. **Logo file not found error**
   - Ensure `public/icons/logo.svg` exists
   - Check file permissions

3. **Generation fails**
   - Ensure `sharp` dependencies are installed: `npm install`
   - Check Node.js version (requires Node 14+)

### Manual Icon Creation

If the script fails, you can manually create icons using online tools:
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [PWA Icon Generator](https://www.pwabuilder.com/imageGenerator)

## Best Practices

1. **Logo Design**
   - Use simple, recognizable design
   - Ensure good contrast
   - Test at small sizes
   - Avoid thin lines or small text

2. **File Optimization**
   - Icons are automatically optimized by sharp
   - No need for manual compression

3. **Version Control**
   - Commit generated icons to git
   - Keep source logo.svg in version control

4. **Testing**
   - Test on real devices, not just simulators
   - Check both light and dark themes
   - Verify on different OS versions

## Theme Color

The app uses `#3B82F6` (blue) as the theme color. This is configured in:
- `manifest.webmanifest` - theme_color
- `index.html` - meta theme-color
- Maskable icon background

To change the theme color, update it in:
1. `scripts/generate-pwa-icons.cjs` - THEME_COLOR constant
2. `public/manifest.webmanifest` - theme_color field
3. `src/index.html` - theme-color meta tag

## Related Files

- **Source**: `public/icons/logo.svg`
- **Script**: `scripts/generate-pwa-icons.cjs`
- **Output**: `public/icons/*.png`, `public/favicon.ico`
- **Manifest**: `public/manifest.webmanifest`
- **HTML**: `src/index.html` (Apple meta tags)