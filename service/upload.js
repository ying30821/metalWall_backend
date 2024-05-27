const multer = require('multer');
const path = require('path');
const validateUploadImg = multer({
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.jpg' && ext !== '.png' && ext !== '.jpeg') {
      cb(
        'Uploaded file is not a valid image. Only JPG, PNG and JPEG files are allowed.'
      );
    }
    cb(null, true);
  },
}).any();

module.exports = validateUploadImg;
