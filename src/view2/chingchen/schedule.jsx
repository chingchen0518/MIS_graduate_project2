import React from 'react';
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
          <img src="https://scontent.frmq3-4.fna.fbcdn.net/v/t39.30808-1/474327915_9354231394597607_1936184203033497631_n.jpg?stp=cp6_dst-jpg_s160x160_tt6&_nc_cat=106&ccb=1-7&_nc_sid=e99d92&_nc_ohc=wTpMP8CQg40Q7kNvwE6TJgz&_nc_oc=AdlbSVhbceLl9mBSaUWXZ54i8JJGAqXXSmKhOWr14ZkdS0sJ4lAT_W0rlACnrjuj3UwDyGMH_62jID7GSrk1xJKd&_nc_zt=24&_nc_ht=scontent.frmq3-4.fna&_nc_gid=5JFfnptAxH2mhkSfWQYh0A&oh=00_AfSrkad_W4skcf8wraIeIdvR7NmPZHUtnw0vhs8NpVRGoA&oe=687472F6" alt="User" />
        </div>
        <div className="budget_display">$350</div>
        <span className="schedule_date">{title}</span>
      </div>
      
      <div className="schedule_timeline">
        {attractions && attractions.length > 0 ? (
          attractions.map((attraction, index) => (
            <div key={index} className="schedule_item">
              <div className="attraction_card">
                <div className="attraction_name">{attraction.name}</div>
              </div>
              {index < attractions.length - 1 && (
                <div className="connection_line"></div>
              )}
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
