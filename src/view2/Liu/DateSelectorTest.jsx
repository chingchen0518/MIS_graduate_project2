import React, { useState } from 'react';
import DateSelector from './DateSelector';

const DateSelectorTest = () => {
  const [selectedDate, setSelectedDate] = useState('');

  const handleDateChange = (date) => {
    setSelectedDate(date);
    console.log('選擇的日期:', date);
  };

  return (
    <div>   
      <div>
        <DateSelector 
          tripId={1} 
          onDateChange={handleDateChange}
        />
      </div>

    </div>
  );
};

export default DateSelectorTest;
