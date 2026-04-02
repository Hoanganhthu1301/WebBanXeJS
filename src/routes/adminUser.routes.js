const express = require('express');
const router = express.Router();

const {
  getUsers,
  getUserDetail,
  toggleBlockUser
} = require('../controllers/adminUser.controller');

const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, isAdmin, getUsers);
router.get('/:id', verifyToken, isAdmin, getUserDetail);
router.put('/:id/toggle-block', verifyToken, isAdmin, toggleBlockUser);

module.exports = router;