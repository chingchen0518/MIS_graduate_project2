// backend/routes/tiebreak.js
import express from "express";
import { pickFinalChoice } from "../utils/seedHelper.js";

const router = express.Router();

// 暫存資料（正式請改 DB）
const submissions = new Map(); // Map<tripId, [{userId, roll, userName}]>
const deadlines  = new Map();  // Map<tripId, number(ms)>

function ensureDeadline(tripId) {
  if (!deadlines.has(tripId)) {
    deadlines.set(tripId, Date.now() + 2 * 60 * 1000); // 預設 2 分鐘
  }
}

// ✅ 注意這裡是「/submit」，不要加 /api/tiebreak 前綴
router.post("/submit", (req, res) => {
  console.log("SUBMIT body =", req.body);
  const { tripId, userId, roll } = req.body;
  if (!tripId || !userId || !Number.isInteger(roll) || roll < 1 || roll > 6) {
    return res.status(400).json({ ok: false, message: "參數不合法" });
  }
  ensureDeadline(tripId);
  const ddl = deadlines.get(tripId);
  if (Date.now() > ddl) return res.status(409).json({ ok: false, message: "已截止，無法送出" });

  const list = submissions.get(tripId) || [];
  const userName = `User-${userId}`;
  const i = list.findIndex((x) => x.userId === userId);
  if (i >= 0) list[i] = { userId, roll, userName };
  else list.push({ userId, roll, userName });
  submissions.set(tripId, list);

  res.json({ ok: true, userName, deadlineAt: ddl });
});

router.post("/finalize", (req, res) => {
  console.log("FINALIZE body =", req.body);
  const { tripId } = req.body;
  if (!tripId) return res.status(400).json({ ok: false, message: "缺少 tripId" });

  ensureDeadline(tripId);
  const list = submissions.get(tripId) || [];
  if (list.length === 0) return res.status(400).json({ ok: false, message: "尚無提交資料" });

  const candidates = [
    "Matterhorn",
    "Jungfraujoch",
    "Lake Geneva",
    "Chapel Bridge",
    "Rhine Falls",
  ];
  const rolls = list.map((x) => x.roll);
  const { finalChoice, seed } = pickFinalChoice(rolls, candidates);

  res.json({
    ok: true,
    finalChoice,
    seed,
    rolls: list,
    deadlineAt: deadlines.get(tripId),
  });
});

export default router;
