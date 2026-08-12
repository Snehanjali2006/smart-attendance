const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, '..', 'public', 'uploads', 'profile_photos');
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}_${req.params.id}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const mime = allowed.test(file.mimetype);
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  
  if (mime && ext) {
    return cb(null, true);
  }
  cb(new Error('Invalid file type. Only JPEG, PNG, WebP allowed.'));
};

module.exports = multer({ 
  storage, 
  fileFilter, 
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
});
