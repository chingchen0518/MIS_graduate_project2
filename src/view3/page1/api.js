// Express 路由範例
const express = require('express');
const router = express.Router();
const db = require('../../db'); // 假設有 db 連線

router.post('/api/evaluate/max-good-bad', async (req, res) => {
  const { tid } = req.body;
  try {
    const rows = await db.query(
      'SELECT s_id, (good-bad) AS score FROM evaluate WHERE t_id = ?',
      [tid]
    );
    if (!rows.length) return res.json({ maxSids: [] });

    const maxScore = Math.max(...rows.map(r => r.score));
    const maxSids = rows.filter(r => r.score === maxScore).map(r => r.s_id);
    res.json({ maxSids });
  } catch (err) {
    res.status(500).json({ error: '資料庫錯誤' });
  }
});

module.exports = router;