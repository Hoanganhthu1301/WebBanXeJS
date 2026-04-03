const express = require('express');
const router = express.Router();
const uploadAvatar = require("../middlewares/avatarUpload.middleware");

const {
  register,
  login,
  getProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  updateProfile,
  googleLogin
} = require('../controllers/auth.controller');

const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', verifyToken, getProfile);
router.put('/change-password', verifyToken, changePassword);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/google-login', googleLogin);

router.put(
  '/profile',
  verifyToken,
  uploadAvatar.single('avatar'),
  updateProfile
);

module.exports = router;