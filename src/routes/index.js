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
router.use('/brands', require('./brand.routes'));

router.use('/contacts', require('./contact.routes'));


module.exports = router;