const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processImage() {
  const inputPath = 'c:\\Users\\MOHD IMRN\\Downloads\\ChatGPT Image May 12, 2026, 11_22_13 PM.png';
  
  if (!fs.existsSync(inputPath)) {
    console.error('File not found:', inputPath);
    return;
  }

  console.log('Processing image...');
  
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Simple background removal (white to transparent)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // If pixel is white-ish, make it transparent
    if (r > 245 && g > 245 && b > 245) {
      data[i + 3] = 0; // alpha = 0
    }
    // Simple anti-aliasing for edges
    else if (r > 230 && g > 230 && b > 230) {
      data[i + 3] = 128; // semi-transparent
    }
  }

  const processedImage = sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  });

  // Save the full logo as WebP for the header
  const logoPath = path.join(__dirname, 'public', 'logo.webp');
  await processedImage
    .trim({ threshold: 0 }) // trim the transparent whitespace around it
    .webp({ quality: 90 })
    .toFile(logoPath);
  console.log('Created logo:', logoPath);

  // Save the favicon (small square)
  const faviconPath = path.join(__dirname, 'public', 'favicon.png');
  await processedImage
    .trim({ threshold: 0 })
    .resize(64, 64, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(faviconPath);
  console.log('Created favicon:', faviconPath);
}

processImage().catch(console.error);
