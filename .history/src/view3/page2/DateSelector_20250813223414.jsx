import React, { useState, useEffect } from 'react';
import './DateSelector.css';

const DateSelector = ({ t_id = 1, onDateChange }) => {
  const [tripDates, setTripDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTripDates = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/trip-dates/${t_id}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.dates && data.dates.length > 0) {
            setTripDates(data.dates);
            setSelectedDate(data.dates[0].date);
            
            if (onDateChange) {
              onDateChange(data.dates[0].date);
            }
          } else {
            // 如果沒有數據，設置預設日期
            const defaultDates = [
              { date: '2025-08-05', displayText: '08/05' }
            ];
            setTripDates(defaultDates);
            setSelectedDate('2025-08-05');
            
            if (onDateChange) {
              onDateChange('2025-08-05');
            }
          }
        } else {
          // API 調用失敗，設置預設日期
          const defaultDates = [
            { date: '2025-08-05', displayText: '08/05' }
          ];
          setTripDates(defaultDates);
          setSelectedDate('2025-08-05');
          
          if (onDateChange) {
            onDateChange('2025-08-05');
          }
        }
      } catch (error) {
        console.error('獲取日期失敗:', error);
        // 錯誤時也設置預設日期
        const defaultDates = [
          { date: '2025-08-05', displayText: '08/05' }
        ];
        setTripDates(defaultDates);
        setSelectedDate('2025-08-05');
        
        if (onDateChange) {
          onDateChange('2025-08-05');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTripDates();
  }, [t_id]);

  const handleDateChange = (event) => {
    const newDate = event.target.value;
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
