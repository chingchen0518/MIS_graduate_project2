import React, { useState } from 'react';
import './schedule.css';

const Schedule = ({ title, attractions, day, isFirst, onAddSchedule }) => {
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
    <div className="schedule">
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
            <div key={index} className="schedule_item">
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

export default Schedule;
