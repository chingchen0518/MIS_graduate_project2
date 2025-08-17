import React, { useState, useEffect } from 'react';
import './DateSelector.css';

const DateSelector = ({ t_id = 1, onDateChange }) => {
  const [tripDates, setTripDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTripDates = async () => {
      try {
        console.log('🔍 獲取日期資料 for t_id:', t_id);
        const response = await fetch(`http://localhost:3001/api/trip-dates/${t_id}`);

        if (response.ok) {
          const data = await response.json();
          console.log('📅 獲取到的日期資料:', data);

          if (data && data.dates && data.dates.length > 0) {
            setTripDates(data.dates);
            setSelectedDate(data.dates[0].date);
            console.log('✅ 設定預設日期:', data.dates[0].date);

            if (onDateChange) {
              onDateChange(data.dates[0].date);
            }
          } else {
            console.warn('⚠️ 沒有獲取到日期資料');
          }
        } else {
          console.error('❌ API 回應錯誤:', response.status);
        }
      } catch (error) {
        console.error('❌ 獲取日期失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTripDates();
  }, [t_id]);

  const handleDateChange = (event) => {
    const newDate = event.target.value;
    console.log('📅 使用者選擇日期:', newDate);
    setSelectedDate(newDate);

    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  return (
    <select
      value={selectedDate}
      onChange={handleDateChange}
      className="date-selector"
      disabled={loading}
    >
      {loading ? (
        <option>載入中...</option>
      ) : tripDates.length > 0 ? (
        tripDates.map((dateObj) => (
          <option key={dateObj.date} value={dateObj.date}>
            {dateObj.displayText}
          </option>
        ))
      ) : (
        <option value="">無可用日期</option>
      )}
    </select>
  );
};

export default DateSelector;
