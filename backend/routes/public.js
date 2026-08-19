const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/products', publicController.listProducts);
router.post('/orders', publicController.createOrder);

module.exports = router;
