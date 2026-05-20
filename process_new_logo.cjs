const sharp = require('sharp');
const fs = require('fs');

const inputPath = 'C:\\Users\\MOHD IMRN\\.gemini\\antigravity\\brain\\32f3c455-eb3c-44cd-a744-cb965f7bdb9a\\media__1778611508423.png';
const logoOutputPath = 'public/logo.webp';
const faviconOutputPath = 'public/favicon.png';

async function processLogo() {
  try {
    // 1. Process for the main logo in WebP format
    // Sharp does not have a magical "remove background" out of the box, 
    // but we can make near-white pixels transparent.
    
    // First let's just resize it properly or use composite.
    // The previous prompt said "background bhe remove kar doge? wo white background?".
    // I can do a simple pixel iteration, or since the image is likely a genie on a white background,
    // I can extract the alpha channel using sharp. But the safest and most effective way for a white background 
    // in node is to use raw pixels and set alpha to 0 if the pixel is close to white.

    const { data, info } = await sharp(inputPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Loop through pixels and make near-white pixels transparent
    // Tolerance can be around 240-255
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // If pixel is very close to white, make it transparent
      if (r > 240 && g > 240 && b > 240) {
        data[i + 3] = 0; // Set alpha to 0
      }
    }

    // Save as logo.webp
    await sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: info.channels
      }
    })
    .webp({ quality: 90 }) // webp for fast loading
    .toFile(logoOutputPath);
    
    console.log('Successfully created logo.webp');

    // Save as favicon.png
    await sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: info.channels
      }
    })
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(faviconOutputPath);
    
    console.log('Successfully created favicon.png');

  } catch (error) {
    console.error('Error processing image:', error);
  }
}

processLogo();
