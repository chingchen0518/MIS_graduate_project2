import express from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
  const events = req.body.events;

  if (events && events.length > 0) {
    const event = events[0];

    // 取得 userId 和訊息
    const userId = event.source.userId;
    const message = event.message.text;

    console.log('📩 使用者 userId:', userId);
    console.log('📩 訊息內容:', message);
  }

  res.sendStatus(200); // LINE 需要收到 200 才會停止重送
});

app.listen(3000, () => {
  console.log('🚀 Webhook server running on http://localhost:3000/webhook');
});
import './scheduler.js';



