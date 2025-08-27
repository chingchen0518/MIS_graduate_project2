import React, { useState, useEffect } from 'react';
import './DateSelector.css';

const DateSelector = ({ t_id = 1, onDateChange }) => {
  const [tripDates, setTripDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

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
          }
        }
      } catch (error) {
        console.error('獲取日期失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTripDates();
  }, [t_id]);

  const handleDateSelect = (date, displayText) => {
    setSelectedDate(date);
    setIsOpen(false);
    
    if (onDateChange) {
      onDateChange(date);
    }
  };

  const toggleDropdown = () => {
    if (!loading) {
      setIsOpen(!isOpen);
    }
  };

  // 找到當前選中日期的顯示文字
  const selectedDisplayText = tripDates.find(d => d.date === selectedDate)?.displayText || '載入中...';

  return (
    <div className={`date-selector dropdown ${isOpen ? 'open' : ''}`} onClick={toggleDropdown}>
      {selectedDisplayText}
      <span className="caret">▾</span>
      
      {isOpen && !loading && (
        <div className="dropdown-menu">
          {tripDates.length > 0 ? (
            tripDates.map((dateObj) => (
              <div 
                key={dateObj.date} 
                className="dd-item" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDateSelect(dateObj.date, dateObj.displayText);
                }}
              >
                {dateObj.displayText}
              </div>
            ))
          ) : (
            <div className="dd-item">無可用日期</div>
          )}
        </div>
      )}
    </div>
  );
};

export default DateSelector;
