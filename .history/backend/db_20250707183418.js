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


// 啟動伺服器
app.listen(port, () => {
  console.log(`伺服器啟動於 http://localhost:${port}`);
});

