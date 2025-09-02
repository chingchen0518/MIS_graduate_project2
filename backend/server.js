// backend/server.js
import express from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// ===== 參數 =====
const DEFAULT_DEADLINE_MS =
  parseInt(process.env.TIEBREAK_DEADLINE_MS || "", 10) || 2 * 60 * 1000; // 預設 2 分鐘

// ===== 簡單日誌，方便除錯 =====
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 健康檢查
app.get("/api/ping", (_req, res) => res.json({ ok: true, server: "tiebreak-backend" }));

// ===== In-memory 暫存（正式請改 DB）=====
const submissions = new Map(); // Map<tripId, Array<{ userId: string, roll: number }>>
const deadlines  = new Map();  // Map<tripId, number(ms)>

function ensureDeadline(tripId) {
  if (!deadlines.has(tripId)) {
    deadlines.set(tripId, Date.now() + DEFAULT_DEADLINE_MS);
  }
}

function upsertRoll(tripId, userId, roll) {
  const list = submissions.get(tripId) || [];
  const idx = list.findIndex((x) => String(x.userId) === String(userId));
  const entry = { userId: String(userId), roll: Number(roll) };
  if (idx >= 0) list[idx] = entry;
  else list.push(entry);
  submissions.set(tripId, list);
  return list;
}

// 只讀狀態（前端用它來取得 rolls，並在前端 seedrandom 決策）
// GET /api/tiebreak/state?tripId=101
app.get("/api/tiebreak/state", (req, res) => {
  const tripId = String(req.query.tripId ?? "").trim();
  if (!tripId) return res.status(400).json({ ok: false, message: "缺少 tripId" });

  // 第一次讀取也會建立/回傳 deadlineAt，讓前端倒數與後端同步
  ensureDeadline(tripId);
  const ddl = deadlines.get(tripId);
  const list = submissions.get(tripId) || [];

  res.json({ ok: true, rolls: list, deadlineAt: ddl });
});

// 玩家送出點數
// POST /api/tiebreak/submit { tripId, userId, roll }
app.post("/api/tiebreak/submit", (req, res) => {
  const { tripId, userId, roll } = req.body || {};
  const tId = String(tripId ?? "").trim();
  const uId = String(userId ?? "").trim();
  const r = Number(roll);

  if (!tId || !uId || !Number.isInteger(r) || r < 1 || r > 6) {
    return res.status(400).json({ ok: false, message: "參數不合法" });
  }

  ensureDeadline(tId);
  const ddl = deadlines.get(tId);
  if (Date.now() > ddl) {
    return res.status(409).json({ ok: false, message: "已截止，無法送出", deadlineAt: ddl });
  }

  const list = upsertRoll(tId, uId, r);
  res.json({ ok: true, count: list.length, deadlineAt: ddl });
});

// 404 fallback（避免看到 Express 預設的 "Cannot GET ..."）
app.use((req, res) => {
  res.status(404).json({ ok: false, message: "Not Found", route: `${req.method} ${req.path}` });
});

// 啟動
const PORT = process.env.PORT || 3999;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
