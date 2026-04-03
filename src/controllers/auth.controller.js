const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user.model');
const {
  generateAccessToken,
  generateResetToken,
  verifyResetToken
} = require('../utils/jwt');
const { validatePassword } = require('../utils/validate');
const { sendResetPasswordEmail } = require('../utils/mailer');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu'
      });
    }

    const passwordValidation = validatePassword(password);

    if (!passwordValidation.isValid) {
      return res.status(400).json({
        message: `Mật khẩu phải có ${passwordValidation.message}`
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({
        message: 'Email đã tồn tại'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      provider: 'local'
    });

    const token = generateAccessToken(newUser);

    return res.status(201).json({
      message: 'Đăng ký thành công',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        provider: newUser.provider
      },
      token
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi server khi đăng ký',
      error: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login email:', email);
    console.log('Password received:', !!password);

    if (!email || !password) {
      return res.status(400).json({
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    console.log('User found:', !!user);

    if (!user) {
      return res.status(400).json({
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    if (user.isDeleted) {
      return res.status(400).json({
        message: 'Tài khoản không tồn tại'
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: 'Tài khoản đã bị khóa'
      });
    }

    if (user.provider !== 'local') {
      return res.status(400).json({
        message: `Tài khoản này đăng nhập bằng ${user.provider}`
      });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(400).json({
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    const token = generateAccessToken(user);
    console.log('Token generated:', !!token);

    return res.status(200).json({
      message: 'Đăng nhập thành công',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        provider: user.provider
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      message: 'Lỗi server khi đăng nhập',
      error: error.message
    });
  }
};

const getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      message: 'Lấy thông tin cá nhân thành công',
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi server khi lấy profile',
      error: error.message
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới'
      });
    }

    const passwordValidation = validatePassword(newPassword);

    if (!passwordValidation.isValid) {
      return res.status(400).json({
        message: `Mật khẩu mới phải có ${passwordValidation.message}`
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng'
      });
    }

    if (user.provider !== 'local') {
      return res.status(400).json({
        message: 'Tài khoản này không dùng mật khẩu cục bộ để đăng nhập'
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password || '');

    if (!isMatch) {
      return res.status(400).json({
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: 'Mật khẩu mới không được trùng mật khẩu hiện tại'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi server khi đổi mật khẩu',
      error: error.message
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Vui lòng nhập email'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(200).json({
        message: 'Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu'
      });
    }

    if (user.provider !== 'local') {
      return res.status(400).json({
        message: `Tài khoản này đăng nhập bằng ${user.provider}, không dùng đặt lại mật khẩu cục bộ`
      });
    }

    const resetToken = generateResetToken(user);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${encodeURIComponent(
      resetToken
    )}`;

    await sendResetPasswordEmail(user.email, resetLink);

    return res.status(200).json({
      message: 'Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi server khi gửi yêu cầu quên mật khẩu',
      error: error.message
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp token và mật khẩu mới'
      });
    }

    const passwordValidation = validatePassword(newPassword);

    if (!passwordValidation.isValid) {
      return res.status(400).json({
        message: `Mật khẩu mới phải có ${passwordValidation.message}`
      });
    }

    let decoded;

    try {
      decoded = verifyResetToken(token);
    } catch (error) {
      return res.status(400).json({
        message: 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'
      });
    }

    const user = await User.findOne({
      _id: decoded.id,
      email: decoded.email,
      resetPasswordToken: token
    });

    if (!user) {
      return res.status(400).json({
        message: 'Yêu cầu đặt lại mật khẩu không hợp lệ'
      });
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      return res.status(400).json({
        message: 'Token đặt lại mật khẩu đã hết hạn'
      });
    }

    const isSameAsOld = await bcrypt.compare(newPassword, user.password || '');

    if (isSameAsOld) {
      return res.status(400).json({
        message: 'Mật khẩu mới không được trùng mật khẩu hiện tại'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = '';
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({
      message: 'Đặt lại mật khẩu thành công'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi server khi đặt lại mật khẩu',
      error: error.message
    });
  }
};

const googleLogin = async (req, res) => {
  try {
    const idToken = req.body.idToken || req.body.credential;

    if (!idToken) {
      return res.status(400).json({
        message: 'Thiếu Google ID token'
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(400).json({
        message: 'Không lấy được thông tin từ Google'
      });
    }

    const {
      sub: googleId,
      email,
      name,
      email_verified: emailVerified
    } = payload;

    if (!email) {
      return res.status(400).json({
        message: 'Tài khoản Google không cung cấp email'
      });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = await User.create({
        fullName: name || 'Google User',
        email: email.toLowerCase(),
        password: null,
        provider: 'google',
        googleId,
        isEmailVerified: !!emailVerified,
        isBlocked: false,
        isDeleted: false
      });
    } else {
      if (user.isDeleted === true) {
        return res.status(400).json({
          message: 'Tài khoản không tồn tại'
        });
      }

      if (user.isBlocked === true) {
        return res.status(403).json({
          message: 'Tài khoản đã bị khóa'
        });
      }

      if (!user.googleId) {
        user.googleId = googleId;
      }

      if (!user.provider || user.provider === 'local') {
        user.provider = 'google';
      }

      if (!user.fullName && name) {
        user.fullName = name;
      }

      user.isEmailVerified = user.isEmailVerified || !!emailVerified;

      await user.save();
    }

    const token = generateAccessToken(user);

    return res.status(200).json({
      message: 'Đăng nhập Google thành công',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        provider: user.provider
      },
      token
    });
  } catch (error) {
    console.error('Google login error:', error);

    return res.status(500).json({
      message: 'Lỗi server khi đăng nhập bằng Google',
      error: error.message
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullName, phone, address } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    if (req.file) {
      user.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        role: user.role,
        provider: user.provider
      }
    });
  } catch (error) {
    console.error('updateProfile error:', error);

    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật hồ sơ',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  googleLogin,
  updateProfile
};