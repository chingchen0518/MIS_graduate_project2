import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import seedrandom from "seedrandom";
import "./DiceSelector.css";

/** 主要：直接輸入 1–6；輔助：右側擲骰（帶入輸入框） */
const DiceSelector = ({ tripId, userId, durationSec = 120 }) => {
  const candidates = [
    "Matterhorn",
    "Jungfraujoch",
    "Lake Geneva",
    "Chapel Bridge",
    "Rhine Falls",
  ];

  // 狀態
  const [result, setResult] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [face, setFace] = useState(1);
  const [rollInput, setRollInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [submittedCount, setSubmittedCount] = useState(0);
  const [deadlineTs, setDeadlineTs] = useState(null);
  const [leftSec, setLeftSec] = useState(0);
  const [isClosed, setIsClosed] = useState(false);
  const finalizedRef = useRef(false);

  // 驗證資料
  const [verifyData, setVerifyData] = useState(null);
  const [verifyOpen, setVerifyOpen] = useState(false);

  // 進場：抓狀態 + deadline
  useEffect(() => {
    (async () => {
      await refreshStateWithFallback();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  // 倒數（以後端 deadline 為準）
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

  // 到期自動決策（只一次）
  useEffect(() => {
    if (isClosed && !finalizedRef.current) {
      finalizedRef.current = true;
      clientFinalize(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClosed]);

  const refreshStateWithFallback = async () => {
    try {
      const { data } = await axios.get("/api/tiebreak/state", {
        params: { tripId },
      });
      if (data?.ok) {
        if (Array.isArray(data.rolls)) setSubmittedCount(data.rolls.length);
        if (data.deadlineAt) setDeadlineTs(data.deadlineAt);
        else setDeadlineTs(Date.now() + durationSec * 1000);
        return;
      }
      setDeadlineTs(Date.now() + durationSec * 1000);
    } catch {
      setDeadlineTs(Date.now() + durationSec * 1000);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  /** 輔助：擲骰（只為了幫你決定數字，會帶到輸入框） */
  const rollDice = () => {
    if (rolling || isClosed) return;
    setRolling(true);
    const nextFace = Math.floor(Math.random() * 6) + 1;
    setTimeout(() => {
      setFace(nextFace);
      setRollInput(String(nextFace)); // 帶入主要輸入框
      setRolling(false);
    }, 1200);
  };

  /** 主要：送出我的點數 */
  const submitMyRoll = async () => {
    if (isClosed) return alert("送出失敗：已截止，無法送出");
    const n = Number(rollInput);
    if (!Number.isInteger(n) || n < 1 || n > 6) {
      return alert("請輸入 1~6 的整數點數。");
    }
    if (!tripId || !userId) return alert("缺少 tripId 或 userId。");

    try {
      setSubmitting(true);
      const { data } = await axios.post("/api/tiebreak/submit", {
        tripId,
        userId,
        roll: n,
      });
      if (data?.ok) {
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

  /** 用 rolls 建立驗證快照（seed、index、候選快照等） */
  const buildVerifySnapshot = (rolls) => {
    const sorted = [...rolls].sort((a, b) =>
      String(a.userId).localeCompare(String(b.userId))
    );
    const rollsSorted = sorted.map((x) => x.roll);
    const seed = rollsSorted.join("-");
    const candidatesSnap = [...candidates];
    const rng = seedrandom(seed);
    const rand = rng();
    const index = Math.floor(rand * candidatesSnap.length);
    const final = candidatesSnap[index];
    return {
      seed,
      rollsSorted,
      candidates: candidatesSnap,
      rand,
      index,
      final,
    };
  };

  /** 產生最終結果（倒數歸零自動或手動） */
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

      const snap = buildVerifySnapshot(rolls);
      setVerifyData(snap);            // 保存驗證資料
      setResult(snap.final);          // 顯示結果

      if (!fromTimer) alert(`前端決策完成：${snap.final}\nseed=${snap.seed}`);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "決策失敗（網路或伺服器錯誤）。";
      if (!fromTimer) alert(`決策失敗：${msg}`);
    }
  };

  const quickNums = [1, 2, 3, 4, 5, 6];

  const copy = async (txt) => {
    try {
      await navigator.clipboard.writeText(String(txt));
      alert("已複製到剪貼簿！");
    } catch {
      alert("複製失敗，請手動選取複製。");
    }
  };

  return (
    <div className="dice-only-wrapper">
      <div className="panel tiebreak-card">
        <div className="card-header">
          <div className="title">Final Tiebreak</div>
          <div className="timer-badge" title="倒數至截止">
            <span className="sandglass">⏳</span>
            <span>時間倒數：{formatTime(leftSec)}</span>
          </div>
        </div>

        {/* 主要：輸入/送出（左） + 輔助：擲骰（右） */}
        <div className="main-grid">
          {/* 左：主要操作 */}
          <section className="primary-box">
            <div className="field-label">輸入你的點數（1–6）</div>

            <div className="field-row">
              <input
                className="roll-input big"
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
                className="btn btn-primary"
                onClick={submitMyRoll}
                disabled={submitting || isClosed}
                title="送出我的點數"
              >
                {submitting ? "送出中..." : "送出點數"}
              </button>
            </div>

            <div className="chips-row">
              {quickNums.map((n) => (
                <button
                  key={n}
                  className={`chip ${String(n) === rollInput ? "active" : ""}`}
                  onClick={() => setRollInput(String(n))}
                  disabled={isClosed}
                  aria-label={`快速填入 ${n}`}
                >
                  {n}
                </button>
              ))}
              <span className="chips-hint">或使用右側「幫我擲骰」</span>
            </div>

            <div className="submitted-indicator">
              已送出人數：<strong>{submittedCount}</strong> 人
            </div>
          </section>

          {/* 右：輔助擲骰 */}
          <aside className="helper-box">
            <div className="helper-title">不確定？幫你擲骰</div>

            <div className="dice-stage compact">
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

            <button
              className="btn btn-secondary btn-wide"
              onClick={rollDice}
              disabled={rolling || isClosed}
              title="Roll the dice"
            >
              {rolling ? "Rolling..." : "Roll the Dice"}
            </button>

            <p className="mini-hint">擲到的點數會自動填到左邊輸入欄</p>
          </aside>
        </div>

        {/* 最終決策 + 截止狀態 */}
        <div className="finalize-row">
          <button
            className="btn btn-cta btn-wide"
            onClick={() => clientFinalize(false)}
            title="以目前資料產生最終結果"
          >
            ✅ 最終決策
          </button>
          {isClosed && (
            <div className="closed-banner">已截止（到時自動決策）</div>
          )}
        </div>

        {/* 結果 */}
        {result && (
          <div className="result-card" role="status" aria-live="polite">
            <div className="result-title">🎉 Final Choice</div>
            <div className="result-value">{result}</div>

            {/* Seed 驗證按鈕 */}
            <div style={{ marginTop: 10 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setVerifyOpen((v) => !v)}
                disabled={!verifyData}
                title="顯示/隱藏驗證資料"
              >
                {verifyOpen ? "隱藏驗證資料" : "顯示驗證資料"}
              </button>
            </div>
          </div>
        )}

        {/* 驗證區塊 */}
        {verifyOpen && verifyData && (
          <div className="verify-card">
            <div className="verify-header">
              <strong>Seed 驗證</strong>
              <span
                className={
                  verifyData.final === result ? "pill-ok" : "pill-bad"
                }
              >
                {verifyData.final === result ? "已驗證一致" : "不一致"}
              </span>
            </div>

            <div className="verify-row">
              <span>Rolls（依 userId 排序）</span>
              <code className="mono">{verifyData.rollsSorted.join("-")}</code>
            </div>

            <div className="verify-row">
              <span>Seed</span>
              <code className="mono">{verifyData.seed}</code>
              <button
                className="copy-btn"
                onClick={() => copy(verifyData.seed)}
              >
                複製
              </button>
            </div>

            <div className="verify-row">
              <span>候選清單（順序不可變）</span>
              <code className="mono">
                {verifyData.candidates.join(" | ")}
              </code>
            </div>

            <div className="verify-row">
              <span>計算</span>
              <code className="mono">
                rng()={verifyData.rand.toFixed(12)} → index =
                floor(rng * {verifyData.candidates.length}) ={" "}
                {verifyData.index}
              </code>
            </div>

            <div className="verify-row">
              <span>由 seed 得到的結果</span>
              <code className="mono">{verifyData.final}</code>
            </div>

            <div className="verify-actions">
              <button
                className="copy-btn"
                onClick={() =>
                  copy(
                    JSON.stringify(
                      {
                        seed: verifyData.seed,
                        rollsSorted: verifyData.rollsSorted,
                        candidates: verifyData.candidates,
                        rand: verifyData.rand,
                        index: verifyData.index,
                        final: verifyData.final,
                      },
                      null,
                      2
                    )
                  )
                }
              >
                複製驗證 JSON
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiceSelector;
