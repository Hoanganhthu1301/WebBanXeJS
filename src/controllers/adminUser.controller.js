const User = require('../models/user.model');

// GET /api/admin/users?q=
const getUsers = async (req, res) => {
  try {
    const { q = '' } = req.query;

    const query = {
      $and: [
        {
          $or: [
            { isDeleted: false },
            { isDeleted: { $exists: false } }
          ]
        },
        {
          role: 'user'
        }
      ]
    };

    if (q) {
      query.$and.push({
        $or: [
          { fullName: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } }
        ]
      });
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: 'Lấy danh sách người dùng thành công',
      users
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi server khi lấy danh sách người dùng',
      error: error.message
    });
  }
};

// GET /api/admin/users/:id
const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      _id: id,
      role: 'user',
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng'
      });
    }

    return res.status(200).json({
      message: 'Lấy chi tiết người dùng thành công',
      user
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi server khi lấy chi tiết người dùng',
      error: error.message
    });
  }
};

// PUT /api/admin/users/:id/toggle-block
const toggleBlockUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      _id: id,
      role: 'user',
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });

    if (!user) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng'
      });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    return res.status(200).json({
      message: user.isBlocked
        ? 'Đã khóa tài khoản người dùng'
        : 'Đã mở khóa tài khoản người dùng',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi server khi khóa/mở khóa tài khoản',
      error: error.message
    });
  }
};

module.exports = {
  getUsers,
  getUserDetail,
  toggleBlockUser
};