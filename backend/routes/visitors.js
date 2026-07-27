const express = require('express');
const router = express.Router();
const visitorsController = require('../controllers/visitorsController');

router.get('/', visitorsController.index);

module.exports = router;
