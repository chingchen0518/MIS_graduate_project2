import React from 'react';
import Attraction_container from '../chingchen/attraction_container.jsx';
import Schedule_container from '../chingchen/schedule_container.jsx';
import './page1.css';

const Page1 = () => {
  return (
    <div className="page1">
      <div className="page1_content">
        <Attraction_container />
        <Schedule_container />
      </div>
    </div>
  );
};

export default Page1;
