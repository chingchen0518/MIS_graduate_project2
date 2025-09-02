import React from 'react';
import './AttractionDetail.css';

const AttractionDetail = ({ attraction, onClose }) => {
  // 如果沒有景點資料，顯示提示框
  if (!attraction) {
    return (
      <div className="attraction_card_layout attraction_placeholder">
        <div className="attraction_placeholder_content">
          <h3 className="placeholder_title">Attraction Details</h3>
          <p className="placeholder_text">
            Please click on an attraction from the schedule or filter section on the right to view details here.
          </p>
          <div className="placeholder_arrow">→</div>
        </div>
      </div>
    );
  }

  return (
    <div className="attraction_card_layout">
      <button className="close_button" onClick={onClose}>
        ×
      </button>

      <div className="attraction_image">
        <img src={`../../img/${attraction.photo}`} alt={attraction.name} />
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
            <span className="address">{attraction.address || '地址未提供'}</span>
          </div>
          <div className="hours">
            <span className="time_icon">🕐</span>
            <span className="time">{attraction.hours || '營業時間未提供'}</span>
          </div>
          <div className="phone">
            <span className="phone_icon">📞</span>
            <span className="number">{attraction.phone || '電話未提供'}</span>
          </div>
          <div className="category">
            <span className="category_icon">🏷️</span>
            <span className="category_text">{attraction.category || '類別未分類'}</span>
          </div>
        </div>

        <div className="price_section">
          <span className="price_label">預算：</span>
          <input
            type="text"
            className="price_input"
            placeholder={`$${attraction.budget || 0}`}
            defaultValue={`$${attraction.budget || 0}`}
          />
        </div>
      </div>
    </div>
  );
};

export default AttractionDetail;