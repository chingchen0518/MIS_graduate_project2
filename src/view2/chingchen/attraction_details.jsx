import React from 'react';
import './attraction_details.css';

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
      <div className="details_header">
        <h1 className="details_title">{attraction.name}</h1>
        <div className="details_meta">
          <span className="details_category" style={{backgroundColor: attraction.color}}>
            {attraction.category}
          </span>
          <span className="details_votes">👍 {attraction.votes} 票</span>
        </div>
      </div>
      
      <div className="details_content">
        <div className="details_section">
          <h3>景點介紹</h3>
          <p>這是 {attraction.name} 的詳細介紹。{attraction.name} 是一個{attraction.category}類型的景點，深受遊客喜愛。</p>
        </div>
        
        <div className="details_section">
          <h3>基本資訊</h3>
          <div className="info_grid">
            <div className="info_item">
              <span className="info_label">類型：</span>
              <span className="info_value">{attraction.category}</span>
            </div>
            <div className="info_item">
              <span className="info_label">人氣：</span>
              <span className="info_value">{attraction.votes} 票</span>
            </div>
            <div className="info_item">
              <span className="info_label">地點：</span>
              <span className="info_value">台灣</span>
            </div>
          </div>
        </div>
        
        <div className="details_section">
          <h3>特色</h3>
          <ul>
            <li>優美的自然環境</li>
            <li>豐富的文化內涵</li>
            <li>便利的交通設施</li>
            <li>完善的遊客服務</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AttractionDetails;