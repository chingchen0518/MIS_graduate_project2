import React from 'react';
import './schedule.css';

const Schedule = ({ title, attractions, day }) => {
  return (
    <div className="schedule">
      <div className="schedule_header">
        <h3 className="schedule_title">Day {day}</h3>
        <span className="schedule_date">{title}</span>
      </div>
      <div className="schedule_content">
        {attractions && attractions.length > 0 ? (
          attractions.map((attraction, index) => (
            <div key={index} className="schedule_item">
              <div className="schedule_time">{attraction.time}</div>
              <div className="schedule_attraction_name">{attraction.name}</div>
            </div>
          ))
        ) : (
          <div className="schedule_empty">
            <span>拖拽景點到這裡</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;
