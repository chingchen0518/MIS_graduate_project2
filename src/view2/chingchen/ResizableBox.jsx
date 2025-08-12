import React from "react";
import { Rnd } from "react-rnd";

const ResizableExample = ({
  position = { x: 0, y: 0 },
  editable = false,
  heightEdit = 100,
  height = 100,
  isDragging = false,
  name = '',
}) => (
  // 假設以下 props 由父層傳入
  // editable, dragRef, position, heightEdit, height, isDragging, name
  <Rnd
    default={{
      x: 100,
      y: 100,
      width: 180,
      height: 100,
    }}
    position={{ x: position?.x || 0, y: position?.y || 0 }}
    size={{ width: 180, height: editable ? heightEdit : height }}
    disableDragging={!editable}

    minWidth={100}
    maxWidth={180}
    minHeight={50}
    enableResizing={{
      top: true,
      bottom: true,
      right: false,
      left: false,
      topRight: false,
      bottomRight: false,
      bottomLeft: false,
      topLeft: false,
    }}
    resizeHandleStyles={{
      top: {
        height: '10px',
        background: '#fff',
        borderRadius: '5px',
        cursor: 'ns-resize',
      },
      bottom: {
        height: '10px',
        background: '#fff',
        borderRadius: '5px',
        cursor: 'ns-resize',
      },
    }}
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: '180px',
      minWidth: '100px',
      maxWidth: '180px',
      height: editable ? `${heightEdit}px` : `${height}px`,
      backgroundColor: '#f0f0f0',
      border: '1px solid black',
      borderRadius: '5px',
      padding: '10px',
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
      opacity: isDragging ? 0.5 : 1,
      cursor: editable ? 'move' : 'default',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
    bounds="parent"
    onDragStop={(e, d) => {
      // d.x, d.y 為新座標
    }}
    onResizeStop={(e, direction, ref, delta, position) => {
      // ref.style.width, ref.style.height 為新尺寸
      // position.x, position.y 為新座標
    }}
    dragHandleClassName="custom-drag-handle"
    resizeHandleClasses={{
      top: "custom-resize-top",
      bottom: "custom-resize-bottom"
    }}
    onMouseEnter={() => {/* 滑鼠進入 */}}
    onMouseLeave={() => {/* 滑鼠離開 */}}
  >
    <div
      className="attraction_name"
      style={{
        fontWeight: 'bold',
        color: '#333',
        fontSize: '14px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%',
        textAlign: 'center',
      }}
    >
      {name}
    </div>
  </Rnd>
);

export default ResizableExample;