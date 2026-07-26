const statsService = require('../services/statsService');

async function overview(req, res) {
  try {
    const data = await statsService.getOverview();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { overview };
