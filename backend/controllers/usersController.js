const userService = require('../services/userService');

async function index(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const result = await userService.listUsers({ page, search });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function ban(req, res) {
  try {
    const { telegramId } = req.params;
    const { reason } = req.body;
    const data = await userService.banUser(telegramId, reason);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function unban(req, res) {
  try {
    const { telegramId } = req.params;
    const data = await userService.unbanUser(telegramId);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { index, ban, unban };
