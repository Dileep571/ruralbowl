// Image Upload Service using Cloudinary
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret',
});

// Use memory storage for multer and upload buffers directly to Cloudinary
const memoryStorage = multer.memoryStorage();

// Multer upload middleware (uses memory storage so we can upload via buffer)
const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
});

// Alias for explicit memory upload usage
const uploadMemory = upload;

// Upload single image to Cloudinary
const uploadToCloudinary = async (file, folder = 'ruralbowl/products') => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      if (file.buffer) {
        uploadStream.end(file.buffer);
      } else {
        reject(new Error('File buffer is required'));
      }
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Upload multiple images
const uploadMultipleToCloudinary = async (files, folder = 'ruralbowl/products') => {
  try {
    const uploadPromises = files.map(file => uploadToCloudinary(file, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw error;
  }
};

// Delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

// Delete multiple images
const deleteMultipleFromCloudinary = async (publicIds) => {
  try {
    const deletePromises = publicIds.map(id => deleteFromCloudinary(id));
    return await Promise.all(deletePromises);
  } catch (error) {
    console.error('Multiple delete error:', error);
    throw error;
  }
};

// Get image URL with transformations
const getImageUrl = (publicId, transformation = {}) => {
  return cloudinary.url(publicId, transformation);
};

// Get optimized thumbnail URL
const getThumbnailUrl = (publicId) => {
  return cloudinary.url(publicId, {
    width: 200,
    height: 200,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
  });
};

// Extract public ID from Cloudinary URL
const extractPublicId = (url) => {
  try {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    const folder = parts.slice(-3, -1).join('/');
    return `${folder}/${publicId}`;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

// Image upload controller for API routes
const handleImageUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload buffer to Cloudinary
    const result = await uploadToCloudinary(req.file);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      image: {
        url: result.secure_url || result.url,
        publicId: result.public_id,
        thumbnail: getThumbnailUrl(result.public_id),
      },
    });
  } catch (error) {
    console.error('Upload handler error:', error);
    res.status(500).json({ 
      message: 'Failed to upload image',
      error: error.message 
    });
  }
};

// Multiple images upload controller
const handleMultipleImageUpload = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Upload all buffers to Cloudinary
    const results = await uploadMultipleToCloudinary(req.files);
    const images = results.map(r => ({
      url: r.secure_url || r.url,
      publicId: r.public_id,
      thumbnail: getThumbnailUrl(r.public_id),
    }));

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      images,
    });
  } catch (error) {
    console.error('Multiple upload handler error:', error);
    res.status(500).json({ 
      message: 'Failed to upload images',
      error: error.message 
    });
  }
};

// Delete image controller
const handleImageDelete = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }

    await deleteFromCloudinary(publicId);

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Delete handler error:', error);
    res.status(500).json({ 
      message: 'Failed to delete image',
      error: error.message 
    });
  }
};

module.exports = {
  cloudinary,
  upload,
  uploadMemory,
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  getImageUrl,
  getThumbnailUrl,
  extractPublicId,
  handleImageUpload,
  handleMultipleImageUpload,
  handleImageDelete,
};
