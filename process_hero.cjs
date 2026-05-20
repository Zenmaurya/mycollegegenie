const sharp = require('sharp');

const inputPath = 'C:\\Users\\MOHD IMRN\\.gemini\\antigravity\\brain\\32f3c455-eb3c-44cd-a744-cb965f7bdb9a\\media__1778612597822.png';
const outputPath = 'public/hero-students.webp';

async function processHeroImage() {
  try {
    await sharp(inputPath)
      .webp({ quality: 85 })
      .toFile(outputPath);
      
    console.log('Successfully created hero-students.webp from new image');
  } catch (err) {
    console.error('Error:', err);
  }
}

processHeroImage();
