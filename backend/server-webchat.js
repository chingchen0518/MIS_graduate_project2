// backend/server-webchat.js
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1) 反向代理：/gss/* → https://cai-innoserve.gss.com.tw/*
app.use(
  '/gss',
  createProxyMiddleware({
    target: 'https://cai-innoserve.gss.com.tw',
    changeOrigin: true,
    secure: true,
    pathRewrite: { '^/gss': '' }, // /gss/xxx → /xxx
    onProxyReq: (proxyReq) => {
      // 可選：有些服務會檢查這些 header，幫你補上比較保險
      proxyReq.setHeader('Origin', 'https://cai-innoserve.gss.com.tw');
      proxyReq.setHeader('Referer', 'https://cai-innoserve.gss.com.tw/');
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0');
    },
  })
);

// 2) 靜態檔案：讓你能直接開 robot_test.html
const modelsDir = path.join(__dirname, 'models');
app.use(express.static(modelsDir));

// 3) 預設路由（可選）
app.get('/', (_req, res) => {
  res.redirect('/robot_test.html');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`WebChat dev server on http://localhost:${PORT}`);
  console.log(`Open: http://localhost:${PORT}/robot_test.html?`);
});
