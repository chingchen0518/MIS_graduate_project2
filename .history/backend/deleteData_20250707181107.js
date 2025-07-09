import mysql from 'mysql2/promise';

// MySQL 連線設定（請依實際調整）
const config = {
    host: 'localhost',
    user: 'root',
    password: '20250101',
    database: 'travel',
    port: 3001,
};

async function deleteAllData() {
  const connection = await mysql.createConnection(config);

  try {
    // 關閉外鍵檢查，避免刪除時出錯
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 依照外鍵約束依序刪除資料（子表先刪）
    await connection.query('DELETE FROM Business');
    await connection.query('DELETE FROM Evaluate');
    await connection.query('DELETE FROM Include2');
    await connection.query('DELETE FROM Join');
    await connection.query('DELETE FROM Support');
    await connection.query('DELETE FROM Schedule');
    await connection.query('DELETE FROM Attraction');
    await connection.query('DELETE FROM Trip');
    await connection.query('DELETE FROM User');
    // Weekday 通常是固定枚舉，不一定要刪，但如果需要：
    // await connection.query('DELETE FROM Weekday');

    // 開啟外鍵檢查
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ 所有資料已刪除');
  } catch (err) {
    console.error('❌ 刪除資料時發生錯誤：', err);
  } finally {
    await connection.end();
  }
}

deleteAllData();
