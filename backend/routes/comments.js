const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/commentsController');

router.get('/', commentsController.index);
router.delete('/:id', commentsController.remove);

module.exports = router;
