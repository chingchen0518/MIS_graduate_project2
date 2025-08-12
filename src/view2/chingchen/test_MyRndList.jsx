import React, { useState } from "react";
import { Rnd } from "react-rnd";

const initialItems = [
  { id: "A", label: "虛囊恩湖", x: 0, y: 60, width: 220, height: 60 },
  { id: "B", label: "伯恩老城", x: 0, y: 160, width: 220, height: 60 },
  { id: "C", label: "蘇黎世湖", x: 0, y: 260, width: 220, height: 60 },
];

export default function MyRndList() {
  const [items, setItems] = useState(initialItems);

  // 拖拽移動後，根據y排序，並console順序
  function handleDragStop(id, d) {
    // 更新item位置
    const updated = items.map(item =>
      item.id === id ? { ...item, x: d.x, y: d.y } : item
    );
    setItems(updated);

    // 根據y值排序
    const sorted = [...updated].sort((a, b) => a.y - b.y);
    console.log("目前順序：", sorted.map(item => item.label));
  }

  return (
    <div style={{
      width: 260,
      margin: "0 auto",
      padding: "16px 0",
      background: "#fff",
      borderRadius: "12px",
      boxShadow: "0 2px 16px #eee",
      minHeight: 400,
      border: "1px solid #f4f4f4",
      position: "relative",
      height: 400,
    }}>
      {/* 三個可拖拽格子 */}
      {items.map(item => (
        <Rnd
          key={item.id}
          size={{ width: item.width, height: item.height }}
          position={{ x: item.x, y: item.y }}
          onDragStop={(e, d) => handleDragStop(item.id, d)}
          enableResizing={false}
          bounds="parent"
          style={{
            background: "#fff",
            border: "2px solid #333",
            borderRadius: 12,
            boxShadow: "0 2px 8px #ccc",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "1.25em",
            color: "#2c3e50",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span>{item.label}</span>
        </Rnd>
      ))}
    </div>
  );
}