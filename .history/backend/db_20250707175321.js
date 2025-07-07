import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import './syncModels.js';

// =====
const app = express(); // 建立 Express 應用程式
app.use(cors()); // 讓前端 React 可以存取這個express應用程式

const port = 3001; // 後端改用 3001 port，避免與前端衝突

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

// Attraction (主鍵 a_id)
app.get('/api/attractions/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT * FROM Attraction WHERE a_id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Business (複合主鍵 a_id, t_id, w_day, period)
app.get('/api/business', (req, res) => {
  const { a_id, t_id, w_day, period } = req.query;
  connection.query(
    'SELECT * FROM Business WHERE a_id = ? AND t_id = ? AND w_day = ? AND period = ?',
    [a_id, t_id, w_day, period],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// Evaluate (無單一主鍵，靠 u_id, s_id, t_id 查詢)
app.get('/api/evaluate', (req, res) => {
  const { u_id, s_id, t_id } = req.query;
  connection.query(
    'SELECT * FROM Evaluate WHERE u_id = ? AND s_id = ? AND t_id = ?',
    [u_id, s_id, t_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// Include2 (主鍵 s_id, a_id, t_id)
app.get('/api/include2', (req, res) => {
  const { s_id, a_id, t_id } = req.query;
  connection.query(
    'SELECT * FROM Include2 WHERE s_id = ? AND a_id = ? AND t_id = ?',
    [s_id, a_id, t_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// Join (主鍵 u_id, t_id)
app.get('/api/join', (req, res) => {
  const { u_id, t_id } = req.query;
  connection.query(
    'SELECT * FROM Join WHERE u_id = ? AND t_id = ?',
    [u_id, t_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// Schedule (主鍵 s_id)
app.get('/api/schedules/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT * FROM Schedule WHERE s_id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Support (主鍵 u_id, a_id)
app.get('/api/support', (req, res) => {
  const { u_id, a_id } = req.query;
  connection.query(
    'SELECT * FROM Support WHERE u_id = ? AND a_id = ?',
    [u_id, a_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// Trip (主鍵 t_id)
app.get('/api/trips/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT * FROM Trip WHERE t_id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// User (主鍵 u_id)
app.get('/api/users/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT * FROM User WHERE u_id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Weekday (主鍵 w_day)
app.get('/api/weekdays/:day', (req, res) => {
  const day = req.params.day;
  connection.query('SELECT * FROM Weekday WHERE w_day = ?', [day], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});


// 啟動伺服器
app.listen(port, () => {
  console.log(`伺服器啟動於 http://localhost:${port}`);
});

