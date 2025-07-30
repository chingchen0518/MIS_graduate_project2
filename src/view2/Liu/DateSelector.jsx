import React, { useState, useEffect } from 'react';
import './DateSelector.css';

const DateSelector = ({ tripId = 1, onDateChange }) => {
  const [tripDates, setTripDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTripDates = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/trip-dates/${tripId}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.dates && data.dates.length > 0) {
            setTripDates(data.dates);
            setSelectedDate(data.dates[0].date);
            
            if (onDateChange) {
              onDateChange(data.dates[0].date);
            }
          }
        }
      } catch (error) {
        console.error('獲取日期失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTripDates();
  }, [tripId]);

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
      ) : (
        tripDates.map((dateObj) => (
          <option key={dateObj.date} value={dateObj.date}>
            {dateObj.displayText}
          </option>
        ))
      )}
    </select>
  );
};

export default DateSelector;
