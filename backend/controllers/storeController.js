const storeService = require('../services/storeService');

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

module.exports = { index, create, update, remove };
