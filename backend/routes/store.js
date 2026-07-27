const express = require('express');
const router = express.Router();
const multer = require('multer');
const storeController = require('../controllers/storeController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', storeController.index);
router.post('/', storeController.create);
router.put('/:id', storeController.update);
router.delete('/:id', storeController.remove);
router.post('/upload-image', upload.single('image'), storeController.uploadImage);

module.exports = router;
