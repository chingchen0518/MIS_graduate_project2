import React, { useState } from "react";
import { DndProvider, useDrag, useDrop, useDragLayer } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { getEmptyImage } from "react-dnd-html5-backend";

const GRID_SIZE = 50;
const PREVIEW_WIDTH = 200;
const PREVIEW_HEIGHT = 50;

// 1. 這是我們想要顯示的自定義預覽圖的樣式
const CustomPreview = () => {
  return (
    <div
      style={{
        width: `${PREVIEW_WIDTH}px`,
        height: `${PREVIEW_HEIGHT}px`,
        backgroundColor: "lightcoral",
        color: "white",
        textAlign: "center",
        lineHeight: `${PREVIEW_HEIGHT}px`,
        border: "2px solid black",
        boxSizing: 'border-box', // 確保邊框不會增加總寬度
      }}
    >
      Custom Preview
    </div>
  );
};

// 2. 創建自定義拖拽圖層 (Drag Layer)
const layerStyles = {
  position: "fixed",
  pointerEvents: "none",
  zIndex: 100,
  left: 0,
  top: 0,
  width: "100%",
  height: "100%",
};

const CustomDragLayer = () => {
  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    isDragging: monitor.isDragging(),
    // 使用 getClientOffset() 獲取滑鼠的即時座標
    currentOffset: monitor.getClientOffset(),
  }));

  if (!isDragging || !currentOffset) {
    return null;
  }

  // 計算位移，使預覽圖居中
  const x = currentOffset.x - (PREVIEW_WIDTH / 2);
  const y = currentOffset.y - (PREVIEW_HEIGHT / 2);

  // 應用計算後的座標
  const transform = `translate(${x}px, ${y}px)`;

  return (
    <div style={layerStyles}>
      <div style={{ transform, WebkitTransform: transform }}>
        <CustomPreview />
      </div>
    </div>
  );
};

// 3. 修改 DraggableBox，使其在拖拽時不隱藏
const DraggableBox = () => {
  const [{ isDragging }, dragRef, preview] = useDrag({
    type: "BOX",
    item: { id: "source-box" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // 使用 useEffect 來確保 preview(getEmptyImage()) 被調用以隱藏原生預覽
  React.useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  return (
    <div
      ref={dragRef}
      style={{
        width: "200px",
        height: "50px",
        // 拖拽時改變背景色以提供視覺反饋，但保持可見
        backgroundColor: isDragging ? "lightgreen" : "skyblue",
        textAlign: "center",
        lineHeight: "50px",
        cursor: "move",
        border: "1px solid black",
        boxSizing: 'border-box',
        // 不再設置 opacity: 0，所以原始元素會保持可見
      }}
    >
      Drag Me
    </div>
  );
};

// DropTargetArea 組件保持不變
const DropTargetArea = () => {
  const [positions, setPositions] = useState([]);
  const dropRef = React.useRef(null);

  const [{ isOver }, drop] = useDrop({
    accept: "BOX",
    drop: (item, monitor) => {
      if (!dropRef.current) return;
      const sourceOffset = monitor.getSourceClientOffset();
      if (!sourceOffset) return;
      const dropTargetRect = dropRef.current.getBoundingClientRect();
      const y = sourceOffset.y - dropTargetRect.top;
      const topGrid = Math.floor(y / GRID_SIZE) * GRID_SIZE;
      const bottomGrid = topGrid + GRID_SIZE;
      const overlapTop = Math.max(0, Math.min(y + 50, topGrid + GRID_SIZE) - Math.max(y, topGrid));
      const overlapBottom = Math.max(0, Math.min(y + 50, bottomGrid + GRID_SIZE) - Math.max(y, bottomGrid));
      const finalY = overlapTop > overlapBottom ? topGrid : bottomGrid;
      const boundedY = Math.max(0, Math.min(finalY, dropTargetRect.height - 50));
      setPositions((prev) => [...prev, { x: 0, y: boundedY }]);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drop(dropRef);

  const renderGrid = () => {
    const lines = [];
    for (let y = 0; y < 600; y += GRID_SIZE) {
      lines.push(
        <div key={y} style={{ position: "absolute", top: y, left: 0, width: "100%", height: "1px", backgroundColor: "lightgray" }} />
      );
    }
    return lines;
  };

  return (
    <div
      ref={dropRef}
      style={{
        position: "relative",
        width: "200px",
        height: "600px",
        border: "2px dashed gray",
        backgroundColor: isOver ? "lightyellow" : "white",
        marginTop: "20px",
        boxSizing: 'border-box',
      }}
    >
      {renderGrid()}
      {positions.map((pos, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            width: "200px",
            height: "50px",
            backgroundColor: "lightblue",
            left: pos.x,
            top: pos.y,
            border: "1px solid black",
            boxSizing: 'border-box',
          }}
        >
          Box
        </div>
      ))}
      {isOver && <p style={{ position: "absolute", bottom: 10, left: 10 }}>Drop Here</p>}
    </div>
  );
};


// 4. 在主組件中同時渲染 Drag Layer
const DragAndDropExample = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <DraggableBox />
        <DropTargetArea />
      </div>
      <CustomDragLayer />
    </DndProvider>
  );
};

export default DragAndDropExample;