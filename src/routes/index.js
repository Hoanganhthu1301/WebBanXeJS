const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');

router.get('/test', (req, res) => {
  res.json({
    message: 'API test success'
  });
});

router.use('/auth', authRoutes);
router.use('/cars', require('./car.routes'));
router.use('/categories', require('./category.routes'));

module.exports = router;