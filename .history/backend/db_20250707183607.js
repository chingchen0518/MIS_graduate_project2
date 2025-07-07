// db.js
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import './syncModels.js';

const app = express();
app.use(cors());

const port = 3001;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '20250101',
  database: 'travel'
});

connection.connect(err => {
  if (err) {
    console.error('❌ 連線失敗：', err.message);
    return;
  }
  console.log('✅ 成功連線到 MySQL 資料庫！');
});

// 新增 API 路由，撈取旅遊行程（Trip）資料
app.get('/api/travel', (req, res) => {
  const sql = `
    SELECT t.t_id, t.title, t.country, t.stage, t.s_date, t.e_date,
           u.u_name AS creator_name
    FROM Trip t
    JOIN User u ON t.u_id = u.u_id
  `;
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('查詢失敗:', err);
      return res.status(500).json({ error: '資料庫查詢失敗' });
    }
    // 格式化資料，方便前端使用
    const trips = results.map(row => ({
      t_id: row.t_id,
      title: row.title,
      country: row.country,
      stage: row.stage,
      s_date: row.s_date,
      e_date: row.e_date,
      Creator: { u_name: row.creator_name }
    }));
    res.json(trips);
  });
});

// 啟動伺服器
app.listen(port, () => {
  console.log(`伺服器啟動於 http://localhost:${port}`);
});
