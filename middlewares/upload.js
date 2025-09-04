const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../utils/s3');
const path = require('path');

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read',
    key: function (req, file, cb) {
      cb(null, `movies/${Date.now()}_${file.originalname}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.mp4', '.mp3'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only images and mp4 videos are allowed'));
    }
  }
});

module.exports = upload;
