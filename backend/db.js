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
    { key: 'businesses', sql: 'SELECT * FROM Business' }
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

<<<<<<< Updated upstream
=======

app.get('/api/view2_attraction_list', (req, res) => {
  const sql = 'SELECT * FROM Attraction';

  connection.query(sql, (err, rows) => {
    if (err) {
      console.error('❌ 查詢 Attraction 時出錯：', err.message);
      return res.status(500).json({ error: `查詢 Attraction 失敗：${err.message}` });
    }

    res.json(rows);
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

// 下面不用管它
>>>>>>> Stashed changes
app.listen(port, () => {
  console.log(`伺服器啟動於 http://localhost:${port}`);
});
