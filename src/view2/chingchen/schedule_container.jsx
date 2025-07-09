import React, { useState } from 'react';
import Schedule from './schedule.jsx';
import './schedule_container.css';

const Schedule_container = () => {
  const [schedules, setSchedules] = useState([
    { 
      id: 2, 
      title: '2025-01-02', 
      day: 2, 
      attractions: [
        { name: '兩晉豆花', time: '13:00' },
        { name: '孔子廟', time: '14:00' }
      ]
    },
    { id: 3, title: '2025-01-03', day: 3, attractions: [] },
    { id: 4, title: '2025-01-04', day: 4, attractions: [] },
    { id: 5, title: '2025-01-05', day: 5, attractions: [] }
  ]);

  const addSchedule = () => {
    const newSchedule = {
      id: schedules.length + 1,
      title: `2025-01-0${schedules.length + 1}`,
      day: schedules.length + 1,
      attractions: []
    };
    // 在 index 1 位置插入新的 schedule，其他 schedule 往右移
    const newSchedules = [...schedules];
    newSchedules.splice(1, 0, newSchedule);
    setSchedules(newSchedules);
  };

  const timeSlots = [
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
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
        {schedules.map((schedule, index) => (
          <Schedule
            key={schedule.id}
            title={schedule.title}
            day={schedule.day}
            attractions={schedule.attractions}
            isFirst={index === 0}
            onAddSchedule={addSchedule}
          />
        ))}
      </div>
    </div>
  );
};

export default Schedule_container;
