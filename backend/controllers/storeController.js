const storeService = require('../services/storeService');
const imageService = require('../services/imageService');

async function index(req, res) {
  try {
    res.json(await storeService.listProducts());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    res.json(await storeService.createProduct(req.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    res.json(await storeService.updateProduct(req.params.id, req.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    await storeService.deleteProduct(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function uploadImage(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'ما فيه صورة مرفوعة' });
    const url = await imageService.uploadProductImage(req.file);
    res.json({ ok: true, url });
  } catch (err) {
    res.status(500).json({ error: 'ما قدرنا نرفع الصورة - تأكد إن bucket "product-images" موجود وشغال (شوف README)' });
  }
}

module.exports = { index, create, update, remove, uploadImage };
