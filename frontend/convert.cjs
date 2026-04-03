const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <linearGradient id="cStroke" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#bg)"/>
  <path d="M44 19a18 18 0 1 0 0 26" fill="none" stroke="url(#cStroke)" stroke-width="7" stroke-linecap="round"/>
  <path d="M40 38.5l7.5 5.2v-9.4z" fill="#22d3ee"/>
  <circle cx="42.5" cy="25.5" r="1.7" fill="#a7f3d0"/>
  <circle cx="47" cy="25.5" r="1.7" fill="#a7f3d0"/>
</svg>`;

const publicDir = path.join(__dirname, 'public');

async function convert() {
  try {
    // Create a 1200x630 JPG for Open Graph
    const svgBuffer = Buffer.from(svgContent);
    
    await sharp(svgBuffer)
      .resize(1200, 630, {
        fit: 'contain',
        background: { r: 24, g: 24, b: 27, alpha: 1 }
      })
      .jpeg({ quality: 90 })
      .toFile(path.join(publicDir, 'cipher-favicon.jpg'));
    
    console.log('✅ Created cipher-favicon.jpg (1200x630)');
    
    // Also create a PNG version
    await sharp(svgBuffer)
      .resize(1200, 630, {
        fit: 'contain',
        background: { r: 24, g: 24, b: 27, alpha: 1 }
      })
      .png()
      .toFile(path.join(publicDir, 'cipher-favicon-og.png'));
    
    console.log('✅ Created cipher-favicon-og.png (1200x630)');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

convert();

