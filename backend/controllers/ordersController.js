const orderService = require('../services/orderService');

async function index(req, res) {
  try {
    const { status } = req.query;
    res.json(await orderService.listOrders({ status }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    res.json(await orderService.updateOrderStatus(id, status));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { index, updateStatus };
