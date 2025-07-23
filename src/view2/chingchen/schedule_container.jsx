import React, { useState } from 'react';
import Schedule from './schedule.jsx';
import './schedule_container.css';

const Schedule_container = () => {
  const [schedules, setSchedules] = useState([]);

  const addSchedule = () => {
    const newScheduleNumber = schedules.length + 1;
    const newSchedule = {
      id: Date.now(), // 使用時間戳作為唯一ID
      title: `行程${newScheduleNumber}`,
      day: newScheduleNumber,
      attractions: []
    };
<<<<<<< Updated upstream
    // 在 index 1 位置插入新的 schedule，其他 schedule 往右移
    const newSchedules = [...schedules];
    newSchedules.splice(1, 0, newSchedule);
    setSchedules(newSchedules);
=======
    // 加到陣列最前面，讓新行程出現在最左邊
    setSchedules([newSchedule, ...schedules]);
>>>>>>> Stashed changes
  };

  const timeSlots = [
    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00',
    '08:00', '09:00', '10:00', '11:00', '12:00','13:00', '14:00', '15:00', 
    '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00','23:59'

  ];

  return (
    <div className="schedule_container">
      <div className="schedule_container_header">
        <h2 className="schedule_container_title">旅遊行程</h2>
      </div>
      <div className="schedule_list">
        <div className="time_column">
          {timeSlots.map((time) => (
            <div key={time} className="time_slot">
              {time}
            </div>
          ))}
        </div>
        
        {/* 獨立的新增行程按鈕 */}
        <div className="add_schedule_column" style={{ height: timeColumnHeight }}>
          <div className="add_schedule_header">
            {/* 空的header區域，與行程欄高度一致 */}
          </div>
          <div className="add_schedule_content">
            <button className="add_schedule_button" onClick={addSchedule}>
              <span className="add_icon">+</span>
            </button>
            <span className="add_text">新增行程</span>
            <button className="skip_button">跳過</button>
          </div>
        </div>
        
        {schedules.map((schedule, index) => (
          <Schedule
            key={schedule.id}
            title={schedule.title}
            day={schedule.day}
            attractions={schedule.attractions}
            isFirst={false}
            onAddSchedule={addSchedule}
<<<<<<< Updated upstream
=======
            containerHeight={timeColumnHeight}
>>>>>>> Stashed changes
          />
        ))}
      </div>
    </div>
  );
};

export default Schedule_container;
