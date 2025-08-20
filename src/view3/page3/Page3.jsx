// src/view3/page3/Page3.jsx
import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
]
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
        

        {/* 右欄：骰子區 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: "0 0 12px 0" }}>Final Tiebreak</h1>
          <DiceSelector />
        </div>
      </div>
    </DndProvider>
  );
}
