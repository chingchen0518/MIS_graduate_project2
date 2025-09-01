// src/view3/page3/Page3.jsx
import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// 右側骰子
import DiceSelector from "./DiceSelector.jsx";
import "./DiceSelector.css";

export default function Page3() {
  // 這裡用示範值；實務上可從登入狀態或路由參數取得
  const tripId = 101;   // 你的行程 ID
  const userId = 7;     // 目前登入使用者 ID

  // 倒數設定（擇一）：
  const durationSec = 90; // A. 相對倒數：元件掛載後 90 秒截止
  // const deadlineAt = new Date(Date.now() + 90 * 1000).toISOString(); // B. 絕對截止時間，優先於 durationSec

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        style={{
          display: "flex",
          gap: "20px",
          padding: "20px",
          background: "linear-gradient(180deg, #eef6ff 0%, #e4f0ff 100%)",
          minHeight: "100vh",
        }}
      >
        {/* 右欄：骰子區 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: "0 0 12px 0" }}>Final Tiebreak</h1>

          <DiceSelector
            tripId={tripId}
            userId={userId}
            expectedPlayers={4}
            durationSec={durationSec}
            // deadlineAt={deadlineAt} // 若想用絕對時間請改用這行，並註解掉 durationSec
          />
        </div>
      </div>
    </DndProvider>
  );
}
