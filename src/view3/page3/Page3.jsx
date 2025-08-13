// src/view3/page3/Page3.jsx
import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// 直接重用你 page2 的行程元件與樣式（路徑依你的專案調整）
import ScheduleContainer from "../page2ScheduleContainer.jsx";
import "../page2/chingchen/schedule.css";
import "../page2/chingchen/ScheduleContainer.css";

// 右側骰子
import DiceSelector from "./DiceSelector.jsx";
import "./DiceSelector.css";

export default function Page3() {
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
        {/* 左欄：沿用原本的行程介面 */}
        <div style={{ flex: 2, minWidth: 0 }}>
          <div className="schedule_container" style={{ width: "100%" }}>
            {/* 注意：這裡的 t_id 先用 1，之後要改成實際的 trip id */}
            <ScheduleContainer t_id={1} />
          </div>
        </div>

        {/* 右欄：骰子區 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: "0 0 12px 0" }}>Final Tiebreak</h1>
          <DiceSelector />
        </div>
      </div>
    </DndProvider>
  );
}
