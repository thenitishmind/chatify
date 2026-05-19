const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { verifyAndSync, updateProfile, checkUsername, uploadAvatar, logout } = require('../controllers/authController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP allowed'), false);
  }
});

router.post('/verify', authenticate, verifyAndSync);
router.put('/profile', authenticate, updateProfile);
router.get('/check-username/:username', authenticate, checkUsername);
router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);
router.post('/logout', authenticate, logout);

module.exports = router;
