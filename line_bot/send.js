const axios = require('axios');

// Channel Access Token
const accessToken = 'PnfGbFoRvw9+8bH6W9NAhE4btnXf72+LzKB5jNYQYjFCVPMBo/URIsBBjCEEXJe5JKfJlfXkWN/JXDUFr0u209b+08Modgf20rDwHIAEQVZ8tRlYDyL7u9fvaB6Bn2WFuwXWZtFcJi9wCqHCtv0MBwdB04t89/1O/w1cDnyilFU=';

const sendLineMessage = async () => {
  try {
    const res = await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        //  userId
        to: 'U635b23fcfa3ad03e7e1bb4549a3be10e',
        messages: [
          {
            type: 'text',
            text: '👋 你好！這是從你的旅遊網站發送的第一則 LINE 訊息！'
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    console.log('✅ 發送成功：', res.data);
  } catch (err) {
    console.error('❌ 發送失敗：', err.response?.data || err.message);
  }
};

sendLineMessage();
