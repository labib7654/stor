const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

router.get('/', usersController.index);
router.post('/:telegramId/ban', usersController.ban);
router.post('/:telegramId/unban', usersController.unban);

module.exports = router;
