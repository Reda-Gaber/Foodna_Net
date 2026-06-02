const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier');
const Logger = require('../core/utils/logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

function uploadBuffer(buffer, options = {}) {
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
  extractPublicId
};
