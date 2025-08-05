import React from 'react';
import { useDrag } from 'react-dnd';

// ScheduleItem 組件：顯示在行程時間軸上的單個景點項目
const ScheduleItem = ({ name, position, width, index, s_id, onMove }) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: "schedule_item",
    item: { 
      name, 
      index, 
      s_id,
      originalPosition: position 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={dragRef}
      className="schedule_item"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '180px', // 調整寬度 - 您可以改成您想要的大小
        minWidth: '100px',
        maxWidth: '100px',
        height: '35px', // 調整高度 - 您可以改成您想要的大小
        backgroundColor: '#f0f0f0',
        border: '1px solid black',
        borderRadius: '5px',
        padding: '10px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        className="attraction_name"
        style={{
          fontWeight: 'bold',
          color: '#333',
          fontSize: '14px', // 固定字體大小
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
          textAlign: 'center'
        }}
      >
        {name}
      </div>
    </div>
  );
};

export default ScheduleItem;
