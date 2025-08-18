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
// import Schedule from './models/schedule.js';
// import TransportTime from './models/transportTime.js';
// import ScheduleInclude from './models/schedule_include.js';
// import Attraction from './models/attraction.js';
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


function formatFullDateTime(dateTimeStr) {
  if (!dateTimeStr) return null;
  const d = new Date(dateTimeStr);

  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  const hours = `${d.getHours()}`.padStart(2, '0');
  const minutes = `${d.getMinutes()}`.padStart(2, '0');
  const seconds = `${d.getSeconds()}`.padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

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

// ====================================view 2===========================
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
    } else {
      return res.json(schedules);
    }
  });
});



// POST 版本的新增 Schedule API（用於確認行程）
app.post('/api/view2_schedule_list_insert', (req, res) => {
  let { t_id, u_id, title, day, date, attractions } = req.body;

  t_id = 1;//@==@記得換成真的t_id
  u_id = 1;//@==@記得換成真的u_id
  var scheduleDate = date || '2025-08-01';// 如果沒有提供日期，使用默認值

  // 查詢該日期已有的 Schedule 數量，計算下一個行程編號
  const countSql = 'SELECT COUNT(*) as count FROM Schedule WHERE date = ?';
  connection.query(countSql, [scheduleDate], (countErr, countResult) => {
    if (countErr) {
      console.error('❌ 查詢該日期 Schedule 數量時出錯：', countErr.message);
      return res.status(500).json({ error: countErr.message });
    }

    const nextDayScheduleNumber = countResult[0].count + 1;
    // console.log(`📊 ${scheduleDate} 的下一個行程編號: ${nextDayScheduleNumber}`);

    const sql = 'INSERT INTO Schedule (t_id, date, u_id, day, title) VALUES (?, ?, ?, ?, ?)';
    const scheduleTitle = title || `行程${nextDayScheduleNumber}`;
    const scheduleDay = day || nextDayScheduleNumber;
    // console.log('  - SQL:', sql);
    // console.log('  - 參數:', [1, scheduleDate, 1, scheduleDay, scheduleTitle]);

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
          t_id: t_id,
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

//把景點添加到schedule後存入資料庫
app.post('/api/view2_schedule_include_insert', (req, res) => {
  const { a_id, t_id, s_id, x, y, height, sequence = 1, transport_method = 0 } = req.body;

  // sequence=1;//default value

  const query = `INSERT INTO Schedule_include (a_id, t_id, s_id, x, y, height, sequence, transport_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [a_id, t_id, s_id, x, y, height, sequence, transport_method];

  connection.query(query, values, (err, results) => {
    if (err) {
      console.error('Error inserting data into Schedule_include:', err);
      res.status(500).send('Failed to insert data');
    } else {
      res.status(200).send('Data inserted successfully');
    }
  });
});

app.get('/api/view2_schedule_include_show/:t_id/:s_id', (req, res) => {
  const { t_id, s_id } = req.params;

  const query = `SELECT * FROM schedule_include s
                   JOIN Attraction a ON s.a_id = a.a_id
                   WHERE s.t_id = ? AND s.s_id = ?`;
  const values = [t_id, s_id];

  connection.query(query, values, (err, results) => {
    if (err) {
      console.error('Error fetching data from Schedule_include:', err);
      res.status(500).send('Failed to fetch data');
    } else {
      res.status(200).json(results);
    }
  });
});

app.get('/api/view2_get_transport_time/:a_id/:nextAid', async (req, res) => {
    const { a_id, nextAid } = req.params;
    
    console.log(`🔍 查詢交通時間: from_a_id=${a_id}, to_a_id=${nextAid}`);
    
    const query = `SELECT * FROM transport_time t
                   WHERE t.from_a_id = ? AND t.to_a_id = ?`;
    const values = [a_id, nextAid];

    console.log(`📝 SQL查詢: ${query}`);
    console.log(`📝 參數: [${values.join(', ')}]`);

    connection.query(query, values, async (err, results) => {
        if (err) {
            console.error('❌ 查詢失敗:', err);
            res.status(500).send('Failed to fetch data');
            return;
        }

        console.log(`✅ 查詢結果數量: ${results.length}`);

        // 如果沒有找到資料，自動計算並存儲
        if (!results || results.length === 0) {
            console.log(`🚀 沒有找到交通時間資料，開始自動計算...`);
            
            try {
                // 動態引入交通時間計算服務
                const { calculateAndStoreTransportTime } = await import('./transportTimeService.js');
                
                // 使用預設的行程ID (可以後續優化為動態獲取)
                const defaultScheduleId = 1;
                const today = new Date().toISOString().split('T')[0];
                
                console.log(`📊 開始計算: 景點 ${a_id} → ${nextAid}`);
                
                // 計算並存儲交通時間
                const result = await calculateAndStoreTransportTime(
                    parseInt(a_id), 
                    parseInt(nextAid), 
                    defaultScheduleId, 
                    today
                );
                
                console.log(`🎉 計算完成:`, result);
                
                if (result.success) {
                    // 重新查詢剛剛存儲的資料
                    connection.query(query, values, (err2, newResults) => {
                        if (err2) {
                            console.error('❌ 重新查詢失敗:', err2);
                            res.status(500).send('Failed to fetch calculated data');
                        } else {
                            console.log(`✅ 新計算的資料:`, newResults);
                            res.status(200).json(newResults);
                        }
                    });
                } else {
                    console.error('❌ 計算失敗:', result.error);
                    res.status(200).json([]);
                }
                
            } catch (calculateError) {
                console.error('💥 交通時間計算失敗:', calculateError);
                // 即使計算失敗，也返回空陣列而不是錯誤，讓前端可以正常處理
                res.status(200).json([]);
            }
        } else {
            // 找到資料，直接返回
            console.log(`✅ 找到現有資料:`, results);
            res.status(200).json(results);
        }
    });
});

// 新增API：計算特定行程的總預算
app.get('/api/schedule_budget/:s_id/:date', (req, res) => {
  const { s_id, date } = req.params;

  const query = `SELECT SUM(a.budget) as total_budget 
                 FROM Schedule s
                 JOIN Schedule_include si ON s.s_id = si.s_id
                 JOIN Attraction a ON si.a_id = a.a_id
                 WHERE s.s_id = ? AND s.date = ?`;
  const values = [s_id, date];

  connection.query(query, values, (err, results) => {
    if (err) {
      console.error('Error calculating budget:', err);
      res.status(200).json({ total_budget: 0 });
    } else {
      const totalBudget = results[0]?.total_budget || 0;
      console.log(`Budget calculation for s_id:${s_id}, date:${date} = ${totalBudget}`);
      res.status(200).json({ total_budget: totalBudget });
    }
  });
});

// 新增API：獲取行程投票狀態
app.get('/api/schedule_votes/:t_id/:s_id/:date', (req, res) => {
  const { t_id, s_id, date } = req.params;

  // 先查詢原始數據來調試
  const debugQuery = `SELECT u_id, good, bad FROM Evaluate WHERE t_id = ? AND s_id = ?`;

  connection.query(debugQuery, [t_id, s_id], (debugErr, debugResults) => {
    if (!debugErr) {
      console.log(`Debug: Raw vote data for t_id:${t_id}, s_id:${s_id}:`, debugResults);
    }

    // 獲取該行程的所有投票統計，直接從Evaluate表查詢
    const query = `SELECT 
                     COUNT(CASE WHEN good = true THEN 1 END) as total_likes,
                     COUNT(CASE WHEN bad = true THEN 1 END) as total_dislikes
                   FROM Evaluate 
                   WHERE t_id = ? AND s_id = ?`;

    connection.query(query, [t_id, s_id], (err, results) => {
      if (err) {
        console.error('Error fetching vote data:', err);
        res.status(200).json({ total_likes: 0, total_dislikes: 0 });
      } else {
        const votes = {
          total_likes: results[0]?.total_likes || 0,
          total_dislikes: results[0]?.total_dislikes || 0
        };
        console.log(`Vote calculation for t_id:${t_id}, s_id:${s_id}, date:${date} = likes:${votes.total_likes}, dislikes:${votes.total_dislikes}`);
        res.status(200).json(votes);
      }
    });
  });
});


// 新增API：投票給行程
app.post('/api/schedule_vote/:t_id/:s_id/:u_id/:date', (req, res) => {
  const { t_id, s_id, u_id, date } = req.params;
  const { vote_type } = req.body; // 'like' 或 'dislike'

  // 首先驗證Schedule是否存在於指定日期
  const validateQuery = `SELECT * FROM Schedule WHERE t_id = ? AND s_id = ? AND date = ?`;

  connection.query(validateQuery, [t_id, s_id, date], (validateErr, scheduleExists) => {
    if (validateErr) {
      console.error('Error validating schedule:', validateErr);
      res.status(500).send('Failed to validate schedule');
      return;
    }

    if (scheduleExists.length === 0) {
      res.status(404).send('Schedule not found for the specified date');
      return;
    }

    // 檢查是否已經投票過
    const checkQuery = `SELECT * FROM Evaluate WHERE u_id = ? AND s_id = ? AND t_id = ?`;

    connection.query(checkQuery, [u_id, s_id, t_id], (err, existing) => {
      if (err) {
        console.error('Error checking existing vote:', err);
        res.status(500).send('Failed to check existing vote');
        return;
      }

      if (existing.length > 0) {
        // 更新現有投票
        const updateQuery = vote_type === 'like'
          ? `UPDATE Evaluate SET good = true, bad = false WHERE u_id = ? AND s_id = ? AND t_id = ?`
          : `UPDATE Evaluate SET good = false, bad = true WHERE u_id = ? AND s_id = ? AND t_id = ?`;

        connection.query(updateQuery, [u_id, s_id, t_id], (err, result) => {
          if (err) {
            console.error('Error updating vote:', err);
            res.status(500).send('Failed to update vote');
          } else {
            console.log(`Vote updated for t_id:${t_id}, s_id:${s_id}, u_id:${u_id}, date:${date}, type:${vote_type}`);
            res.status(200).json({ message: 'Vote updated successfully' });
          }
        });
      } else {
        // 插入新投票
        const insertQuery = `INSERT INTO Evaluate (u_id, s_id, t_id, good, bad) VALUES (?, ?, ?, ?, ?)`;
        const values = vote_type === 'like'
          ? [u_id, s_id, t_id, true, false]
          : [u_id, s_id, t_id, false, true];

        connection.query(insertQuery, values, (err, result) => {
          if (err) {
            console.error('Error inserting vote:', err);
            res.status(500).send('Failed to insert vote');
          } else {
            console.log(`New vote created for t_id:${t_id}, s_id:${s_id}, u_id:${u_id}, date:${date}, type:${vote_type}`);
            res.status(200).json({ message: 'Vote recorded successfully' });
          }
        });
      }
    });
  });
});

//=======================view 3===================================
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
  // http://localhost:3001/api/fake-data
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
        (1, 2, '2025-08-02', 2, '巴黎行程第2天'),
        (1, 1, '2025-08-03', 3, '巴黎行程第3天'),

        (2, 2, '2025-09-05', 1, '義大利行程第1天'),
        (2, 4, '2025-09-06', 2, '義大利行程第2天'),
        (2, 2, '2025-09-07', 3, '義大利行程第3天'),

        (3, 3, '2025-10-10', 1, '日本行程第1天'),
        (3, 1, '2025-10-11', 2, '日本行程第2天'),
        (3, 2, '2025-10-12', 3, '日本行程第3天'),

        (4, 3, '2025-11-01', 1, '西班牙行程第1天'),
        (4, 4, '2025-11-02', 2, '西班牙行程第2天'),
        (4, 5, '2025-11-03', 3, '西班牙行程第3天'),

        (5, 4, '2025-12-15', 1, '澳洲行程第1天'),
        (5, 5, '2025-12-16', 2, '澳洲行程第2天'),
        (5, 5, '2025-12-17', 3, '澳洲行程第3天')
    `;

    await new Promise((resolve, reject) => {
      connection.query(scheduleSql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });


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
        (4, 4, 'Park Güell', '古埃爾公園', 'Park Güell', 'park', 'Carrer d''Olot, Barcelona', 'Spain', 'Barcelona', 10.0, 'parkguell.jpg', 41.4145, 2.1527),
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
    // 插入 join
    const joinSql = `
      INSERT INTO \`Join\` (u_id, t_id, color)
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

    //support
    const supportSql = `
      INSERT INTO Support (u_id, a_id, t_id, reason, onelove, twolove)
      VALUES
        (1, 1, 1, '風景超棒，值得一看', 1, 0),
        (1, 2, 1, '美食非常吸引人', 0, 1),
        (1, 3, 1, '交通方便，適合安排上午行程', 1, 1),
        (2, 4, 2, '歷史氣息濃厚，推薦', 1, 0),
        (2, 5, 2, '拍照地點一流', 0, 1),
        (2, 6, 2, '氣氛浪漫，適合情侶', 1, 1),
        (3, 7, 3, '夜景美到爆炸', 1, 0),
        (3, 8, 3, '動漫迷的朝聖地', 0, 1),
        (3, 9, 3, '交通便利，附近餐廳多', 1, 1),
        (4, 10, 4, '建築很特別，拍照很讚', 1, 0),
        (4, 11, 4, '街頭藝人很多，很有特色', 0, 1),
        (4, 12, 4, '適合悠閒散步', 1, 1),
        (5, 13, 5, '陽光海灘太棒了', 1, 0),
        (5, 14, 5, '戶外活動豐富', 0, 1),
        (5, 15, 5, '超適合親子旅遊', 1, 1),
        (1, 16, 1, '有藝術展覽，可一看', 1, 0),
        (2, 17, 2, '咖啡館林立，適合放鬆', 0, 1),
        (3, 18, 3, '購物天堂，記得帶卡', 1, 0),
        (4, 19, 4, '文化活動精彩', 0, 1),
        (5, 20, 5, '美食市集必逛', 1, 1)
    `;

    await new Promise((resolve, reject) => {
      connection.query(supportSql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    //evaluate
    const evaluateSql = `
      INSERT INTO Evaluate (u_id, s_id, t_id, good, bad)
      VALUES
        (1, 1, 1, true, false),
        (1, 2, 1, true, false),
        (2, 3, 2, false, true),
        (2, 4, 2, true, false),
        (3, 5, 3, true, false),
        (3, 6, 3, false, true),
        (4, 7, 4, true, false),
        (4, 8, 4, false, true),
        (5, 9, 5, true, false),
        (5, 10, 5, true, false),
        (1, 11, 1, false, true),
        (2, 12, 2, true, false),
        (3, 13, 3, true, false),
        (4, 14, 4, true, false),
        (5, 15, 5, false, true),
        (1, 16, 1, true, false),
        (2, 17, 2, false, true),
        (3, 18, 3, true, false),
        (4, 19, 4, true, false),
        (5, 20, 5, true, false)
        `;
    await new Promise((resolve, reject) => {
      connection.query(evaluateSql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // hotel
    const hotelSql = `
      INSERT INTO Hotel (h_img, h_address, h_name_zh, h_name_en, h_country, h_city, price)
      VALUES
        ('/images/hotel1.jpg', '1 Rue de Paris, Paris', '巴黎香榭旅館', 'Champs Elysees Hotel', 'France', 'Paris', 150.0),
        ('/images/hotel2.jpg', '10 Rue Lafayette, Paris', '拉法葉精品旅館', 'Lafayette Boutique Hotel', 'France', 'Paris', 200.0),
        ('/images/hotel3.jpg', 'Via Roma 45, Rome', '羅馬古都旅館', 'Ancient Rome Hotel', 'Italy', 'Rome', 130.0),
        ('/images/hotel4.jpg', 'Piazza Navona 7, Rome', '納沃納廣場旅館', 'Navona Square Hotel', 'Italy', 'Rome', 180.0),
        ('/images/hotel5.jpg', 'Shibuya 2-21-1, Tokyo', '澀谷時尚旅館', 'Shibuya Fashion Hotel', 'Japan', 'Tokyo', 160.0),
        ('/images/hotel6.jpg', 'Ueno 3-5-7, Tokyo', '上野溫馨旅館', 'Ueno Cozy Hotel', 'Japan', 'Tokyo', 110.0),
        ('/images/hotel7.jpg', 'Gran Via 12, Madrid', '格蘭大道旅館', 'Gran Via Hotel', 'Spain', 'Madrid', 140.0),
        ('/images/hotel8.jpg', 'Plaza Mayor 9, Madrid', '馬約爾廣場旅館', 'Mayor Plaza Hotel', 'Spain', 'Madrid', 170.0),
        ('/images/hotel9.jpg', '123 George St, Sydney', '雪梨海港旅館', 'Sydney Harbour Hotel', 'Australia', 'Sydney', 190.0),
        ('/images/hotel10.jpg', '456 Bondi Rd, Sydney', '邦代海灘旅館', 'Bondi Beach Hotel', 'Australia', 'Sydney', 175.0),

        ('/images/hotel11.jpg', 'Rue Mouffetard 88, Paris', '巴黎街頭旅館', 'Paris Street Inn', 'France', 'Paris', 120.0),
        ('/images/hotel12.jpg', 'Via del Corso 12, Rome', '羅馬時尚旅館', 'Fashion Rome Inn', 'Italy', 'Rome', 140.0),
        ('/images/hotel13.jpg', 'Akihabara 1-1-1, Tokyo', '秋葉原電器旅館', 'Akihabara Tech Hotel', 'Japan', 'Tokyo', 100.0),
        ('/images/hotel14.jpg', 'Puerta del Sol 5, Madrid', '太陽門旅館', 'Sun Gate Hotel', 'Spain', 'Madrid', 160.0),
        ('/images/hotel15.jpg', '789 Collins St, Melbourne', '墨爾本商務旅館', 'Melbourne Business Hotel', 'Australia', 'Melbourne', 180.0),
        ('/images/hotel16.jpg', '1 Place Bellecour, Lyon', '里昂中心旅館', 'Lyon Central Hotel', 'France', 'Lyon', 130.0),
        ('/images/hotel17.jpg', 'Florence St 17, Florence', '佛羅倫斯藝術旅館', 'Florence Art Hotel', 'Italy', 'Florence', 160.0),
        ('/images/hotel18.jpg', 'Osaka Namba 3-14-1, Osaka', '大阪南海旅館', 'Osaka Namba Hotel', 'Japan', 'Osaka', 120.0),
        ('/images/hotel19.jpg', 'Barcelona Av 22, Barcelona', '巴塞隆納精品旅館', 'Barcelona Boutique Hotel', 'Spain', 'Barcelona', 150.0),
        ('/images/hotel20.jpg', 'Queen St 9, Brisbane', '布里斯本觀景旅館', 'Brisbane View Hotel', 'Australia', 'Brisbane', 170.0)
        `;
    await new Promise((resolve, reject) => {
      connection.query(hotelSql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    //tripHotel
    const tripHotelSql = `
      INSERT INTO TripHotel (h_id, t_id, cin_time, cout_time)
      VALUES
        (1, 1, '2025-08-01', '2025-08-03'),
        (2, 1, '2025-08-03', '2025-08-05'),
        (3, 2, '2025-09-05', '2025-09-07'),
        (4, 2, '2025-09-07', '2025-09-10'),
        (5, 3, '2025-10-10', '2025-10-12'),
        (6, 3, '2025-10-12', '2025-10-14'),
        (7, 4, '2025-11-01', '2025-11-04'),
        (8, 4, '2025-11-04', '2025-11-06'),
        (9, 5, '2025-12-15', '2025-12-17'),
        (10, 5, '2025-12-17', '2025-12-19'),

        (11, 1, '2025-08-05', '2025-08-07'),
        (12, 2, '2025-09-10', '2025-09-12'),
        (13, 3, '2025-10-14', '2025-10-16'),
        (14, 4, '2025-11-06', '2025-11-08'),
        (15, 5, '2025-12-19', '2025-12-21'),
        (16, 1, '2025-08-07', '2025-08-09'),
        (17, 2, '2025-09-12', '2025-09-13'),
        (18, 3, '2025-10-16', '2025-10-17'),
        (19, 4, '2025-11-08', '2025-11-10'),
        (20, 5, '2025-12-21', '2025-12-23')
    `;
    await new Promise((resolve, reject) => {
      connection.query(tripHotelSql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    //weekday
    const weekDaysSql = `
      INSERT INTO Weekday (w_day)
      VALUES
        ('Monday'),
        ('Tuesday'),
        ('Wednesday'),
        ('Thursday'),
        ('Friday'),
        ('Saturday'),
        ('Sunday')
    `;

    await new Promise((resolve, reject) => {
      connection.query(weekDaysSql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    //business
    const businessSql = `
      INSERT INTO Business (a_id, t_id, w_day, period, open_time, close_time)
      VALUES
        (1, 1, 'Monday', 1, '09:00:00', '12:00:00'),
        (1, 1, 'Monday', 2, '13:00:00', '17:00:00'),
        (1, 1, 'Tuesday', 1, '09:00:00', '12:00:00'),
        (1, 1, 'Tuesday', 2, '13:00:00', '17:00:00'),
        (1, 1, 'Wednesday', 1, '09:00:00', '12:00:00'),

        (2, 1, 'Monday', 1, '10:00:00', '13:00:00'),
        (2, 1, 'Monday', 2, '14:00:00', '18:00:00'),
        (2, 2, 'Tuesday', 1, '09:30:00', '12:30:00'),
        (2, 2, 'Tuesday', 2, '13:30:00', '17:30:00'),
        (2, 2, 'Wednesday', 1, '10:00:00', '14:00:00'),

        (3, 2, 'Monday', 1, '08:00:00', '11:00:00'),
        (3, 2, 'Monday', 2, '12:00:00', '16:00:00'),
        (3, 2, 'Tuesday', 1, '08:00:00', '12:00:00'),
        (3, 2, 'Tuesday', 2, '13:00:00', '17:00:00'),
        (3, 2, 'Wednesday', 1, '09:00:00', '13:00:00')
    `;

    await new Promise((resolve, reject) => {
      connection.query(businessSql, (err) => {
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


// ==================== 交通時間計算 API ====================
import { calculateAndStoreTransportTime, calculateScheduleTransportTimes, getTransportTime } from './transportTimeService.js';

/**
 * POST /api/calculate-transport-time
 * 計算兩個景點之間的交通時間
 */
app.post('/api/calculate-transport-time', async (req, res) => {
  try {
    console.log('🔥 收到單一路線交通時間計算請求');
    console.log('📥 請求 body:', req.body);

    const { fromAId, toAId, scheduleId, date } = req.body;

    if (!fromAId || !toAId || !scheduleId) {
      return res.status(400).json({
        error: '缺少必要參數: fromAId, toAId, scheduleId'
      });
    }

    const result = await calculateAndStoreTransportTime(fromAId, toAId, scheduleId, date);

    if (result.success) {
      console.log('✅ 單一路線交通時間計算成功');
      res.json(result);
    } else {
      console.log('❌ 單一路線交通時間計算失敗:', result.error);
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('❌ 計算交通時間 API 錯誤:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/calculate-schedule-transport-times
 * 計算整個行程的交通時間
 */
app.post('/api/calculate-schedule-transport-times', async (req, res) => {
  try {
    console.log('🔥 收到交通時間計算請求');
    console.log('📥 請求 body:', req.body);

    const { attractionIds, scheduleId, date } = req.body;

    console.log('📊 解析的參數:');
    console.log('  - attractionIds:', attractionIds, '(類型:', typeof attractionIds, ')');
    console.log('  - scheduleId:', scheduleId, '(類型:', typeof scheduleId, ')');
    console.log('  - date:', date);

    if (!attractionIds || !Array.isArray(attractionIds) || attractionIds.length < 2) {
      console.log('❌ 景點 ID 陣列驗證失敗');
      return res.status(400).json({
        error: '需要至少兩個景點ID的陣列'
      });
    }

    if (!scheduleId) {
      console.log('❌ 行程 ID 驗證失敗');
      return res.status(400).json({
        error: '缺少行程ID'
      });
    }

    console.log('✅ 參數驗證通過，開始計算交通時間...');
    const result = await calculateScheduleTransportTimes(attractionIds, scheduleId, date);
    console.log('📊 計算結果:', result);

    if (result.success) {
      console.log('✅ 交通時間計算成功');
      res.json({
        success: true,
        message: `行程交通時間計算完成: ${result.successCount}/${result.totalRoutes} 成功`,
        data: result
      });
    } else {
      console.log('❌ 交通時間計算失敗:', result.error);
      res.status(500).json({
        success: false,
        error: result.error,
        data: result
      });
    }

  } catch (error) {
    console.error('❌ 計算行程交通時間 API 錯誤:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/transport-time/:fromAId/:toAId/:scheduleId
 * 獲取特定路線的交通時間
 */
app.get('/api/transport-time/:fromAId/:toAId/:scheduleId', async (req, res) => {
  try {
    const { fromAId, toAId, scheduleId } = req.params;

    console.log(`🔍 查詢交通時間: ${fromAId} → ${toAId} (行程 ${scheduleId})`);

    const result = await getTransportTime(parseInt(fromAId), parseInt(toAId), parseInt(scheduleId));

    if (result) {
      console.log('✅ 找到交通時間資料');
      res.json({
        success: true,
        data: result
      });
    } else {
      console.log('❌ 未找到交通時間資料');
      res.status(404).json({
        success: false,
        error: '未找到該路線的交通時間資料'
      });
    }

  } catch (error) {
    console.error('❌ 查詢交通時間 API 錯誤:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/schedule-transport-times/:scheduleId
 * 獲取整個行程的所有交通時間
 */
app.get('/api/schedule-transport-times/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;

    console.log(`🔍 查詢行程 ${scheduleId} 的所有交通時間`);

    const query = `
      SELECT tt.*, 
             a1.name as from_name, a1.latitude as from_lat, a1.longitude as from_lng,
             a2.name as to_name, a2.latitude as to_lat, a2.longitude as to_lng
      FROM transport_time tt
      JOIN Attraction a1 ON tt.from_a_id = a1.a_id
      JOIN Attraction a2 ON tt.to_a_id = a2.a_id
      WHERE tt.s_id = ?
      ORDER BY tt.id
    `;

    connection.query(query, [scheduleId], (err, results) => {
      if (err) {
        console.error('❌ 查詢行程交通時間錯誤:', err);
        return res.status(500).json({
          success: false,
          error: err.message
        });
      }

      console.log(`✅ 找到 ${results.length} 條交通時間記錄`);
      res.json({
        success: true,
        data: results
      });
    });

  } catch (error) {
    console.error('❌ 查詢行程交通時間 API 錯誤:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== 啟動服務器 ====================
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

// API: 取得指定trip的景點類別（用於篩選）
app.get('/api/attraction_categories/:t_id', (req, res) => {
  const { t_id } = req.params;

  const query = `
    SELECT DISTINCT a.category 
    FROM Attraction a
    INNER JOIN Schedule_include si ON a.a_id = si.a_id
    INNER JOIN Schedule s ON si.s_id = s.s_id
    WHERE s.t_id = ? AND a.category IS NOT NULL AND a.category != ''
    ORDER BY a.category
  `;

  connection.query(query, [t_id], (err, results) => {
    if (err) {
      console.error('❌ 取得trip類別時出錯：', err.message);
      res.status(500).json({ error: err.message });
      return;
    }

    console.log(`✅ 成功取得trip ${t_id} 的景點類別：`, results);
    res.json({
      success: true,
      categories: results.map(row => row.category)
    });
  });
});

// API: 取得指定trip的參與使用者（從Join表）
app.get('/api/trip_users/:t_id', (req, res) => {
  const { t_id } = req.params;

  const query = `
    SELECT u.u_id, u.u_name, u.u_img, j.color
    FROM User u
    INNER JOIN \`Join\` j ON u.u_id = j.u_id
    WHERE j.t_id = ?
    ORDER BY u.u_id
  `;

  connection.query(query, [t_id], (err, results) => {
    if (err) {
      console.error('❌ 取得trip參與使用者時出錯：', err.message);
      res.status(500).json({ error: err.message });
      return;
    }

    console.log(`✅ 成功取得trip ${t_id} 的參與使用者：`, results);
    res.json({
      success: true,
      users: results
    });
  });
});

// API: 取得指定trip的景點預算範圍（每個Schedule的所有景點預算加總取最大值）
app.get('/api/view3_trip_budget_range/:t_id', (req, res) => {
  const { t_id } = req.params;

  // 先獲取最小預算
  const minQuery = `
      SELECT MIN(schedule_total) as min_budget
      FROM (
        SELECT SUM(a.budget) as schedule_total
        FROM Schedule s
        INNER JOIN Schedule_include si ON s.s_id = si.s_id
        INNER JOIN Attraction a ON si.a_id = a.a_id
        WHERE s.t_id = ? AND a.budget IS NOT NULL AND a.budget > 0
        GROUP BY s.s_id
      ) as schedule_budgets
    `;

  connection.query(minQuery, [t_id], (err, minResults) => {
    if (err) {
      console.error('❌ 取得trip最小預算時出錯：', err.message);
      res.status(500).json({ error: err.message });
      return;
    }

    // 再獲取每個Schedule的預算加總，然後取最大值
    const maxQuery = `
      SELECT MAX(schedule_total) as max_budget
      FROM (
        SELECT SUM(a.budget) as schedule_total
        FROM Schedule s
        INNER JOIN Schedule_include si ON s.s_id = si.s_id
        INNER JOIN Attraction a ON si.a_id = a.a_id
        WHERE s.t_id = ? AND a.budget IS NOT NULL AND a.budget > 0
        GROUP BY s.s_id
      ) as schedule_budgets
    `;

    connection.query(maxQuery, [t_id], (err, maxResults) => {
      if (err) {
        console.error('❌ 取得trip最大預算時出錯：', err.message);
        res.status(500).json({ error: err.message });
        return;
      }

      const minBudget = minResults[0]?.min_budget || 0;
      const maxBudget = maxResults[0]?.max_budget || 1000;

      console.log(`✅ 成功取得trip ${t_id} 預算範圍: ${minBudget} - ${maxBudget}`);
      res.json({
        success: true,
        minBudget: minBudget,
        maxBudget: maxBudget
      });
    });
  });
});

app.post('/api/update-stage-date', (req, res) => {
  const { tripId, stage_date } = req.body; // 前端傳的 deadline 字串放到 stage_date

  if (!tripId || !stage_date) {
    return res.status(400).json({ message: '缺少 tripId 或 stage_date' });
  }

  const selectSql = 'SELECT stage FROM trip WHERE t_id = ? LIMIT 1';
  connection.query(selectSql, [tripId], (err, results) => {
    if (err) return res.status(500).json({ message: '伺服器錯誤' });
    if (results.length === 0) return res.status(404).json({ message: '找不到該旅程資料' });

    let currentStage = results[0].stage;
    let nextStage = currentStage !== 'E' ? String.fromCharCode(currentStage.charCodeAt(0) + 1) : currentStage;

    const updateSql = 'UPDATE trip SET stage_date = ?, stage = ? WHERE t_id = ?';
    connection.query(updateSql, [stage_date, nextStage, tripId], (err, result) => {
      if (err) return res.status(500).json({ message: '伺服器錯誤' });

      res.status(200).json({
        message: '更新成功',
        tripId,
        stage: nextStage,
        stage_date
      });
    });
  });
});



app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
