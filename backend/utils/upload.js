const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer keeps the file in memory so we can stream it straight to Cloudinary/R2.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB ceiling
});

/** Uploads an in-memory file buffer to Cloudinary. Returns the secure_url. */
function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `mycollegegenie/${folder}`, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// Cloudflare R2 (S3-compatible) client — used for PDF study material 
const r2Configured = !!(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME
);

const r2Client = r2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

function buildR2Key(folder, originalFilename) {
  const safeName = (originalFilename || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${folder}/${Date.now()}-${uuidv4()}-${safeName}`;
}

function r2PublicUrlFor(key) {
  const base = process.env.R2_PUBLIC_URL || '';
  return `${base.replace(/\/$/, '')}/${key}`;
}

/** Generates a presigned PUT URL so the browser can upload a PDF directly to R2. */
async function createPresignedR2Upload({ filename, mimeType, folder }) {
  if (!r2Configured) throw new Error('R2 not configured on the server.');
  const key = buildR2Key(folder || 'resources', filename);
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: mimeType || 'application/pdf',
  });
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
  const fileUrl = r2PublicUrlFor(key);
  return { uploadUrl, fileUrl, key };
}

/** Uploads a buffer directly to R2 (fallback multi-hop path for PDFs). */
async function uploadBufferToR2(buffer, mimeType, folder, originalFilename) {
  if (!r2Configured) throw new Error('R2 not configured on the server.');
  const key = buildR2Key(folder || 'resources', originalFilename);
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType || 'application/octet-stream',
    })
  );
  return r2PublicUrlFor(key);
}

module.exports = {
  upload,
  uploadBufferToCloudinary,
  createPresignedR2Upload,
  uploadBufferToR2,
  r2Configured,
};
