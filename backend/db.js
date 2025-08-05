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

  connection.query(sql, params, (err, schedules) => {
    if (err) {
      console.error('❌ 查詢 Schedule 時出錯：', err.message);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('✅ 查詢到 Schedule 記錄數:', schedules.length);
    
    // 如果沒有 Schedule，直接返回空陣列
    if (schedules.length === 0) {
      return res.json([]);
    }
    
    // 為每個 Schedule 查詢相關聯的景點
    const schedulePromises = schedules.map(schedule => {
      return new Promise((resolve, reject) => {
        // 查詢該 Schedule 的景點關聯
        const attractionSql = `
          SELECT a.name, a.a_id, si.x, si.y, si.sequence
          FROM Schedule_include si
          JOIN Attraction a ON si.a_id = a.a_id
          WHERE si.s_id = ?
          ORDER BY si.sequence ASC
        `;
        
        connection.query(attractionSql, [schedule.s_id], (attrErr, attractions) => {
          if (attrErr) {
            console.error(`❌ 查詢 Schedule ${schedule.s_id} 的景點時出錯：`, attrErr.message);
            reject(attrErr);
            return;
          }
          
          console.log(`📍 Schedule ${schedule.s_id} 找到 ${attractions.length} 個景點`);
          
          // 將景點資料格式化為前端需要的格式
          const formattedAttractions = attractions.map(attr => ({
            name: attr.name,
            time: null,
            position: { x: attr.x || 0, y: attr.y || 0 },
            width: 200 // 預設寬度
          }));
          
          resolve({
            ...schedule,
            attractions: formattedAttractions
          });
        });
      });
    });
    
    // 等待所有 Schedule 的景點查詢完成
    Promise.all(schedulePromises)
      .then(schedulesWithAttractions => {
        console.log('✅ 所有 Schedule 的景點查詢完成');
        res.json(schedulesWithAttractions);
      })
      .catch(error => {
        console.error('❌ 查詢景點關聯時出錯：', error.message);
        res.status(500).json({ error: error.message });
      });
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


// POST 版本的新增 Schedule API（用於確認行程）
app.post('/api/view2_schedule_list_insert', (req, res) => {
  const { title, day, date, attractions } = req.body;
  
  console.log('📝 收到確認 Schedule 請求 (POST):');
  console.log('  - title:', title);
  console.log('  - day:', day);
  console.log('  - date:', date);
  console.log('  - attractions:', attractions);
  
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
      
      const scheduleId = result.insertId;
      console.log('✅ Schedule 插入成功! s_id:', scheduleId);
      
      // 如果有景點，也要插入到 Schedule_include 表
      if (attractions && attractions.length > 0) {
        console.log('📍 開始插入景點關聯...');
        console.log('📍 景點數據:', JSON.stringify(attractions, null, 2));
        
        const insertAttractionPromises = attractions.map((attraction, index) => {
          return new Promise((resolve, reject) => {
            console.log(`🔍 處理景點 ${index + 1}:`, attraction);
            
            // 先查找景點ID
            const findAttractionSql = 'SELECT a_id FROM Attraction WHERE name = ? LIMIT 1';
            connection.query(findAttractionSql, [attraction.name], (findErr, attrResult) => {
              if (findErr) {
                console.error(`❌ 查找景點 ${attraction.name} 時出錯：`, findErr.message);
                reject(findErr);
                return;
              }
              
              if (attrResult.length === 0) {
                console.log(`⚠️ 景點 ${attraction.name} 不存在，跳過`);
                resolve();
                return;
              }
              
              const attractionId = attrResult[0].a_id;
              
              // 插入景點關聯到 Schedule_include 表
              const insertSql = 'INSERT INTO Schedule_include (s_id, a_id, t_id, sequence, x, y) VALUES (?, ?, ?, ?, ?, ?)';
              connection.query(insertSql, [scheduleId, attractionId, 1, index + 1, attraction.position?.x || 0, attraction.position?.y || 0], (insertErr) => {
                if (insertErr) {
                  console.error(`❌ 插入景點關聯 ${attraction.name} 時出錯：`, insertErr.message);
                  reject(insertErr);
                  return;
                }
                
                console.log(`✅ 景點關聯插入成功: ${attraction.name}`);
                resolve();
              });
            });
          });
        });
        
        // 等待所有景點關聯插入完成
        Promise.all(insertAttractionPromises)
          .then(() => {
            console.log('✅ 所有景點關聯插入成功！');
            
            const response = {
              s_id: scheduleId,
              title: scheduleTitle,
              day: scheduleDay,
              date: scheduleDate,
              message: 'Schedule and attractions created successfully'
            };
            
            console.log('✅ 準備返回的響應:', response);
            res.json(response);
          })
          .catch((err) => {
            console.error('❌ 插入景點關聯時出錯：', err.message);
            res.status(500).json({ error: err.message });
          });
      } else {
        // 沒有景點，直接返回
        const response = {
          s_id: scheduleId,
          title: scheduleTitle,
          day: scheduleDay,
          date: scheduleDate,
          message: 'Schedule created successfully'
        };
        
        console.log('✅ 準備返回的響應:', response);
        res.json(response);
      }
    });

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
    // 檢查是否已有測試資料
    const checkUserSql = 'SELECT COUNT(*) as count FROM User WHERE u_email = "testuser@example.com"';
    const userExists = await new Promise((resolve, reject) => {
      connection.query(checkUserSql, (err, result) => {
        if (err) return reject(err);
        resolve(result[0].count > 0);
      });
    });

    if (userExists) {
      return res.status(200).json({ message: '測試資料已存在，無需重複創建' });
    }

    // 插入 User
    const userSql = `INSERT INTO User (u_name, u_email, u_account, u_password, u_img, u_line_id)
      VALUES ('TestUser', 'testuser@example.com', 'testuser', '$2b$10$testpasswordhash', NULL, 'line123')`;

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


    // 插入 10 筆台灣景點 Attraction（增加重複檢查）
    const taiwanAttractions = [
      { name: '台北101', name_zh: '台北101', name_en: 'Taipei 101', category: '建築', address: '台北市信義區信義路五段7號', country: 'Taiwan', city: 'Taipei', budget: 0 },
      { name: '故宮博物院', name_zh: '國立故宮博物院', name_en: 'National Palace Museum', category: '博物館', address: '台北市士林區至善路二段221號', country: 'Taiwan', city: 'Taipei', budget: 0 },
      { name: '中正紀念堂', name_zh: '中正紀念堂', name_en: 'Chiang Kai-shek Memorial Hall', category: '紀念館', address: '台北市中正區中山南路21號', country: 'Taiwan', city: 'Taipei', budget: 0 },
      { name: '九份老街', name_zh: '九份老街', name_en: 'Jiufen Old Street', category: '老街', address: '新北市瑞芳區基山街', country: 'Taiwan', city: 'New Taipei', budget: 0 },
      { name: '日月潭', name_zh: '日月潭', name_en: 'Sun Moon Lake', category: '湖泊', address: '南投縣魚池鄉', country: 'Taiwan', city: 'Nantou', budget: 0 },
      { name: '阿里山', name_zh: '阿里山', name_en: 'Alishan', category: '山峰', address: '嘉義縣阿里山鄉', country: 'Taiwan', city: 'Chiayi', budget: 0 },
      { name: '墾丁國家公園', name_zh: '墾丁國家公園', name_en: 'Kenting National Park', category: '國家公園', address: '屏東縣恆春鎮', country: 'Taiwan', city: 'Pingtung', budget: 0 },
      { name: '太魯閣國家公園', name_zh: '太魯閣國家公園', name_en: 'Taroko National Park', category: '國家公園', address: '花蓮縣秀林鄉', country: 'Taiwan', city: 'Hualien', budget: 0 },
      { name: '西門町', name_zh: '西門町', name_en: 'Ximending', category: '商圈', address: '台北市萬華區', country: 'Taiwan', city: 'Taipei', budget: 0 },
      { name: '淡水老街', name_zh: '淡水老街', name_en: 'Tamsui Old Street', category: '老街', address: '新北市淡水區中正路', country: 'Taiwan', city: 'New Taipei', budget: 0 }
    ];
    
    for (let i = 0; i < taiwanAttractions.length; i++) {
      const a = taiwanAttractions[i];
      
      // 檢查景點是否已存在
      const checkAttractionSql = 'SELECT COUNT(*) as count FROM Attraction WHERE name = ?';
      const attractionExists = await new Promise((resolve, reject) => {
        connection.query(checkAttractionSql, [a.name], (err, result) => {
          if (err) return reject(err);
          resolve(result[0].count > 0);
        });
      });
      
      if (attractionExists) {
        console.log(`⚠️ 景點 "${a.name}" 已存在，跳過`);
        continue;
      }
      
      const sql = `INSERT INTO Attraction (t_id, name, name_zh, name_en, category, address, country, city, budget, photo, u_id)
        VALUES (1, '${a.name}', '${a.name_zh}', '${a.name_en}', '${a.category}', '${a.address}', '${a.country}', '${a.city}', ${a.budget}, '${i+1}.jpg', 1)`;
      await new Promise((resolve, reject) => {
        connection.query(sql, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      console.log(`✅ 新增景點: ${a.name}`);
    }

    return res.status(200).json({ message: 'User、Trip、Schedule、Attraction 假資料插入成功！' });
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

// API for adding attractions to schedule
app.post('/api/view2_schedule_include_insert', (req, res) => {
  console.log('📝 收到新增景點到行程的請求:', req.body);
  
  const { a_id, t_id, s_id, x, y } = req.body;
  
  // 驗證必要參數
  if (!a_id || !t_id || !s_id) {
    return res.status(400).json({ 
      error: '缺少必要參數: a_id, t_id, s_id' 
    });
  }
  
  // 檢查是否已經存在相同的關聯
  const checkSql = 'SELECT * FROM Schedule_include WHERE a_id = ? AND s_id = ?';
  connection.query(checkSql, [a_id, s_id], (checkErr, checkResult) => {
    if (checkErr) {
      console.error('❌ 檢查重複關聯時出錯：', checkErr.message);
      return res.status(500).json({ error: checkErr.message });
    }
    
    if (checkResult.length > 0) {
      console.log('⚠️ 景點已經存在於此行程中');
      return res.status(409).json({ 
        error: '景點已經存在於此行程中',
        existing: checkResult[0]
      });
    }
    
    // 插入新的關聯記錄，需要提供 sequence 字段
    // 先查詢該行程中已有的景點數量，作為下一個序號
    const sequenceSql = 'SELECT COUNT(*) as count FROM Schedule_include WHERE s_id = ?';
    connection.query(sequenceSql, [s_id], (seqErr, seqResult) => {
      if (seqErr) {
        console.error('❌ 查詢序號時出錯：', seqErr.message);
        return res.status(500).json({ error: seqErr.message });
      }
      
      const nextSequence = seqResult[0].count + 1;
      
      const insertSql = `
        INSERT INTO Schedule_include (a_id, t_id, s_id, x, y, sequence) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      connection.query(insertSql, [a_id, t_id, s_id, x || 0, y || 0, nextSequence], (insertErr, insertResult) => {
        if (insertErr) {
          console.error('❌ 插入景點關聯時出錯：', insertErr.message);
          return res.status(500).json({ error: insertErr.message });
        }
        
        console.log('✅ 景點成功添加到行程中！插入ID:', insertResult.insertId);
        res.json({
          success: true,
          message: '景點已成功添加到行程中',
          insertId: insertResult.insertId,
          data: {
            a_id,
            t_id,
            s_id,
            x: x || 0,
            y: y || 0,
            sequence: nextSequence
          }
        });
      });
    });
  });
});

app.listen(port, () => {
  console.log(`🚀 伺服器正在 http://localhost:${port} 上運行`);
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

// 保存景點到行程的 API
app.post('/api/schedule_attractions_save', (req, res) => {
  const { scheduleId, attractions } = req.body;
  
  console.log('📝 收到保存景點到行程請求:');
  console.log('  - scheduleId:', scheduleId);
  console.log('  - attractions:', attractions);
  
  if (!scheduleId || !attractions || !Array.isArray(attractions)) {
    return res.status(400).json({ error: '參數不完整' });
  }
  
  // 先檢查 Schedule 是否存在
  const checkScheduleSql = 'SELECT * FROM Schedule WHERE s_id = ?';
  connection.query(checkScheduleSql, [scheduleId], (checkErr, scheduleResult) => {
    if (checkErr) {
      console.error('❌ 檢查 Schedule 時出錯：', checkErr.message);
      return res.status(500).json({ error: checkErr.message });
    }
    
    if (scheduleResult.length === 0) {
      return res.status(404).json({ error: 'Schedule 不存在' });
    }
    
    console.log('✅ Schedule 存在:', scheduleResult[0]);
    
    // 開始事務，批量插入景點關聯
    connection.beginTransaction((transErr) => {
      if (transErr) {
        console.error('❌ 開始事務時出錯：', transErr.message);
        return res.status(500).json({ error: transErr.message });
      }
      
      // 先清除該 Schedule 的舊景點關聯（可選）
      const clearOldSql = 'DELETE FROM Include2 WHERE s_id = ?';
      connection.query(clearOldSql, [scheduleId], (clearErr) => {
        if (clearErr) {
          console.error('❌ 清除舊景點關聯時出錯：', clearErr.message);
          return connection.rollback(() => {
            res.status(500).json({ error: clearErr.message });
          });
        }
        
        // 準備批量插入
        const insertPromises = attractions.map((attraction, index) => {
          return new Promise((resolve, reject) => {
            // 先查找景點ID（這裡假設景點名稱對應 Attraction 表中的記錄）
            const findAttractionSql = 'SELECT a_id FROM Attraction WHERE name = ? LIMIT 1';
            connection.query(findAttractionSql, [attraction.name], (findErr, attrResult) => {
              if (findErr) {
                console.error(`❌ 查找景點 ${attraction.name} 時出錯：`, findErr.message);
                reject(findErr);
                return;
              }
              
              if (attrResult.length === 0) {
                console.log(`⚠️ 景點 ${attraction.name} 不存在於 Attraction 表中，跳過`);
                resolve();
                return;
              }
              
              const attractionId = attrResult[0].a_id;
              
              // 插入到 Include2 表（Schedule-Attraction 關聯表）
              const insertSql = 'INSERT INTO Include2 (s_id, a_id, t_id, sequence) VALUES (?, ?, ?, ?)';
              const sequenceOrder = index + 1;
              const tripId = 1; // 假設使用固定的 trip ID，你可能需要根據實際情況調整
              
              connection.query(insertSql, [scheduleId, attractionId, tripId, sequenceOrder], (insertErr, insertResult) => {
                if (insertErr) {
                  console.error(`❌ 插入景點關聯 ${attraction.name} 時出錯：`, insertErr.message);
                  reject(insertErr);
                  return;
                }
                
                console.log(`✅ 成功插入景點關聯: ${attraction.name} (a_id: ${attractionId})`);
                resolve();
              });
            });
          });
        });
        
        // 等待所有插入完成
        Promise.all(insertPromises)
          .then(() => {
            // 提交事務
            connection.commit((commitErr) => {
              if (commitErr) {
                console.error('❌ 提交事務時出錯：', commitErr.message);
                return connection.rollback(() => {
                  res.status(500).json({ error: commitErr.message });
                });
              }
              
              console.log('✅ 所有景點關聯保存成功！');
              res.json({
                success: true,
                message: '景點已成功保存到行程中',
                scheduleId: scheduleId,
                attractionsCount: attractions.length
              });
            });
          })
          .catch((err) => {
            console.error('❌ 插入景點關聯時出錯：', err.message);
            connection.rollback(() => {
              res.status(500).json({ error: err.message });
            });
          });
      });
    });
  });
});
