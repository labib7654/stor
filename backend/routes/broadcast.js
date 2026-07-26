const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { broadcastMessage } = require('../services/telegramService');

router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'الرسالة فاضية' });

    const { data: users, error } = await supabase.from('users').select('telegram_id').eq('is_banned', false);
    if (error) throw error;

    const chatIds = users.map((u) => u.telegram_id);
    const result = await broadcastMessage(chatIds, text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
