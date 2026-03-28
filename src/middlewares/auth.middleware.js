const User = require('../models/user.model');
const { verifyAccessToken } = require('../utils/jwt');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Không có token, truy cập bị từ chối'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select('-password');

    if (!user || user.isDeleted) {
      return res.status(401).json({
        message: 'Người dùng không tồn tại'
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: 'Tài khoản đã bị khóa'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Token không hợp lệ',
      error: error.message
    });
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Bạn không có quyền admin'
    });
  }

  next();
};

module.exports = {
  verifyToken,
  isAdmin
};