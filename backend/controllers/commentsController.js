const commentService = require('../services/commentService');

async function index(req, res) {
  try {
    const comments = await commentService.listAll();
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    await commentService.remove(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { index, remove };
