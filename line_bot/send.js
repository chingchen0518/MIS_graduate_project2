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
            text: '請先在系統註冊完後，輸入您的gmail'
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
