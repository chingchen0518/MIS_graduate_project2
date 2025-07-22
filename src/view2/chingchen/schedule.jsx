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

      const dropTargetRect = dropRef.current.getBoundingClientRect();
      const x = sourceOffset.x - dropTargetRect.left;
      const y = sourceOffset.y - dropTargetRect.top;

      setAttractions((prevAttractions) => [
        ...prevAttractions,
        { name: item.id, time: null, position: { x, y } },
      ]);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drop(dropRef);

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
    <div ref={dropRef} className={`schedule ${isOver ? 'highlight' : ''}`} style={{ position: 'relative', height: containerHeight }}>
      <div className="schedule_header">
        <div className="user_avatar">
          <img src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png" alt="User" />
        </div>
        <div className="budget_display">$350</div>
        <span className="schedule_date">{title}</span>
      </div>
      
      <div className="schedule_timeline">
        {attractions && attractions.length > 0 ? (
          attractions.map((attraction, index) => (
            <div
              key={index}
              className="schedule_item"
              style={{
                position: 'absolute',
                left: `${attraction.position.x}px`,
                top: `${attraction.position.y}px`,
                width: '90%', // 調整寬度以適應 Schedule
                backgroundColor: '#f0f0f0', // 與 AttractionCard 顏色一致
                border: '1px solid black',
                borderRadius: '5px',
                padding: '10px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
              }}
            >
                <div className="attraction_name" style={{ fontWeight: 'bold', color: '#333' }}>
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
