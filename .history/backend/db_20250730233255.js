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


    // 插入 Trip
    const tripSql = `
      INSERT INTO Trip (s_date, e_date, s_time, e_time, country, stage_date, time, title, stage, u_id)
      VALUES
        ('2025-08-01', '2025-08-10', '08:00:00', '20:00:00', 'France', '2025-08-01', '10:00:00', '巴黎之旅', 'A', 1),
        ('2025-09-05', '2025-09-15', '09:00:00', '19:00:00', 'Italy', '2025-09-05', '11:00:00', '義大利探索', 'B', 2),
        ('2025-10-10', '2025-10-20', '07:30:00', '18:30:00', 'Japan', '2025-10-10', '09:30:00', '日本文化之旅', 'C', 3),
        ('2025-11-01', '2025-11-10', '08:00:00', '20:00:00', 'Spain', '2025-11-01', '10:00:00', '西班牙風情', 'D', 4),
        ('2025-12-15', '2025-12-25', '10:00:00', '22:00:00', 'Australia', '2025-12-15', '12:00:00', '澳洲冒險', 'E', 5)
    `;

    await new Promise((resolve, reject) => {
      connection.query(tripSql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });


    // 插入 Schedule
    const scheduleSql = `
      INSERT INTO Schedule (t_id, u_id, date, day, title)
      VALUES
        (1, 1, '2025-08-01', 1, '巴黎行程第1天'),
        (2, 2, '2025-09-05', 1, '義大利行程第1天'),
        (3, 3, '2025-10-10', 1, '日本行程第1天'),
        (4, 4, '2025-11-01', 1, '西班牙行程第1天'),
        (5, 5, '2025-12-15', 1, '澳洲行程第1天')
    `;

    await new Promise((resolve, reject) => {
      connection.query(scheduleSql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });



    // 插入Attraction
    const attractionSql = `
      INSERT INTO Attraction (t_id, u_id, name, name_zh, name_en, category, address, country, city, budget, photo, latitude, longitude)
      VALUES
        (1, 1, 'Eiffel Tower', '艾菲爾鐵塔', 'Eiffel Tower', 'landmark', 'Champ de Mars, 5 Avenue Anatole France, Paris', 'France', 'Paris', 25.0, 'eiffel.jpg', 48.8584, 2.2945),
        (1, 1, 'Louvre Museum', '羅浮宮', 'Louvre Museum', 'museum', 'Rue de Rivoli, Paris', 'France', 'Paris', 20.0, 'louvre.jpg', 48.8606, 2.3376),
        (1, 1, 'Montmartre', '蒙馬特', 'Montmartre', 'district', '18th arrondissement, Paris', 'France', 'Paris', 0.0, 'montmartre.jpg', 48.8867, 2.3431),
        (2, 2, 'Colosseum', '羅馬競技場', 'Colosseum', 'landmark', 'Piazza del Colosseo, Rome', 'Italy', 'Rome', 18.0, 'colosseum.jpg', 41.8902, 12.4922),
        (2, 2, 'Trevi Fountain', '特雷維噴泉', 'Trevi Fountain', 'landmark', 'Piazza di Trevi, Rome', 'Italy', 'Rome', 0.0, 'trevi.jpg', 41.9009, 12.4833),
        (2, 2, 'Vatican Museums', '梵蒂岡博物館', 'Vatican Museums', 'museum', 'Viale Vaticano, Vatican City', 'Italy', 'Vatican City', 17.0, 'vatican.jpg', 41.9065, 12.4536),
        (3, 3, 'Tokyo Tower', '東京鐵塔', 'Tokyo Tower', 'landmark', '4 Chome-2-8 Shibakoen, Minato City', 'Japan', 'Tokyo', 15.0, 'tokyotower.jpg', 35.6586, 139.7454),
        (3, 3, 'Senso-ji', '淺草寺', 'Senso-ji Temple', 'temple', '2 Chome-3-1 Asakusa, Taito City', 'Japan', 'Tokyo', 0.0, 'sensoji.jpg', 35.7148, 139.7967),
        (3, 3, 'Shibuya Crossing', '澀谷十字路口', 'Shibuya Crossing', 'crossroad', 'Shibuya City', 'Japan', 'Tokyo', 0.0, 'shibuya.jpg', 35.6595, 139.7004),
        (4, 4, 'Sagrada Familia', '聖家堂', 'Sagrada Familia', 'church', 'Carrer de Mallorca, Barcelona', 'Spain', 'Barcelona', 26.0, 'sagrada.jpg', 41.4036, 2.1744),
        (4, 4, 'Park Güell', '古埃爾公園', 'Park Güell', 'park', 'Carrer d\'Olot, Barcelona', 'Spain', 'Barcelona', 10.0, 'parkguell.jpg', 41.4145, 2.1527),
        (4, 4, 'La Rambla', '蘭布拉大道', 'La Rambla', 'street', 'La Rambla, Barcelona', 'Spain', 'Barcelona', 0.0, 'larambla.jpg', 41.3809, 2.1735),
        (5, 5, 'Sydney Opera House', '雪梨歌劇院', 'Sydney Opera House', 'landmark', 'Bennelong Point, Sydney', 'Australia', 'Sydney', 37.0, 'opera.jpg', -33.8568, 151.2153),
        (5, 5, 'Bondi Beach', '邦迪海灘', 'Bondi Beach', 'beach', 'Bondi Beach, Sydney', 'Australia', 'Sydney', 0.0, 'bondi.jpg', -33.8908, 151.2743),
        (5, 5, 'Taronga Zoo', '塔龍加動物園', 'Taronga Zoo', 'zoo', 'Bradleys Head Rd, Mosman', 'Australia', 'Sydney', 23.0, 'zoo.jpg', -33.8430, 151.2412),
        (3, 3, 'Meiji Shrine', '明治神宮', 'Meiji Shrine', 'shrine', '1-1 Yoyogikamizonocho, Shibuya City', 'Japan', 'Tokyo', 0.0, 'meiji.jpg', 35.6764, 139.6993),
        (2, 2, 'Pantheon', '萬神殿', 'Pantheon', 'landmark', 'Piazza della Rotonda, Rome', 'Italy', 'Rome', 0.0, 'pantheon.jpg', 41.8986, 12.4768),
        (1, 1, 'Seine River Cruise', '塞納河遊船', 'Seine River Cruise', 'activity', 'Port de la Bourdonnais, Paris', 'France', 'Paris', 14.0, 'seine.jpg', 48.8600, 2.2970),
        (4, 4, 'Casa Batlló', '巴特婁之家', 'Casa Batlló', 'architecture', 'Passeig de Gràcia, Barcelona', 'Spain', 'Barcelona', 25.0, 'batllo.jpg', 41.3917, 2.1649),
        (5, 5, 'Blue Mountains', '藍山國家公園', 'Blue Mountains', 'nature', 'Blue Mountains, NSW', 'Australia', 'Blue Mountains', 18.0, 'bluemountains.jpg', -33.7000, 150.3000)
    `;

    await new Promise((resolve, reject) => {
      connection.query(attractionSql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    const joinSql = `
  INSERT INTO Join (u_id, t_id, color)
  VALUES
    (1, 1, '#FF5733'),
    (2, 1, '#33A1FF'),
    (3, 1, '#33FF99'),

    (2, 2, '#FFAA33'),
    (1, 2, '#3399FF'),
    (4, 2, '#FF33A8'),

    (3, 3, '#66FF33'),
    (1, 3, '#FF6633'),
    (5, 3, '#3366FF'),

    (4, 4, '#FF3333'),
    (2, 4, '#33FFCC'),
    (5, 4, '#FF9933'),

    (5, 5, '#9966FF'),
    (3, 5, '#FF6699'),
    (1, 5, '#66CCFF')
`;

await new Promise((resolve, reject) => {
  connection.query(joinSql, (err) => {
    if (err) return reject(err);
    resolve();
  });
});



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