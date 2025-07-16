const axios = require('axios');

// Channel Access Token 和 UserId
const accessToken = 'PnfGbFoRvw9+8bH6W9NAhE4btnXf72+LzKB5jNYQYjFCVPMBo/URIsBBjCEEXJe5JKfJlfXkWN/JXDUFr0u209b+08Modgf20rDwHIAEQVZ8tRlYDyL7u9fvaB6Bn2WFuwXWZtFcJi9wCqHCtv0MBwdB04t89/1O/w1cDnyilFU=';
const userId = 'U635b23fcfa3ad03e7e1bb4549a3be10e';

// 訊息清單（可依圖片調整順序與內容）
const messages = [
  '一起決定行程！不投怎麼決定去哪玩～',
  '投票倒數中！別錯過決定去哪的機會！',
  '投票期限更新囉！趕快來選你的行程～',
  '第二輪投票開始！選出最終行程！',
  '精選名單出爐！新增少量內文',
  '終極PK開始！來幫你最愛的點加油！',
  '平票啦！再投一次～票數一樣多！',
  '安排完成 ✅ 3/1票選結果出爐，點開看行程！',
  '段子結果出爐！3/1就去這裡吧！'
];

// 每 5 秒發送一則訊息
messages.forEach((text, i) => {
  setTimeout(() => {
    axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: userId,
        messages: [{ type: 'text', text }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    ).then(() => {
      console.log(`✅ 已發送：「${text}」`);
    }).catch(err => {
      console.error('❌ 發送失敗：', err.response?.data || err.message);
    });
  }, i * 5000); // i秒 × 5 秒
});
