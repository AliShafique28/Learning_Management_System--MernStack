const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directories if they don't exist
const createUploadDirs = () => {
  const dirs = ['./uploads/videos', './uploads/assignments'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine destination based on file type
    if (file.fieldname === 'video') {
      cb(null, './uploads/videos');
    } else if (file.fieldname === 'assignment') {
      cb(null, './uploads/assignments');
    } else {
      cb(null, './uploads');
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter - validate file types
const fileFilter = (req, file, cb) => {
  // Video uploads
  if (file.fieldname === 'video') {
    const allowedVideoTypes = /mp4|avi|mov|mkv|webm/;
    const extname = allowedVideoTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedVideoTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed (mp4, avi, mov, mkv, webm)'));
    }
  }

  // Assignment uploads (DOCX only)
  if (file.fieldname === 'assignment') {
    const allowedDocTypes = /docx/;
    const extname = allowedDocTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only DOCX files are allowed for assignments'));
    }
  }

  cb(new Error('Invalid file field'));
};

// Multer upload configurations
const uploadVideo = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_VIDEO_SIZE) || 100 * 1024 * 1024 // 100MB default
  },
  fileFilter: fileFilter
}).single('video');

const uploadAssignment = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: fileFilter
}).single('assignment');

// Error handler middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

module.exports = {
  uploadVideo,
  uploadAssignment,
  handleUploadError
};
