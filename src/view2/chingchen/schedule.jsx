import React, { useState } from 'react';
import './schedule.css';

const Schedule = ({ title, attractions, day, isFirst, onAddSchedule, onDropAttraction }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragInsertIndex, setDragInsertIndex] = useState(-1);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    setIsDragOver(false);
    setDragInsertIndex(-1);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const attractionData = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (onDropAttraction) {
      onDropAttraction(attractionData, day, dragInsertIndex);
    }
    setDragInsertIndex(-1);
  };

  const handleDragOverItem = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const itemHeight = rect.height;
    
    // 如果拖拽點在上半部分，插入在當前位置前；下半部分插入在當前位置後
    if (y < itemHeight / 2) {
      setDragInsertIndex(index);
    } else {
      setDragInsertIndex(index + 1);
    }
  };

  const handleDragOverEmpty = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragInsertIndex(0);
  };

  if (isFirst) {
    // 第一欄顯示新增行程設計
    return (
      <div className="schedule add_schedule_column">
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
    <div 
      className={`schedule ${isDragOver ? 'drag_over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
            <React.Fragment key={index}>
              {dragInsertIndex === index && (
                <div className="drop_indicator">
                  <div className="drop_placeholder">
                    <span>放置在這裡</span>
                  </div>
                </div>
              )}
              <div 
                className="schedule_item"
                onDragOver={(e) => handleDragOverItem(e, index)}
              >
                <div className="schedule_attraction_block">
                  <div className="time_label">
                    {attraction.time || `${13 + index}:00`}
                  </div>
                  <div className="attraction_info">
                    <div className="attraction_name">{attraction.name}</div>
                    <div className="price_info">$500</div>
                  </div>
                </div>
                {index < attractions.length - 1 && (
                  <div className="connection_line"></div>
                )}
              </div>
              {dragInsertIndex === index + 1 && (
                <div className="drop_indicator">
                  <div className="drop_placeholder">
                    <span>放置在這裡</span>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))
        ) : (
          <div 
            className="schedule_empty"
            onDragOver={handleDragOverEmpty}
          >
            <span>拖拽景點到這裡</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;
