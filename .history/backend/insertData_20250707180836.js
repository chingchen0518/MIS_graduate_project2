import mysql from 'mysql2/promise';

// MySQL 連線設定（請依實際調整）
const config = {
  host: 'localhost',
  user: '你的帳號',
  password: '你的密碼',
  database: 'travel',
    port: 3301
};

async function insertFakeData() {
  const connection = await mysql.createConnection(config);

  try {
    // 1. User
    await connection.query(`
      INSERT INTO User (u_img, u_name, u_email, u_password, u_account) VALUES
      ('avatar1.png', '王小明', 'ming@example.com', '123456', 'ming001'),
      ('avatar2.png', '陳美麗', 'mei@example.com', 'abcdef', 'mei002');
    `);

    // 2. Trip
    await connection.query(`
      INSERT INTO Trip (s_date, e_date, s_time, e_time, country, time, title, stage, u_id) VALUES
      ('2025-07-01', '2025-07-05', '08:00:00', '20:00:00', 'Japan', '12:00:00', '東京之旅', '計畫中', 1),
      ('2025-08-10', '2025-08-15', '09:00:00', '19:00:00', 'Korea', '10:00:00', '首爾探訪', '完成', 2);
    `);

    // 3. Attraction
    await connection.query(`
      INSERT INTO Attraction (t_id, name, category, address, budget, photo, u_id) VALUES
      (1, '淺草寺', '文化景點', '東京都台東區', 0, 'temple.jpg', 1),
      (2, '樂天世界', '遊樂園', '首爾松坡區', 2000, 'lotte.jpg', 2);
    `);

    // 4. Weekday
    await connection.query(`
      INSERT INTO Weekday (w_day) VALUES
      ('Monday'), ('Tuesday'), ('Wednesday'),
      ('Thursday'), ('Friday'), ('Saturday'), ('Sunday');
    `);

    // 5. Business
    await connection.query(`
      INSERT INTO Business (a_id, t_id, w_day, period, open_time, close_time) VALUES
      (1, 1, 'Monday', 1, '09:00:00', '17:00:00'),
      (2, 2, 'Saturday', 1, '10:00:00', '22:00:00');
    `);

    // 6. Schedule
    await connection.query(`
      INSERT INTO Schedule (t_id, date, u_id) VALUES
      (1, '2025-07-02', 1),
      (2, '2025-08-12', 2);
    `);

    // 7. Include2
    await connection.query(`
      INSERT INTO Include2 (s_id, a_id, t_id, sequence, walk_t, car_t, motor_t, public_t) VALUES
      (1, 1, 1, 1, '00:10:00', '00:15:00', NULL, '00:20:00'),
      (2, 2, 2, 2, '00:05:00', NULL, '00:10:00', '00:12:00');
    `);

    // 8. Evaluate
    await connection.query(`
      INSERT INTO Evaluate (u_id, s_id, t_id, good, bad) VALUES
      (1, 1, 1, TRUE, FALSE),
      (2, 2, 2, FALSE, TRUE);
    `);

    // 9. Join
    await connection.query(`
      INSERT INTO Join (u_id, t_id, color) VALUES
      (1, 1, '#FF5733'),
      (2, 2, '#33C1FF');
    `);

    // 10. Support
    await connection.query(`
      INSERT INTO Support (u_id, a_id, reason, onelove, twolove) VALUES
      (1, 1, '很棒的文化體驗', 3, 1),
      (2, 2, '非常刺激好玩', 5, 2);
    `);

    console.log('✅ 假資料插入完成');
  } catch (err) {
    console.error('❌ 插入假資料錯誤：', err);
  } finally {
    await connection.end();
  }
}

insertFakeData();
