import React from 'react';
import './attraction_details_new.css';

const AttractionDetails = ({ attraction }) => {
  if (!attraction) {
    return (
      <div className="attraction_details">
        <div className="no_selection">
          <p>請點擊左側的景點卡片來查看詳細資訊</p>
        </div>
      </div>
    );
  }

  return (
    <div className="attraction_details">
      <div className="attraction_card_layout">
        <div className="attraction_image">
          <img src="https://via.placeholder.com/80x60/4A90E2/white?text=IMG" alt={attraction.name} />
        </div>
        
        <div className="attraction_info">
          <div className="attraction_header">
            <h2 className="attraction_title">{attraction.name}</h2>
            <div className="action_icon">
              <span>📝</span>
            </div>
          </div>
          
          <div className="week_schedule">
            <div className="week_days">
              <span className="day">Su</span>
              <span className="day">Mo</span>
              <span className="day active">Tu</span>
              <span className="day">We</span>
              <span className="day">Th</span>
              <span className="day">Fr</span>
              <span className="day">Sa</span>
            </div>
          </div>
          
          <div className="location_info">
            <div className="location">
              <span className="location_icon">📍</span>
              <span className="address">700台南市中西區大同街35號</span>
            </div>
            <div className="hours">
              <span className="time_icon">🕐</span>
              <span className="time">Monday: 12 - 2 AM, 8 - 2 AM</span>
            </div>
            <div className="phone">
              <span className="phone_icon">📞</span>
              <span className="number">06 222 2327</span>
            </div>
          </div>
          
          <div className="price_section">
            <span className="price_label">預算：</span>
            <input 
              type="text" 
              className="price_input" 
              placeholder="$50" 
              defaultValue="$50"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttractionDetails;