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

app.get('/api/all-data', async (req, res) => {
  try {
    // 用 Promise 包裝 mysql 查詢，方便 async/await 寫法
    const query = sql => new Promise((resolve, reject) => {
      connection.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // 依序查詢所有 10 個資料表
    const [users, trips, schedules, attractions, weekdays, joins, include2s, evaluates, supports, businesses] = await Promise.all([
      query('SELECT * FROM User'),
      query('SELECT * FROM Trip'),
      query('SELECT * FROM Schedule'),
      query('SELECT * FROM Attraction'),
      query('SELECT * FROM Weekday'),
      query('SELECT * FROM `Join`'),
      query('SELECT * FROM Include2'),
      query('SELECT * FROM Evaluate'),
      query('SELECT * FROM Support'),
      query('SELECT * FROM Business')
    ]);

    // 將所有資料包成一個物件回傳
    res.json({
      users,
      trips,
      schedules,
      attractions,
      weekdays,
      joins,
      include2s,
      evaluates,
      supports,
      businesses
    });

  } catch (err) {
    console.error('查詢所有資料時出錯:', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

