// db.js
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import './syncModels.js';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Schedule from './models/schedule.js';
import { dirname } from 'path';

// 取得 __dirname 的方式（ES Module 環境）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 設定儲存位置和檔名
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destPath = path.join(__dirname, '../img/avatar'); // 相對於 backend/db.js
    cb(null, destPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });



export default upload;  // 如果你用 ES module 的話可以 export


const app = express();
app.use(cors());
app.use(express.json());

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
    { key: 'hotels', sql: 'SELECT * FROM Hotel' },
    { key: 'tripHotels', sql: 'SELECT * FROM TripHotel' }
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
      if (key === 'trip_hotels') {
        rows = rows.map(row => ({
          ...row,
          cin_time: formatFullDateTime(row.cin_time),
          cout_time: formatFullDateTime(row.cout_time)
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



app.get('/api/view2_attraction_list', (req, res) => {
  const sql = 'SELECT * FROM Attraction';

  connection.query(sql, (err, rows) => {

    res.json(rows);
  });
});

app.get('/api/view2_schedule_list', (req, res) => {
  const { date } = req.query;
  
  let sql = 'SELECT * FROM Schedule';
  let params = [];
  
  // 如果有提供日期參數，則按日期過濾
  if (date) {
    sql += ' WHERE date = ?';
    params.push(date);
    console.log('📅 按日期過濾 Schedule:', date);
  }
  
  // 添加排序：先按日期，再按day欄位排序
  sql += ' ORDER BY date ASC, day ASC';
  
  console.log('🔍 執行 SQL:', sql, params);

  connection.query(sql, params, (err, rows) => {
    if (err) {
      console.error('❌ 查詢 Schedule 時出錯：', err.message);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('✅ 查詢到 Schedule 記錄數:', rows.length);
    res.json(rows);
  });
});

app.get('/api/view2_schedule_list_insert', (req, res) => {
  const { title, day, date } = req.query;
  
  console.log('📝 收到新增 Schedule 請求:');
  console.log('  - title:', title);
  console.log('  - day:', day);
  console.log('  - date:', date);
  
  // 如果沒有提供日期，使用默認值
  const scheduleDate = date || '2025-08-01';
  console.log('  - 使用的日期:', scheduleDate);
  
  // 查詢該日期已有的 Schedule 數量，計算下一個行程編號
  const countSql = 'SELECT COUNT(*) as count FROM Schedule WHERE date = ?';
  connection.query(countSql, [scheduleDate], (countErr, countResult) => {
    if (countErr) {
      console.error('❌ 查詢該日期 Schedule 數量時出錯：', countErr.message);
      return res.status(500).json({ error: countErr.message });
    }
    
    const nextDayScheduleNumber = countResult[0].count + 1;
    console.log(`📊 ${scheduleDate} 的下一個行程編號: ${nextDayScheduleNumber}`);
    
    const sql = 'INSERT INTO Schedule (t_id, date, u_id, day, title) VALUES (?, ?, ?, ?, ?)';
    const scheduleTitle = title || `行程${nextDayScheduleNumber}`;
    const scheduleDay = day || nextDayScheduleNumber;
    console.log('  - SQL:', sql);
    console.log('  - 參數:', [1, scheduleDate, 1, scheduleDay, scheduleTitle]);
    
    connection.query(sql, [1, scheduleDate, 1, scheduleDay, scheduleTitle], (err, result) => {
      if (err) {
        console.error('❌ 插入 Schedule 時出錯：', err.message);
        return res.status(500).json({ error: err.message });
      }
      
      console.log('✅ 插入成功! result:', result);
      console.log('✅ insertId:', result.insertId);
      
      // 返回新創建的記錄信息，使用計算出的該日期行程編號
      const response = {
        s_id: result.insertId,
        title: scheduleTitle,
        day: scheduleDay,
        date: scheduleDate,
        message: 'Schedule created successfully'
      };
      
      console.log('✅ 準備返回的響應:', response);
      res.json(response);
    });
  });
});

app.post('/api/view2_schedule_include_insert', (req, res) => {
  const { a_id, t_id, s_id, x, y } = req.body;

  const query = `INSERT INTO Schedule_include (a_id, t_id, s_id, x, y) VALUES (?, ?, ?, ?, ?)`;
  const values = [a_id, t_id, s_id, x, y];

  connection.query(query, values, (err, results) => {
    if (err) {
      console.error('Error inserting data into Schedule_include:', err);
      res.status(500).send('Failed to insert data');
    } else {
      res.status(200).send('Data inserted successfully');
    }
  });
});

// 新增 API 端點：獲取指定 trip 的日期範圍
app.get('/api/trip-dates/:tripId', (req, res) => {
  const tripId = req.params.tripId;
  const sql = 'SELECT s_date, e_date FROM Trip WHERE t_id = ?';

  connection.query(sql, [tripId], (err, rows) => {
    if (err) {
      console.error('❌ 查詢 trip 日期時出錯：', err.message);
      return res.status(500).json({ error: `查詢失敗：${err.message}` });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = rows[0];
    const startDate = new Date(trip.s_date);
    const endDate = new Date(trip.e_date);
    const dates = [];

    // 產生從開始日期到結束日期的所有日期
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      dates.push({
        date: formatDate(d),
        displayText: `${month}/${day}`
      });
    }

    res.json({
      tripId,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dates
    });
  });
});


app.post('/api/share-trip', async (req, res) => {
  const { email, tripId, tripTitle } = req.body;

  if (!email || !tripId || !tripTitle) {
    return res.status(400).json({ message: '缺少 email、tripId 或 tripTitle' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Email 格式錯誤' });
  }

  const hash = await bcrypt.hash(String(tripId), 10);
  const encoded = encodeURIComponent(hash);
  const registerUrl = `http://localhost:5173/signin?invite=${encoded}`;
  const lineUrl = 'https://lin.ee/PElDRz6';

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'vistourtravelhelper@gmail.com',
      pass: 'bsaf xdbd xhao adzp',
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // 查詢使用者是否存在
  const userSql = 'SELECT * FROM User WHERE u_email = ? LIMIT 1';
  connection.query(userSql, [email], (err, users) => {
    if (err) {
      console.error('❌ 查詢使用者失敗：', err);
      return res.status(500).json({ message: '伺服器錯誤（使用者查詢）' });
    }

    const userExists = users.length > 0;

    if (userExists) {
      const userId = users[0].u_id;

      const checkJoinSql = 'SELECT * FROM `Join` WHERE t_id = ? AND u_id = ?';
      connection.query(checkJoinSql, [tripId, userId], (checkErr, joinRows) => {
        if (checkErr) {
          console.error('❌ 查詢 Join 錯誤：', checkErr);
          return res.status(500).json({ message: '伺服器錯誤1（Join 查詢）' });
        }

        if (joinRows.length > 0) {
          return res.status(200).json({ message: '該使用者已經加入過行程' });
        }

        // 尚未加入 → 插入 Join
        const insertJoinSql = 'INSERT INTO `Join` (t_id, u_id) VALUES (?, ?)';
        connection.query(insertJoinSql, [tripId, userId], (insertErr) => {
          if (insertErr) {
            console.error('❌ 加入 Join 錯誤2：', insertErr);
            return res.status(500).json({ message: '伺服器錯誤2（無法加入旅程）' });
          }

          const subject = `您已被加入「${tripTitle}」行程！`;
          const body = `
您好，

您已被加入旅程：「${tripTitle}」
若您尚未登入，請前往系統查看。

👉 加入我們的 LINE 官方帳號：${lineUrl}

祝您旅途愉快！
          `;

          transporter.sendMail({
            from: 'vistourtravelhelper@gmail.com',
            to: email,
            subject,
            text: body,
          }, (mailErr) => {
            if (mailErr) {
              console.error('❌ 寄信失敗：', mailErr);
              return res.status(500).json({ message: '加入成功但寄信失敗' });
            }

            return res.status(200).json({ message: '使用者已加入並通知成功' });
          });
        });
      });
    } else {
      // 使用者不存在 → 寄邀請信
      const subject = `邀請您加入「${tripTitle}」，請先註冊`;
      const body =
        '您好，\n\n' +
        `您被邀請參與旅程：「${tripTitle}」\n\n` +
        `👉 加入我們的 LINE 官方帳號：${lineUrl}\n\n` +
        `👉 先點此註冊並加入旅程：${registerUrl}\n` +
        '祝您旅途愉快！';


      transporter.sendMail({
        from: 'vistourtravelhelper@gmail.com',
        to: email,
        subject,
        text: body,
      }, (mailErr) => {
        if (mailErr) {
          console.error('❌ 邀請信寄送失敗：', mailErr);
          return res.status(500).json({ message: '寄送邀請信失敗' });
        }

        return res.status(200).json({ message: '尚未註冊，邀請信已寄出' });
      });
    }
  });

});
// 加密驗證 API
app.post('/api/view3_login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: '缺少帳號或密碼' });
  }

  const sql = 'SELECT * FROM User WHERE u_email = ? LIMIT 1';
  connection.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('❌ 查詢錯誤：', err.message);
      return res.status(500).json({ message: '伺服器錯誤' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: '帳號不存在' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.u_password);

    if (!isMatch) {
      return res.status(401).json({ message: '密碼錯誤' });
    }

    return res.status(200).json({
      message: '登入成功！',
      redirect: '/header',
      user: {
        id: user.u_id,
        img: user.u_img,
        name: user.u_name,
        email: user.u_email,
        password: user.u_password,
        account: user.u_account,
      }
    });
  });
});
app.post('/api/view3_signin', upload.single('avatar'), async (req, res) => {
  try {
    const { name, email, account, password } = req.body;
    const avatarFile = req.file;

    if (!email || !account || !password) {
      return res.status(400).json({ message: '請填寫完整資訊' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarFilename = avatarFile ? avatarFile.filename : 'avatar.jpg';

    const sql = 'INSERT INTO User (u_name, u_email, u_account, u_password, u_img) VALUES (?, ?, ?, ?, ?)';
    connection.query(sql, [name, email, account, hashedPassword, avatarFilename], (err) => {
      if (err) {
        console.error('❌ 註冊錯誤:', err);
        return res.status(500).json({ message: '伺服器錯誤' });
      }
      return res.status(200).json({ message: '✅ 註冊成功' });
    });
  } catch (error) {
    console.error('❌ 加密或其他錯誤:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

app.post('/api/view3_forgot_password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: '缺少電子郵件' });
  }

  const sql = 'SELECT * FROM User WHERE u_email = ? LIMIT 1';
  connection.query(sql, [email], (err, results) => {
    if (err) {
      console.error('❌ 查詢錯誤：', err.message);
      return res.status(500).json({ message: '伺服器錯誤' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: '電子郵件未註冊' });
    }

    // // 這裡可以加入發送重設密碼郵件的邏輯
    return res.status(200).json({ message: '查詢到該帳號!' });
  });
});

app.post('/api/view3_reset_password', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '缺少電子郵件或密碼' });
  }

  try {
    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 10);

    // 更新到資料庫
    const sql = 'UPDATE User SET u_password = ? WHERE u_email = ?';
    connection.query(sql, [hashedPassword, email], (err, result) => {
      if (err) {
        console.error('❌ 更新密碼錯誤：', err.message);
        return res.status(500).json({ message: '伺服器錯誤' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: '找不到該用戶' });
      }

      return res.status(200).json({ message: '密碼重設成功' });
    });
  } catch (err) {
    console.error('❌ 加密錯誤：', err.message);
    return res.status(500).json({ message: '密碼加密失敗' });
  }
});

app.get('/api/fake-data', async (req, res) => {
  try {
    // 插入 User
   const userSql = `
      INSERT INTO User (u_name, u_email, u_account, u_password, u_img, u_line_id) VALUES
        ('TestUser1', 'testuser1@example.com', 'testuser1', '$2b$10$hash1', NULL, 'line1'),
        ('TestUser2', 'testuser2@example.com', 'testuser2', '$2b$10$hash2', NULL, 'line2'),
        ('TestUser3', 'testuser3@example.com', 'testuser3', '$2b$10$hash3', NULL, 'line3'),
        ('TestUser4', 'testuser4@example.com', 'testuser4', '$2b$10$hash4', NULL, 'line4'),
        ('TestUser5', 'testuser5@example.com', 'testuser5', '$2b$10$hash5', NULL, 'line5');
    `;

    await new Promise((resolve, reject) => {
      connection.query(userSql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });


    // 插入 Trip，u_id 設為 1
    const tripSql = `INSERT INTO Trip (s_date, e_date, s_time, e_time, country, stage_date, time, title, stage, u_id)
      VALUES ('2025-08-01', '2025-08-10', '08:00:00', '20:00:00', 'France', '2025-08-01', '10:00:00', '巴黎之旅', 'A', 1)`;
    await new Promise((resolve, reject) => {
      connection.query(tripSql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // 插入 Schedule，t_id 設為 1，u_id 設為 1
    const scheduleSql = `INSERT INTO Schedule (t_id, u_id, date) VALUES (1, 1, '2025-08-01')`;
    await new Promise((resolve, reject) => {
      connection.query(scheduleSql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });


    // 插入 10 筆瑞士景點 Attraction
    const swissAttractions = [
      { name: '馬特洪峰', name_zh: '馬特洪峰', name_en: 'Matterhorn', category: '山峰', address: 'Zermatt', country: 'Switzerland', city: 'Zermatt', budget: 0 },
      { name: '少女峰', name_zh: '少女峰', name_en: 'Jungfrau', category: '山峰', address: 'Bernese Alps', country: 'Switzerland', city: 'Interlaken', budget: 0 },
      { name: '瑞吉山', name_zh: '瑞吉山', name_en: 'Rigi', category: '山峰', address: 'Lucerne', country: 'Switzerland', city: 'Lucerne', budget: 0 },
      { name: '日內瓦湖', name_zh: '日內瓦湖', name_en: 'Lake Geneva', category: '湖泊', address: 'Geneva', country: 'Switzerland', city: 'Geneva', budget: 0 },
      { name: '盧塞恩湖', name_zh: '盧塞恩湖', name_en: 'Lake Lucerne', category: '湖泊', address: 'Lucerne', country: 'Switzerland', city: 'Lucerne', budget: 0 },
      { name: '策馬特', name_zh: '策馬特', name_en: 'Zermatt', category: '小鎮', address: 'Zermatt', country: 'Switzerland', city: 'Zermatt', budget: 0 },
      { name: '伯恩老城', name_zh: '伯恩老城', name_en: 'Old City of Bern', category: '古城', address: 'Bern', country: 'Switzerland', city: 'Bern', budget: 0 },
      { name: '蘇黎世湖', name_zh: '蘇黎世湖', name_en: 'Lake Zurich', category: '湖泊', address: 'Zurich', country: 'Switzerland', city: 'Zurich', budget: 0 },
      { name: '施皮茨城堡', name_zh: '施皮茨城堡', name_en: 'Spiez Castle', category: '城堡', address: 'Spiez', country: 'Switzerland', city: 'Spiez', budget: 0 },
      { name: '拉沃葡萄園', name_zh: '拉沃葡萄園', name_en: 'Lavaux Vineyard', category: '葡萄園', address: 'Lavaux', country: 'Switzerland', city: 'Lavaux', budget: 0 }
    ];
    for (let i = 0; i < swissAttractions.length; i++) {
      const a = swissAttractions[i];
      const sql = `INSERT INTO Attraction (t_id, name, name_zh, name_en, category, address, country, city, budget, photo, u_id)
        VALUES (1, '${a.name}', '${a.name_zh}', '${a.name_en}', '${a.category}', '${a.address}', '${a.country}', '${a.city}', ${a.budget}, '${i+1}.jpg', 1)`;
      await new Promise((resolve, reject) => {
        connection.query(sql, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }

    return res.status(200).json({ message: '假資料插入成功！' });
  } catch (error) {
    console.error('❌ 插入假資料失敗：', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

app.get('/api/fake-data-clean', async (req, res) => {
  try {
    const tables = [, 'schedule', 'trip', 'user'];
    for (const table of tables) {
      await new Promise((resolve, reject) => {
        connection.query(`DELETE FROM ${table}`, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }
    return res.status(200).json({ message: '所有資料已清理！' });
  } catch (error) {
    console.error('❌ 清理資料失敗：', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

app.listen(port, () => {
  console.log(`✅ 伺服器正在運行於 http://localhost:${port}`);
});

// 新增測試資料的 API 端點
app.get('/api/create-test-trip', (req, res) => {
  const sql = `INSERT INTO Trip (t_id, u_id, s_date, e_date, s_time, e_time, country, stage_date, time, title, stage) 
               VALUES (1, 1, '2024-01-01', '2024-01-10', '09:00:00', '18:00:00', '台灣', NOW(), '09:00:00', '測試旅程', '規劃中')
               ON DUPLICATE KEY UPDATE title = '測試旅程'`;
  
  connection.query(sql, (err, result) => {
    if (err) {
      console.error('❌ 創建測試 Trip 失敗:', err.message);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('✅ 測試 Trip 創建成功:', result);
    res.json({ message: '測試 Trip 創建成功', result });
  });
});

// 新增 API 端點：獲取指定 trip 的日期範圍
app.get('/api/trip-dates/:tripId', (req, res) => {
  const tripId = req.params.tripId;
  const sql = 'SELECT s_date, e_date FROM Trip WHERE t_id = ?';

  connection.query(sql, [tripId], (err, rows) => {
    if (err) {
      console.error('❌ 查詢 trip 日期時出錯：', err.message);
      return res.status(500).json({ error: `查詢失敗：${err.message}` });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = rows[0];
    const startDate = new Date(trip.s_date);
    const endDate = new Date(trip.e_date);
    const dates = [];

    // 產生從開始日期到結束日期的所有日期
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      dates.push({
        date: formatDate(d),
        displayText: `${month}/${day}`
      });
    }

    res.json({
      tripId,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dates
    });
  });
});


app.post('/api/share-trip', async (req, res) => {
  const { email, tripId, tripTitle } = req.body;

  if (!email || !tripId || !tripTitle) {
    return res.status(400).json({ message: '缺少 email、tripId 或 tripTitle' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Email 格式錯誤' });
  }

  const hash = await bcrypt.hash(String(tripId), 10);
  const encoded = encodeURIComponent(hash);
  const registerUrl = `http://localhost:5173/signin?invite=${encoded}`;
  const lineUrl = 'https://lin.ee/PElDRz6';

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'vistourtravelhelper@gmail.com',
      pass: 'bsaf xdbd xhao adzp',
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // 查詢使用者是否存在
  const userSql = 'SELECT * FROM User WHERE u_email = ? LIMIT 1';
  connection.query(userSql, [email], (err, users) => {
    if (err) {
      console.error('❌ 查詢使用者失敗：', err);
      return res.status(500).json({ message: '伺服器錯誤（使用者查詢）' });
    }

    const userExists = users.length > 0;

    if (userExists) {
      const userId = users[0].u_id;

      const checkJoinSql = 'SELECT * FROM `Join` WHERE t_id = ? AND u_id = ?';
      connection.query(checkJoinSql, [tripId, userId], (checkErr, joinRows) => {
        if (checkErr) {
          console.error('❌ 查詢 Join 錯誤：', checkErr);
          return res.status(500).json({ message: '伺服器錯誤1（Join 查詢）' });
        }

        if (joinRows.length > 0) {
          return res.status(200).json({ message: '該使用者已經加入過行程' });
        }

        // 尚未加入 → 插入 Join
        const insertJoinSql = 'INSERT INTO `Join` (t_id, u_id) VALUES (?, ?)';
        connection.query(insertJoinSql, [tripId, userId], (insertErr) => {
          if (insertErr) {
            console.error('❌ 加入 Join 錯誤2：', insertErr);
            return res.status(500).json({ message: '伺服器錯誤2（無法加入旅程）' });
          }

          const subject = `您已被加入「${tripTitle}」行程！`;
          const body = `
您好，

您已被加入旅程：「${tripTitle}」
若您尚未登入，請前往系統查看。

👉 加入我們的 LINE 官方帳號：${lineUrl}

祝您旅途愉快！
          `;

          transporter.sendMail({
            from: 'vistourtravelhelper@gmail.com',
            to: email,
            subject,
            text: body,
          }, (mailErr) => {
            if (mailErr) {
              console.error('❌ 寄信失敗：', mailErr);
              return res.status(500).json({ message: '加入成功但寄信失敗' });
            }

            return res.status(200).json({ message: '使用者已加入並通知成功' });
          });
        });
      });
    } else {
      // 使用者不存在 → 寄邀請信
      const subject = `邀請您加入「${tripTitle}」，請先註冊`;
      const body =
        '您好，\n\n' +
        `您被邀請參與旅程：「${tripTitle}」\n\n` +
        `👉 加入我們的 LINE 官方帳號：${lineUrl}\n\n` +
        `👉 先點此註冊並加入旅程：${registerUrl}\n` +
        '祝您旅途愉快！';


      transporter.sendMail({
        from: 'vistourtravelhelper@gmail.com',
        to: email,
        subject,
        text: body,
      }, (mailErr) => {
        if (mailErr) {
          console.error('❌ 邀請信寄送失敗：', mailErr);
          return res.status(500).json({ message: '寄送邀請信失敗' });
        }

        return res.status(200).json({ message: '尚未註冊，邀請信已寄出' });
      });
    }
  });

});
// 加密驗證 API
app.post('/api/view3_login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: '缺少帳號或密碼' });
  }

  const sql = 'SELECT * FROM User WHERE u_email = ? LIMIT 1';
  connection.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('❌ 查詢錯誤：', err.message);
      return res.status(500).json({ message: '伺服器錯誤' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: '帳號不存在' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.u_password);

    if (!isMatch) {
      return res.status(401).json({ message: '密碼錯誤' });
    }

    return res.status(200).json({
      message: '登入成功！',
      redirect: '/header',
      user: {
        id: user.u_id,
        name: user.u_name
      }
    });
  });
});
app.post('/api/view3_signin', upload.single('avatar'), async (req, res) => {
  try {
    const { name, email, account, password } = req.body;
    const avatarFile = req.file;

    if (!email || !account || !password) {
      return res.status(400).json({ message: '請填寫完整資訊' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarFilename = avatarFile ? avatarFile.filename : null;

    const sql = 'INSERT INTO User (u_name, u_email, u_account, u_password, u_img) VALUES (?, ?, ?, ?, ?)';
    connection.query(sql, [name, email, account, hashedPassword, avatarFilename], (err) => {
      if (err) {
        console.error('❌ 註冊錯誤:', err);
        return res.status(500).json({ message: '伺服器錯誤' });
      }
      return res.status(200).json({ message: '✅ 註冊成功' });
    });
  } catch (error) {
    console.error('❌ 加密或其他錯誤:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

app.post('/api/view3_forgot_password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: '缺少電子郵件' });
  }

  const sql = 'SELECT * FROM User WHERE u_email = ? LIMIT 1';
  connection.query(sql, [email], (err, results) => {
    if (err) {
      console.error('❌ 查詢錯誤：', err.message);
      return res.status(500).json({ message: '伺服器錯誤' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: '電子郵件未註冊' });
    }

    // // 這裡可以加入發送重設密碼郵件的邏輯
    return res.status(200).json({ message: '查詢到該帳號!' });
  });
});

app.post('/api/view3_reset_password', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '缺少電子郵件或密碼' });
  }

  try {
    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 10);

    // 更新到資料庫
    const sql = 'UPDATE User SET u_password = ? WHERE u_email = ?';
    connection.query(sql, [hashedPassword, email], (err, result) => {
      if (err) {
        console.error('❌ 更新密碼錯誤：', err.message);
        return res.status(500).json({ message: '伺服器錯誤' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: '找不到該用戶' });
      }

      return res.status(200).json({ message: '密碼重設成功' });
    });
  } catch (err) {
    console.error('❌ 加密錯誤：', err.message);
    return res.status(500).json({ message: '密碼加密失敗' });
  }
});