const User = require('../models/user.model');
const Car = require('../models/car.model');

// GET /api/favorites
const getMyFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'favorites',
        options: { sort: { createdAt: -1 } }
      })
      .select('favorites');

    return res.status(200).json({
      message: 'Lấy danh sách yêu thích thành công',
      favorites: user?.favorites || []
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi server khi lấy danh sách yêu thích',
      error: error.message
    });
  }
};

// POST /api/favorites/:carId
const addToFavorites = async (req, res) => {
  try {
    const { carId } = req.params;

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({
        message: 'Không tìm thấy xe'
      });
    }

    const user = await User.findById(req.user._id);

    const alreadyExists = user.favorites.some(
      (id) => id.toString() === carId
    );

    if (alreadyExists) {
      return res.status(400).json({
        message: 'Xe đã có trong danh sách yêu thích'
      });
    }

    user.favorites.push(carId);
    await user.save();

    return res.status(200).json({
      message: 'Đã thêm vào danh sách yêu thích'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi server khi thêm yêu thích',
      error: error.message
    });
  }
};

// DELETE /api/favorites/:carId
const removeFromFavorites = async (req, res) => {
  try {
    const { carId } = req.params;

    const user = await User.findById(req.user._id);

    user.favorites = user.favorites.filter(
      (id) => id.toString() !== carId
    );

    await user.save();

    return res.status(200).json({
      message: 'Đã xóa khỏi danh sách yêu thích'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi server khi xóa yêu thích',
      error: error.message
    });
  }
};

// GET /api/favorites/check/:carId
const checkFavorite = async (req, res) => {
  try {
    const { carId } = req.params;

    const user = await User.findById(req.user._id).select('favorites');

    const isFavorite = user.favorites.some(
      (id) => id.toString() === carId
    );

    return res.status(200).json({
      isFavorite
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi server khi kiểm tra yêu thích',
      error: error.message
    });
  }
};

// POST /api/favorites/toggle/:carId
const toggleFavorite = async (req, res) => {
  try {
    const { carId } = req.params;

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({
        message: 'Không tìm thấy xe'
      });
    }

    const user = await User.findById(req.user._id);

    const exists = user.favorites.some(
      (id) => id.toString() === carId
    );

    if (exists) {
      user.favorites = user.favorites.filter(
        (id) => id.toString() !== carId
      );
      await user.save();

      return res.status(200).json({
        message: 'Đã xóa khỏi danh sách yêu thích',
        isFavorite: false
      });
    }

    user.favorites.push(carId);
    await user.save();

    return res.status(200).json({
      message: 'Đã thêm vào danh sách yêu thích',
      isFavorite: true
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi server khi cập nhật yêu thích',
      error: error.message
    });
  }
};

module.exports = {
  getMyFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavorite,
  toggleFavorite
};