const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier');
const Logger = require('../core/utils/logger');

const cloudinaryConfig = {
  secure: true
};

if (process.env.CLOUDINARY_URL) {
  cloudinaryConfig.cloudinary_url = process.env.CLOUDINARY_URL;
}
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinaryConfig.cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
}
if (process.env.CLOUDINARY_API_KEY) {
  cloudinaryConfig.api_key = process.env.CLOUDINARY_API_KEY;
}
if (process.env.CLOUDINARY_API_SECRET) {
  cloudinaryConfig.api_secret = process.env.CLOUDINARY_API_SECRET;
}

cloudinary.config(cloudinaryConfig);

function isCloudinaryConfigured() {
  const config = cloudinary.config();
  return Boolean(
    process.env.CLOUDINARY_URL ||
    (config.cloud_name && config.api_key && config.api_secret)
  );
}

function ensureCloudinaryConfigured() {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary غير مهيأ: الرجاء تعيين CLOUDINARY_CLOUD_NAME و CLOUDINARY_API_KEY و CLOUDINARY_API_SECRET أو CLOUDINARY_URL'
    );
  }
}

function uploadBuffer(buffer, options = {}) {
  ensureCloudinaryConfigured();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({
      resource_type: 'image',
      ...options
    }, (error, result) => {
      if (error) {
        Logger.error('Cloudinary upload failed', error);
        return reject(error);
      }
      resolve(result);
    });

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

function extractPublicId(url) {
  if (!url || typeof url !== 'string') return null;
  const pattern = /\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?(?:\?.*)?$/;
  const match = url.match(pattern);
  return match ? match[1] : null;
}

async function deleteResource(url, options = {}) {
  const publicId = extractPublicId(url);
  if (!publicId) {
    Logger.warn('Cloudinary delete skipped because public_id could not be extracted', { url });
    return null;
  }

  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      ...options
    });
  } catch (error) {
    Logger.error('Cloudinary delete failed', error);
    return null;
  }
}

module.exports = {
  uploadBuffer,
  deleteResource,
  extractPublicId,
  isCloudinaryConfigured
};
