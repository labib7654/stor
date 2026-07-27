const categoryService = require('../services/categoryService');

async function index(req, res) {
  try {
    res.json(await categoryService.listCategories());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'اكتب اسم القسم' });
    res.json(await categoryService.createCategory(name.trim()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'اكتب اسم القسم' });
    res.json(await categoryService.renameCategory(req.params.id, name.trim()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { index, create, update, remove };
