#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICON_SIZES = [
  { size: 180, name: 'apple-touch-icon', description: 'iOS Home Screen' },
  { size: 192, name: 'icon-192x192', description: 'Android Chrome' },
  { size: 512, name: 'icon-512x512', description: 'PWA Splash Screen' },
  { size: 120, name: 'icon-120x120', description: 'iPhone Retina' },
  { size: 152, name: 'icon-152x152', description: 'iPad Retina' },
  { size: 167, name: 'icon-167x167', description: 'iPad Pro' },
  { size: 72, name: 'icon-72x72', description: 'Android Chrome' },
  { size: 96, name: 'icon-96x96', description: 'Google TV' },
  { size: 128, name: 'icon-128x128', description: 'Chrome Web Store' },
  { size: 144, name: 'icon-144x144', description: 'Android Chrome' },
  { size: 256, name: 'icon-256x256', description: 'Progressive Web App' },
  { size: 384, name: 'icon-384x384', description: 'Android Chrome' },
  { size: 512, name: 'icon-512x512-maskable', maskable: true, description: 'Android Maskable' }
];

const THEME_COLOR = { r: 59, g: 130, b: 246, alpha: 1 };

const INPUT_SVG = path.join(__dirname, '..', 'public', 'icons', 'logo.svg');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function generateFavicon() {
  const faviconPath = path.join(__dirname, '..', 'public', 'favicon.ico');
  
  try {
    await sharp(INPUT_SVG)
      .resize(32, 32)
      .png()
      .toFile(faviconPath);
    
    console.log('✓ Generated favicon.ico');
  } catch (error) {
    console.error('✗ Error generating favicon:', error.message);
  }
}

async function generateIcons() {
  console.log('🎨 Starting PWA icon generation...\n');
  
  if (!fs.existsSync(INPUT_SVG)) {
    console.error(`❌ Error: Logo file not found at ${INPUT_SVG}`);
    console.error('Please create a logo.svg file in public/icons/ directory');
    process.exit(1);
  }
  
  ensureDirectoryExists(OUTPUT_DIR);
  
  console.log(`📁 Input: ${INPUT_SVG}`);
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const { size, name, maskable, description } of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `${name}.png`);
    
    try {
      if (maskable) {
        const paddedSize = Math.round(size * 0.8);
        const padding = Math.round((size - paddedSize) / 2);
        
        await sharp(INPUT_SVG)
          .resize(paddedSize, paddedSize)
          .extend({
            top: padding,
            bottom: padding,
            left: padding,
            right: padding,
            background: THEME_COLOR
          })
          .png()
          .toFile(outputPath);
      } else {
        await sharp(INPUT_SVG)
          .resize(size, size)
          .png()
          .toFile(outputPath);
      }
      
      console.log(`✓ ${name}.png (${size}x${size}) - ${description}`);
      successCount++;
    } catch (error) {
      console.error(`✗ ${name}.png - Error: ${error.message}`);
      errorCount++;
    }
  }
  
  await generateFavicon();
  
  console.log('\n📊 Summary:');
  console.log(`✓ Successfully generated: ${successCount} icons`);
  if (errorCount > 0) {
    console.log(`✗ Failed: ${errorCount} icons`);
  }
  
  console.log('\n✅ Icon generation complete!');
  console.log('\n💡 Tips:');
  console.log('- Test the icons on real devices');
  console.log('- Clear browser cache after updating icons');
  console.log('- Use PNG or SVG format for the source logo');
  console.log('- For best results, use a square logo with transparent background');
}

generateIcons().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});