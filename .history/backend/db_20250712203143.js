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
    console.error('❌ 資料庫連線失敗：', err.message);
    return;
  }
  console.log('✅ 成功連線到 MySQL 資料庫！');
});


// 處理日期（只要 YYYY-MM-DD）
function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// API endpoint

// app.get('/api/students/:id', (req, res) => {
//   const studentId = req.params.id; // 取得 URL 上的 id


// function formatFullDateTime(dateTimeStr) {
//   if (!dateTimeStr) return null;
//   const d = new Date(dateTimeStr);

//   const year = d.getFullYear();
//   const month = `${d.getMonth() + 1}`.padStart(2, '0');
//   const day = `${d.getDate()}`.padStart(2, '0');
//   const hours = `${d.getHours()}`.padStart(2, '0');
//   const minutes = `${d.getMinutes()}`.padStart(2, '0');
//   const seconds = `${d.getSeconds()}`.padStart(2, '0');

//   return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
// }

app.get('/api/travel', (req, res) => {
  const results = {};
  const queries = [
    { key: 'users', sql: 'SELECT * FROM User' },
    { key: 'trips', sql: 'SELECT * FROM Trip' },
    { key: 'schedules', sql: 'SELECT * FROM Schedule' },
    { key: 'attractions', sql: 'SELECT * FROM Attraction' },
    { key: 'weekdays', sql: 'SELECT * FROM Weekday' },
    { key: 'joins', sql: 'SELECT * FROM `Join`' },
    { key: 'include2s', sql: 'SELECT * FROM Include2' },
    { key: 'evaluates', sql: 'SELECT * FROM Evaluate' },
    { key: 'supports', sql: 'SELECT * FROM Support' },
    { key: 'businesses', sql: 'SELECT * FROM Business' },
    { key: 'hotels', sql: 'SELECT * FROM Hotel' }
  ];

  let completed = 0;
  let hasError = false;

  queries.forEach(({ key, sql }) => {
    connection.query(sql, (err, rows) => {
      if (hasError) return;

      if (err) {
        hasError = true;
        console.error(`❌ 查詢 ${key} 時出錯：`, err.message);
        return res.status(500).json({ error: `查詢 ${key} 失敗：${err.message}` });
      }

  if (key === 'trips') {
    rows = rows.map(row => ({
      ...row,
      s_date: formatDate(row.s_date),
      e_date: formatDate(row.e_date),
      stage_date: formatFullDateTime(row.stage_date)
    }));
  }
  if (key === 'hotels') {
    rows = rows.map(row => ({
      ...row,
      cin_time: formatFullDateTime(row.cin_),
      cout_time: formatFullDateTime(row.stage_date)
    }));
  }

    if (key === 'schedules') {
      rows = rows.map(row => ({
        ...row,
        date: formatDate(row.date)
      }));
    }


      results[key] = rows;
      completed++;

      if (completed === queries.length) {
        res.json(results);
      }
    });
  });
});

app.listen(port, () => {
  console.log(`伺服器啟動於 http://localhost:${port}`);
});
