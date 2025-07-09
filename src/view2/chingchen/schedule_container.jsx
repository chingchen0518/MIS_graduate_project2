import React, { useState } from 'react';
import Schedule from './schedule.jsx';
import './schedule_container.css';

const Schedule_container = () => {
  const [schedules, setSchedules] = useState([
    { id: 1, title: '2025-01-01', day: 1, attractions: [] },
    { id: 2, title: '2025-01-02', day: 2, attractions: [] },
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
    setSchedules([...schedules, newSchedule]);
  };

  return (
    <div className="schedule_container">
      <div className="schedule_container_header">
        <h2 className="schedule_container_title">旅遊行程</h2>
        <button className="add_schedule_btn" onClick={addSchedule}>
          新增天數
        </button>
      </div>
      <div className="schedule_list">
        {schedules.map((schedule) => (
          <Schedule
            key={schedule.id}
            title={schedule.title}
            day={schedule.day}
            attractions={schedule.attractions}
          />
        ))}
      </div>
    </div>
  );
};

export default Schedule_container;
