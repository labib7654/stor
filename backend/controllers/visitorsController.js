const visitorService = require('../services/visitorService');

async function index(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await visitorService.listVisitors({ page });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { index };
