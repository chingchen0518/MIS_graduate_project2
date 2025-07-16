import mysql from 'mysql2/promise';
import axios from 'axios';

// ✅ LINE 的 Channel Access Token
const accessToken = 'PnfGbFoRvw9+8bH6W9NAhE4btnXf72+LzKB5jNYQYjFCVPMBo/URIsBBjCEEXJe5JKfJlfXkWN/JXDUFr0u209b+08Modgf20rDwHIAEQVZ8tRlYDyL7u9fvaB6Bn2WFuwXWZtFcJi9wCqHCtv0MBwdB04t89/1O/w1cDnyilFU=';

// ✅ 要推播的 LINE 使用者 ID
const fixedUserId = 'U635b23fcfa3ad03e7e1bb4549a3be10e'; // 這裡填你要測試的 userId

// ✅ 建立資料庫連線
const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '20250101',
  database: 'travel'
});

// ✅ 取得所有 Trip 行程
async function getTripsToPush() {
  const [rows] = await connection.execute(`SELECT * FROM trip`);
  return rows;
}

// ✅ 將 stage_date + time 合併為完整結束時間
function addTime(dateTimeStr, timeStr) {
  const base = new Date(dateTimeStr);
  const [h, m, s] = timeStr.split(':').map(Number);
  base.setSeconds(base.getSeconds() + s);
  base.setMinutes(base.getMinutes() + m);
  base.setHours(base.getHours() + h);

  // 格式化為 yyyy-mm-dd hh:mm:ss
  const yyyy = base.getFullYear();
  const mm = String(base.getMonth() + 1).padStart(2, '0');
  const dd = String(base.getDate()).padStart(2, '0');
  const hh = String(base.getHours()).padStart(2, '0');
  const min = String(base.getMinutes()).padStart(2, '0');
  const sec = String(base.getSeconds()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`;
}

// ✅ 傳送訊息給指定 userId
async function sendMessage(userId, message) {
  try {
    await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: userId,
        messages: [{ type: 'text', text: message }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    console.log(`✅ 已推播給 ${userId}`);
  } catch (err) {
    console.error('❌ 發送失敗：', err.response?.data || err.message);
  }
}

// ✅ 每 10 秒檢查是否有行程結束
setInterval(async () => {
  console.log('🔁 正在檢查行程...');
  const now = new Date();
  const trips = await getTripsToPush();

  for (const trip of trips) {
    const endTimeStr = addTime(trip.stage_date, trip.time);
    const endTime = new Date(endTimeStr);
    const diff = now - endTime;

    console.log(`📍 行程「${trip.title}」的「${trip.stage}」階段結束時間為：${endTimeStr}`);

    // 如果結束時間在 10 秒內
    if (diff >= 0 && diff <= 10000) {
      await sendMessage(
        fixedUserId,
        `✈️ 您的行程「${trip.title}」的「${trip.stage}階段」已於 ${endTimeStr} 結束了！`
      );
    }
  }
}, 10000); // 每 10 秒執行一次
