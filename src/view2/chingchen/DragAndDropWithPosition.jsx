import React, { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const DraggableBox = () => {
  const [{ isDragging }, dragRef] = useDrag({
    type: "BOX",
    item: { id: "source-box" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={dragRef}
      style={{
        width: "50px",
        height: "50px",
        backgroundColor: isDragging ? "lightgreen" : "skyblue",
        textAlign: "center",
        lineHeight: "50px",
        cursor: "move",
        border: "1px solid black",
      }}
    >
      Drag Me
    </div>
  );
};

const DropTargetArea = () => {
  const [positions, setPositions] = useState([]); // 存储每次放置的位置
  const dropRef = React.useRef(null); // 用于获取目标区域的 DOM 元素

  const [{ isOver }, drop] = useDrop({
    accept: "BOX",
    drop: (item, monitor) => {
      if (!dropRef.current) {
        console.error("Drop target not found!");
        return;
      }

      // 获取 `drop source` 的实际位置
      const sourceOffset = monitor.getSourceClientOffset();
      if (!sourceOffset) {
        console.error("Source offset not found!");
        return;
      }

      // 获取目标区域的边界框
      const dropTargetRect = dropRef.current.getBoundingClientRect();

      // 计算放置位置相对于目标区域的偏移
      const x = sourceOffset.x - dropTargetRect.left;
      const y = sourceOffset.y - dropTargetRect.top;

      // 更新放置位置
      setPositions((prevPositions) => [...prevPositions, { x, y }]);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drop(dropRef); // 将 dropRef 绑定到 useDrop

  return (
    <div
      ref={dropRef} // 确保 ref 绑定到目标区域
      style={{
        position: "relative",
        width: "400px",
        height: "200px",
        border: "2px dashed gray",
        backgroundColor: isOver ? "lightyellow" : "white",
        marginTop: "20px",
      }}
    >
      {/* 渲染所有的放置位置 */}
      {positions.map((pos, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            width: "50px",
            height: "50px",
            backgroundColor: "lightblue",
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            border: "1px solid black",
          }}
        >
          Box
        </div>
      ))}
      {isOver && <p style={{ position: "absolute", bottom: "10px", left: "10px" }}>Drop Here</p>}
    </div>
  );
};

const DragAndDropWithPosition = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <DraggableBox />
        <DropTargetArea />
      </div>
    </DndProvider>
  );
};

export default DragAndDropWithPosition;