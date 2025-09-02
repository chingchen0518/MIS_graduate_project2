import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import seedrandom from "seedrandom";
import "./DiceSelector.css";

/**
 * 前端決策版（方案 B）
 * - 後端：/api/tiebreak/submit（提交點數）、/api/tiebreak/state（讀取 rolls 與 deadlineAt）
 * - 前端：倒數結束或按「最終決策」→ 讀取 rolls → 用 seedrandom 產生結果
 * - 不顯示 username，只顯示已送出人數
 */
const DiceSelector = ({ tripId, userId, durationSec = 120 }) => {
  // 前端決策用候選清單（注意：方案 B 僅適合 Demo；此清單在前端可被修改）
  const candidates = [
    "Matterhorn",
    "Jungfraujoch",
    "Lake Geneva",
    "Chapel Bridge",
    "Rhine Falls",
  ];

  // 介面狀態
  const [result, setResult] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [face, setFace] = useState(1);
  const [rollInput, setRollInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 只統計人數，不存名稱
  const [submittedCount, setSubmittedCount] = useState(0);

  // 倒數與截止（用後端 deadline 同步）
  const [deadlineTs, setDeadlineTs] = useState(null); // number(ms)
  const [leftSec, setLeftSec] = useState(0);
  const [isClosed, setIsClosed] = useState(false);
  const finalizedRef = useRef(false); // 避免重複決策

  // 進場先讀一次狀態（含 deadlineAt）
  useEffect(() => {
    (async () => {
      await refreshStateWithFallback();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  // 有了 deadlineTs 才開始倒數
  useEffect(() => {
    if (!deadlineTs) return;
    const tick = () => {
      const remain = Math.max(0, Math.floor((deadlineTs - Date.now()) / 1000));
      setLeftSec(remain);
      if (remain === 0) setIsClosed(true);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadlineTs]);

  // 倒數結束 → 自動前端決策（只執行一次）
  useEffect(() => {
    if (isClosed && !finalizedRef.current) {
      finalizedRef.current = true;
      clientFinalize(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClosed]);

  // 讀取狀態：優先用後端 deadline；若失敗則用本地 fallback
  const refreshStateWithFallback = async () => {
    try {
      const { data } = await axios.get("/api/tiebreak/state", {
        params: { tripId },
      });
      if (data?.ok) {
        if (Array.isArray(data.rolls)) setSubmittedCount(data.rolls.length);
        if (data.deadlineAt) {
          setDeadlineTs(data.deadlineAt);
        } else {
          setDeadlineTs(Date.now() + durationSec * 1000);
        }
        return;
      }
      // not ok → fallback
      setDeadlineTs(Date.now() + durationSec * 1000);
    } catch {
      setDeadlineTs(Date.now() + durationSec * 1000);
    }
  };

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const hh = h.toString().padStart(2, "0");
    const mm = m.toString().padStart(2, "0");
    const ss = s.toString().padStart(2, "0");
    return h > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
  };

  // 視覺擲骰（僅 UI 效果），並把點數帶入輸入框
  const rollDice = () => {
    if (rolling || isClosed) return;
    setRolling(true);
    const nextFace = Math.floor(Math.random() * 6) + 1;
    setTimeout(() => {
      setFace(nextFace);
      setRollInput(String(nextFace));
      // 視覺上臨時顯示某個候選（真正結果以最終決策為準）
      const winner = candidates[(nextFace - 1) % candidates.length];
      setResult(winner);
      setRolling(false);
    }, 1200);
  };

  // 送出我的點數
  const submitMyRoll = async () => {
    if (isClosed) {
      alert("送出失敗：已截止，無法送出");
      return;
    }
    const n = Number(rollInput);
    if (!Number.isInteger(n) || n < 1 || n > 6) {
      alert("請輸入 1~6 的整數點數。");
      return;
    }
    if (!tripId || !userId) {
      alert("缺少 tripId 或 userId。");
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await axios.post("/api/tiebreak/submit", {
        tripId,
        userId,
        roll: n,
      });
      if (data?.ok) {
        // 成功後同步一次（人數 + deadline）
        if (typeof data.deadlineAt === "number") setDeadlineTs(data.deadlineAt);
        await refreshStateWithFallback();
        alert("已送出你的點數！");
      } else {
        alert(data?.message || "送出失敗。");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "送出失敗（網路或伺服器錯誤）。";
      alert(`送出失敗：${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 方案 B：前端自行決策（倒數歸零會自動觸發；也可按按鈕手動觸發）
  const clientFinalize = async (fromTimer = false) => {
    try {
      const { data } = await axios.get("/api/tiebreak/state", {
        params: { tripId },
      });
      if (!data?.ok) {
        if (!fromTimer) alert(data?.message || "讀取狀態失敗");
        return;
      }
      const rolls = Array.isArray(data.rolls) ? data.rolls : [];
      if (rolls.length === 0) {
        if (!fromTimer) alert("尚無提交資料，無法決策");
        return;
      }

      // 以所有人的 roll（依 userId 排序）組成 seed
      const sorted = [...rolls].sort((a, b) =>
        String(a.userId).localeCompare(String(b.userId))
      );
      const seed = sorted.map((x) => x.roll).join("-");

      const rng = seedrandom(seed);
      const index = Math.floor(rng() * candidates.length);
      const finalChoice = candidates[index];

      setResult(finalChoice);
      if (!fromTimer) alert(`前端決策完成：${finalChoice}\nseed=${seed}`);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "決策失敗（網路或伺服器錯誤）。";
      if (!fromTimer) alert(`決策失敗：${msg}`);
    }
  };

  return (
    <div className="dice-only-wrapper">
      <div className="panel">
        {/* 右上角倒數（與後端 deadline 同步） */}
        <div className="timer-badge" title="倒數至截止">
          <span className="sandglass">⏳</span>
          <span>時間倒數：{formatTime(leftSec)}</span>
        </div>

        <div className="title">Final Tiebreak</div>

        {/* 骰子舞台 */}
        <div className="dice-stage">
          <div
            className={`dice ${rolling ? "rolling" : `show-${face}`}`}
            aria-label={`dice showing ${face}`}
          >
            <div className="face one">
              <span className="pip center" />
            </div>
            <div className="face two">
              <span className="pip tl" />
              <span className="pip br" />
            </div>
            <div className="face three">
              <span className="pip tl" />
              <span className="pip center" />
              <span className="pip br" />
            </div>
            <div className="face four">
              <span className="pip tl" />
              <span className="pip tr" />
              <span className="pip bl" />
              <span className="pip br" />
            </div>
            <div className="face five">
              <span className="pip tl" />
              <span className="pip tr" />
              <span className="pip center" />
              <span className="pip bl" />
              <span className="pip br" />
            </div>
            <div className="face six">
              <span className="pip tl" />
              <span className="pip ml" />
              <span className="pip bl" />
              <span className="pip tr" />
              <span className="pip mr" />
              <span className="pip br" />
            </div>
          </div>
        </div>

        {/* 輸入 + 送出 + 擲骰 */}
        <div className="input-controls">
          <input
            className="roll-input"
            type="number"
            inputMode="numeric"
            min={1}
            max={6}
            placeholder="輸入 1~6"
            value={rollInput}
            onChange={(e) => setRollInput(e.target.value)}
            disabled={isClosed}
          />
          <button
            className="small-btn"
            onClick={submitMyRoll}
            disabled={submitting || isClosed}
            title="送出我的點數"
          >
            {submitting ? "送出中..." : "送出我的點數"}
          </button>

          <div style={{ flex: 1 }} />
          <button
            className="roll-btn"
            onClick={rollDice}
            disabled={rolling || isClosed}
            title="Roll the dice"
          >
            {rolling ? "Rolling..." : "Roll the Dice"}
          </button>
        </div>

        {/* 只顯示人數，不顯示名稱 */}
        {submittedCount > 0 && (
          <div className="submitted-list">
            <h4>已送出：{submittedCount} 人</h4>
          </div>
        )}

        {/* 手動觸發前端決策 */}
        <div className="controls" style={{ marginTop: 12 }}>
          <button
            className="small-btn"
            onClick={() => clientFinalize(false)}
            title="以目前資料由前端產生最終結果"
          >
            最終決策
          </button>
        </div>

        {isClosed && <div className="closed-banner">已截止（將自動決策）</div>}

        {result && (
          <div className="result-badge">
            🎉 Final Choice:&nbsp;<strong>{result}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiceSelector;
