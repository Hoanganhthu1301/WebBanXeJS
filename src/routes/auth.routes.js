const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getProfile,
  changePassword,
  forgotPassword,
  resetPassword,
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

module.exports = router;