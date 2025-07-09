import React from 'react';
import Attraction_container from '../chingchen/attraction_container.jsx';
import Schedule_container from '../chingchen/schedule_container.jsx';
import './page1.css';

const Page1 = () => {
  return (
    <div className="page1">
      {/* <div className="page1_header">
        <h1 className="page1_title">旅遊規劃系統</h1>
        <p className="page1_subtitle">選擇你喜愛的景點，規劃完美的旅程</p>
      </div> */}
      <div className="page1_content">
        <Schedule_container />
        <Attraction_container />
      </div>
    </div>
  );
};

export default Page1;
