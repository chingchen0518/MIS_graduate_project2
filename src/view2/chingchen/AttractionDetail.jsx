let HOST_URL = import.meta.env.VITE_API_URL;
let NGROK_URL = import.meta.env.VITE_NGROK_URL;
const PORT = import.meta.env.PORT || 3001;
let BASE_URL = NGROK_URL || `http://${HOST_URL}:${PORT}`;

import React from 'react';
// import './AttractionDetail.css';
import styles from './AttractionDetail.module.css';

const AttractionDetail = ({ attraction, onClose }) => {
  if (!attraction) {
    // return (
    //   <div className="attraction_details">
    //     <div className="no_selection">
    //       <p>請點擊左側的景點卡片來查看詳細資訊</p>
    //     </div>
    //   </div>
    // );
    return null; // 不顯示任何內容
  }

  return (
    <div className={styles.attraction_card_layout}>
      <button className={styles.close_button} onClick={onClose}>
        ×
      </button>
      <div className={styles.attraction_image}>
        <img src={`../../img/${attraction.photo}`} alt={attraction.name} />
      </div>
      <div className={styles.attraction_info}>
        <div className={styles.attraction_header}>
          <h2 className={styles.attraction_title}>{attraction.name}</h2>
          {/* <div className={styles.action_icon}>
            <span>📝</span>
          </div> */}
        </div>
        <div className={styles.week_schedule}>
          <div className={styles.week_days}>
            <span className={styles.day}>Su</span>
            <span className={styles.day}>Mo</span>
            <span className={`${styles.day} ${styles.active}`}>Tu</span>
            <span className={styles.day}>We</span>
            <span className={styles.day}>Th</span>
            <span className={styles.day}>Fr</span>
            <span className={styles.day}>Sa</span>
          </div>
        </div>
        <div className={styles.location_info}>
          <div className={styles.location}>
            <span className={styles.location_icon}>📍</span>
            <span className={styles.address}>{attraction.address || '地址未提供'}</span>
          </div>
          <div className={styles.hours}>
            <span className={styles.time_icon}>🕐</span>
            <span className={styles.time}>{attraction.hours || '營業時間未提供'}</span>
          </div>
          <div className={styles.phone}>
            <span className={styles.phone_icon}>📞</span>
            <span className={styles.number}>{attraction.phone || '電話未提供'}</span>
          </div>
          <div className={styles.category}>
            <span className={styles.category_icon}>🏷️</span>
            <span className={styles.category_text}>{attraction.category || '類別未分類'}</span>
          </div>
        </div>
        {/* <div className={styles.price_section}>
          <span className={styles.price_label}>預算：</span>
          <input 
            type="text" 
            className={styles.price_input} 
            placeholder={`$${attraction.budget || 0}`}
            defaultValue={`$${attraction.budget || 0}`}
          />
        </div> */}
      </div>
    </div>
  );
};

export default AttractionDetail;