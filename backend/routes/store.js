const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

router.get('/', storeController.index);
router.post('/', storeController.create);
router.put('/:id', storeController.update);
router.delete('/:id', storeController.remove);

module.exports = router;
