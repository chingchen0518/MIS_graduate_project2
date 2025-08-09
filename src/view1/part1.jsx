import React, { useState } from 'react';
import axios from 'axios';
import './part1.css';

import TravelGantt from './test.jsx';

const Part1 = ({ onNext }) => {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [message, setMessage] = useState('');
  const [tripName, setTripName] = useState('');

  const [ganttData, setGanttData] = useState({
    arrivalDate: "",
    departureDate: "",
    query: "",
    resultList: [],
    blocks: [],
  });

  const handleSubmit = async () => {
    console.log('旅程名稱:', tripName);

    const hotelNames = ganttData.blocks.map(b => b.name);

    try {
      const res = await axios.post('http://localhost:3001/api/a', {
        country: selectedCountry,
        title: tripName,
        arrivalDate:  ganttData.arrivalDate,
        departureDate: ganttData.departureDate,
        hotels:  [...new Set(ganttData.blocks.map(b => b.name))],
      });

      const { success, tripId } = res.data;
      if (!success) throw new Error('儲存失敗');

      onNext({ tripId, country: selectedCountry });

      console.log('✅ 即將送出:', { country: selectedCountry, title: tripName });
    }
    
    catch (error) {
      console.error('Error in API request:', error);
      setMessage('Error saving to database.');
    }
  };

  return (
    <div className="container">
      <h1>旅遊資料填寫</h1>

      {/* 旅程名稱 */}
      <div className="form-group">
        <label>旅程名稱：</label>
        <input
          type="text"
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
        />
      </div>

      {/* 國家選擇 */}
      <div className="form-group">
        <label>旅遊國家：</label>
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
        >
          <option value="">-- 請選擇 --</option>
          <option value="Taiwan">台灣</option>
          <option value="Switzerland">瑞士</option>
          <option value="Japan">日本</option>
        </select>
      </div>

      <TravelGantt onDataChange={setGanttData} />
      

      <button onClick={handleSubmit} className="next-btn">下一步</button>
      <p>{message}</p>
    </div>
  );
};

export default Part1;