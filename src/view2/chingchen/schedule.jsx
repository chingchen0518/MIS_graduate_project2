import React, { useState, useRef } from 'react';
import { useDrop, useDragLayer } from 'react-dnd';
import './schedule.css';
import AttractionCard from './attraction_card';

const Schedule = ({ title, initialAttractions, day, isFirst, onAddSchedule, containerHeight }) => {
  const [attractions, setAttractions] = useState(initialAttractions || []);
  const dropRef = useRef(null);

  const [{ isOver }, drop] = useDrop({
    accept: "card",
    drop: (item, monitor) => {
      if (!dropRef.current) {
        console.error("Drop target not found!");
        return;
      }

      const sourceOffset = monitor.getSourceClientOffset();
      if (!sourceOffset) {
        console.error("Source offset not found!");
        return;
      }

      const dropTargetRect = dropRef.current.querySelector('.schedule_timeline').getBoundingClientRect();
      const x = sourceOffset.x - dropTargetRect.left;
      const y = sourceOffset.y - dropTargetRect.top;

      console.log('sourceOffset.y:', sourceOffset.y);
      console.log('dropTargetRect.top', dropTargetRect.top);

      // 修正坐标计算，确保不受页面缩放或样式影响
      const correctedX = Math.max(0, Math.min(x, dropTargetRect.width));
      const correctedY = Math.max(0, Math.min(y, dropTargetRect.height));

      setAttractions((prevAttractions) => [
        ...prevAttractions,
        {
          name: item.id,
          time: null,
          position: { x: correctedX, y: correctedY },
          width: dropTargetRect.width, // Schedule item width based on container width
        },
      ]);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drop(dropRef);

  const renderGrid = () => {
    const timeColumn = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00',
                        '08:00', '09:00', '10:00', '11:00', '12:00','13:00', '14:00', '15:00', 
                       '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00','23:59'
                     ];
    const lines = [];
    const intervalHeight = containerHeight / 25; // 調整為空間/25

    timeColumn.forEach((time, index) => {
      lines.push(
        <div key={index} style={{ position: "absolute", top: index * intervalHeight, left: 0, width: "100%", height: "1px", backgroundColor: "lightgray" }} />
      );
    });

    return lines;
  };

  if (isFirst) {
    return (
      <div className="schedule add_schedule_column" style={{ height: containerHeight }}>
        <div className="add_schedule_content">
          <div className="add_schedule_icon" onClick={onAddSchedule}>
            <div className="plus_icon">+</div>
          </div>
          <div className="add_schedule_text">新增行程</div>
          <button className="skip_btn">跳過</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={dropRef} className={`schedule ${isOver ? 'highlight' : ''}`} style={{ position: 'relative', height: containerHeight, overflow: 'hidden', maxHeight: containerHeight, overflowY: 'hidden', overflowX: 'hidden' }}>
      <div className="schedule_header">
        <div className="user_avatar">
          <img src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png" alt="User" />
        </div>
        <div className="budget_display">$350</div>
        <span className="schedule_date">{title}</span>
      </div>
      
      <div className="schedule_timeline" style={{ position: 'relative', overflow: 'hidden', maxHeight: containerHeight }}>
        {renderGrid()}
        {attractions && attractions.length > 0 ? (
          attractions.map((attraction, index) => (
            <div
              key={index}
              className="schedule_item"
              style={{
                position: 'absolute',
                left: `${attraction.position.x}px`,
                top: `${attraction.position.y}px`,
                width: `${attraction.width}px`, // Dynamic width
                backgroundColor: '#f0f0f0',
                border: '1px solid black',
                borderRadius: '5px',
                padding: '10px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div
                className="attraction_name"
                style={{
                  fontWeight: 'bold',
                  color: '#333',
                  fontSize: `${Math.min(16, attraction.width / 10)}px`, // Adjust font size dynamically
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {attraction.name}
              </div>
            </div>
          ))
        ) : (
          <div className="schedule_empty">
            <span>暫無行程安排</span>
          </div>
        )}
      </div>
    </div>
  );
};

const CustomDragPreview = () => {
  const { item, currentOffset, isDragging } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    currentOffset: monitor.getClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  const scheduleRef = document.querySelector('.schedule');
  const scheduleWidth = scheduleRef ? scheduleRef.offsetWidth : 0;

  if (!isDragging || !currentOffset || scheduleWidth === 0) {
    return null;
  }

  // const { x, y } = currentOffset;
  const x = currentOffset.x - (scheduleWidth / 2);
  const y = currentOffset.y;

  return (
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        transform: `translate(${x}px, ${y}px)`,
        // left: `${x - scheduleWidth * 0.45}px`, // 調整 x 坐標，讓鼠標位於預覽圖中心
        // top: `${y - 50}px`, // 調整 y 坐標，讓鼠標位於預覽圖中心
        width: `${scheduleWidth * 0.9}px`, // 基於 schedule 的寬度
        backgroundColor: '#f0f0f0',
        border: '1px solid black',
        borderRadius: '5px',
        padding: '10px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
        zIndex: 100,
      }}
    >
      <div className="attraction_name" style={{ fontWeight: 'bold', color: '#333' }}>
        {item?.id}
      </div>
    </div>
  );
};

export default Schedule;

export { CustomDragPreview };