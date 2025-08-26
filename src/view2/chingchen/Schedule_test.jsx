import React, { useRef, useEffect, useState } from "react";

// 工具函數：矩形碰撞檢查
function isRectOverlap(r1, r2) {
  if (!r1 || !r2) return false;
  return (
    r1.left < r2.right &&
    r1.right > r2.left &&
    r1.top < r2.bottom &&
    r1.bottom > r2.top
  );
}

// 父組件
export default function ScheduleTest() {
  // 各 time_box、bar 的 ref
  const timeBoxRefs = [useRef(), useRef(), useRef()];
  // bar 的位置由父組件統一渲染，並與 time 綁定
  const barRefs = [useRef(), useRef(), useRef()];
  // 將每組的 position 狀態提升到父層
  const [positions, setPositions] = useState([
    { left: 0, top: 20 },
    { left: 0, top: 100 },
    { left: 0, top: 180 }
  ]);

  // 碰撞狀態：collideStates[boxIdx][barIdx] = true/false
  const [collideStates, setCollideStates] = useState(
    Array(3).fill(0).map(() => Array(3).fill(false))
  );

  // 拖曳時檢查所有 time_box 與所有 bar 的碰撞
  const checkAllCollisions = () => {
    const newStates = Array(3).fill(0).map(() => Array(3).fill(false));
    for (let i = 0; i < 3; i++) {
      const boxRef = timeBoxRefs[i];
      if (!boxRef.current) continue;
      const boxRect = boxRef.current.getBoundingClientRect();
      for (let j = 0; j < 3; j++) {
        const barRef = barRefs[j];
        if (!barRef.current) continue;
        const barRect = barRef.current.getBoundingClientRect();
        newStates[i][j] = isRectOverlap(boxRect, barRect);
      }
    }
    setCollideStates(newStates);
  };

  // 拖曳時更新 position
  const handleDrag = (idx, newLeft, newTop) => {
    setPositions(prev => {
      const updated = [...prev];
      updated[idx] = { left: newLeft, top: newTop };
      return updated;
    });
  };
  const times = [
    { id: 1, name: "策馬特" },
    { id: 2, name: "施皮茨城堡" },
    { id: 3, name: "伯恩老城" }
  ];

  return (
    <div style={{ width: 180, height: 400, padding: 10, background: "#fafafa", position: "relative" }}>
      {/* 垂直排列，每組一行，僅能垂直拖曳 */}
      {times.map((t, i) => (
        <React.Fragment key={t.id}>
          <Time
            name={t.name}
            timeBoxRef={timeBoxRefs[i]}
            collideStates={collideStates[i]}
            position={positions[i]}
            onDrag={(left, top) => {
              // 僅允許 top 改變，left 固定
              handleDrag(i, 0, top);
              setTimeout(checkAllCollisions, 0);
            }}
          />
          <Bar
            ref={barRefs[i]}
            isCollide={collideStates.some(row => row[i])}
            style={{
              position: "absolute",
              left: 54, // 與 time_box 水平置中
              top: positions[i].top + 48 + 4, // time_box 下方 4px
              width: 32,
              height: 10,
              borderRadius: 3,
              transition: "background 0.2s"
            }}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

// 子組件 Time
function Time({ name, timeBoxRef, collideStates, position, onDrag }) {
  const dragging = useRef(false);

  const handleMouseDown = (e) => {
    dragging.current = true;
    const startY = e.clientY;
    const startTop = position.top;

    const move = (ev) => {
      if (!dragging.current) return;
      // 只允許垂直拖曳
      const newTop = startTop + (ev.clientY - startY);
      onDrag(0, newTop);
    };
    const up = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <div
      className="time_box"
      ref={timeBoxRef}
      style={{
        position: "absolute",
        left: 0,
        top: position.top,
        width: 120,
        height: 48,
        background: "#fff",
        border: "2px solid #222",
        borderRadius: 9,
        boxShadow: "0 2px 6px #aaa",
        fontSize: 20,
        fontWeight: "bold",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "grab",
        zIndex: 2,
        userSelect: "none",
        marginBottom: 10
      }}
      onMouseDown={handleMouseDown}
    >
      {name}
    </div>
  );
}

// bar 子組件（forwardRef）
const Bar = React.forwardRef(function Bar({ isCollide, style }, ref) {
  return (
    <div
      ref={ref}
      style={{
        background: isCollide ? "#f44" : "#4ecdc4",
        ...style
      }}
    />
  );
});