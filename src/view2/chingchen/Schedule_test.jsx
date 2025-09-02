
import React, { useRef, useState } from "react";

// 1. ScheduleTest 組件（父組件）
export default function ScheduleTest() {
  // 三個 TimeBox 的位置
  const [positions, setPositions] = useState([
    { top: 20 },
    { top: 120 },
    { top: 220 }
  ]);

  // 3*4 Bar refs
  const barRefs = useRef(Array.from({ length: 3 }, () => Array(4).fill(null).map(() => React.createRef())));
  // 3個 time_box refs
  const timeBoxRefs = useRef([React.createRef(), React.createRef(), React.createRef()]);

  // 紀錄每個Bar是否碰撞
  const [barCollide, setBarCollide] = useState(
    Array.from({ length: 3 }, () => Array(4).fill(false))
  );


  // 拖曳時更新 TimeBox 位置，bar 跟著移動
  const handleDrag = (idx, newTop) => {
    setPositions(prev => {
      const updated = [...prev];
      updated[idx] = { top: newTop };
      return updated;
    });
    setTimeout(() => checkAllBarTimeBoxCollision(), 0);
  };

  // 碰撞檢查
  function isRectOverlap(r1, r2) {
    if (!r1 || !r2) return false;
    return (
      r1.left < r2.right &&
      r1.right > r2.left &&
      r1.top < r2.bottom &&
      r1.bottom > r2.top
    );
  }

  // 檢查所有 bar 與所有 time_box（非自己）碰撞，任何一方主動都會變色
  const checkAllBarTimeBoxCollision = () => {
    setBarCollide(prev => {
      const updated = prev.map(row => [...row]);
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
          const barRef = barRefs.current[i][j];
          if (!barRef.current) continue;
          const barRect = barRef.current.getBoundingClientRect();
          let collide = false;
          for (let k = 0; k < 3; k++) {
            if (k === i) continue;
            const boxRef = timeBoxRefs.current[k];
            if (!boxRef.current) continue;
            const boxRect = boxRef.current.getBoundingClientRect();
            if (isRectOverlap(boxRect, barRect)) {
              collide = true;
              break;
            }
          }
          updated[i][j] = collide;
        }
      }
      return updated;
    });
  };

  const times = [
    { id: 1, name: "策馬特" },
    { id: 2, name: "施皮茨城堡" },
    { id: 3, name: "伯恩老城" }
  ];

  return (
    <div style={{ width: 220, height: 400, padding: 10, background: "#fafafa", position: "relative" }}>
      {/* 渲染三個 TimeBox */}
      {times.map((t, i) => (
        <TimeBox
          key={t.id}
          name={t.name}
          position={positions[i]}
          onDrag={newTop => handleDrag(i, newTop)}
          boxRef={timeBoxRefs.current[i]}
          barRefs={barRefs.current[i]}
          barCollide={barCollide[i]}
        />
      ))}
    </div>
  );
}

// 2. TimeBox 組件（每個 time_box，下方有四個 Bar）
function TimeBox({ name, position, onDrag, boxRef, barRefs, barCollide }) {
  const dragging = useRef(false);
  // 四個 Bar 的顏色
  const barColors = ["#4ecdc4", "#f44", "#ff914d", "#428cef"];

  const handleMouseDown = e => {
    dragging.current = true;
    const startY = e.clientY;
    const startTop = position.top;
    const move = ev => {
      if (!dragging.current) return;
      const newTop = startTop + (ev.clientY - startY);
      onDrag(newTop);
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
      ref={boxRef}
      style={{
        position: "absolute",
        left: 0,
        top: position.top,
        width: 160,
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
      {/* 四個 Bar 水平排列在 time_box 下方 */}
      <div
        className={"time_box"}
        style={{
          position: "absolute",
          left: 10,
          top: 56,
          width: 140,
          display: "flex",
          flexDirection: "row",
          gap: 8,
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        {barColors.map((color, idx) => (
          <Bar
            key={idx}
            color={color}
            ref={barRefs[idx]}
            isCollide={barCollide[idx]}
          />
        ))}
      </div>
    </div>
  );
}

// 3. Bar 組件（單一 bar）
const Bar = React.forwardRef(function Bar({ color, isCollide }, ref) {
  return (
    <div
      ref={ref}
      style={{
        width: 16,
        height: 40,
        borderRadius: 3,
        background: isCollide ? '#f44' : color,
        marginBottom: 2,
        transition: 'background 0.2s',
        position: 'relative'
      }}
    />
  );
});