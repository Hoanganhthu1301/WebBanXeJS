const express = require('express');
const router = express.Router();

const {
  getMyFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavorite,
  toggleFavorite
} = require('../controllers/favorite.controller');

const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, getMyFavorites);
router.get('/check/:carId', verifyToken, checkFavorite);
router.post('/toggle/:carId', verifyToken, toggleFavorite);
router.post('/:carId', verifyToken, addToFavorites);
router.delete('/:carId', verifyToken, removeFromFavorites);

module.exports = router;