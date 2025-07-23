import React, { useState, useEffect, useRef } from 'react';
import Schedule from './schedule.jsx';
import './schedule_container.css';

const Schedule_container = () => {
  const [schedules, setSchedules] = useState([
    { 
      id: 1, 
      title: '行程3', 
      day: 1, 
      attractions: [
        { name: '兩晉豆花', time: '13:00' },
        { name: '孔子廟', time: '14:00' }
      ]
    },
    { id: 2, title: '行程2', day: 2, attractions: [] },
    { id: 3, title: '行程1', day: 3, attractions: [] }
  ]);

  const timeColumnRef = useRef(null);
  const [timeColumnHeight, setTimeColumnHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      if (timeColumnRef.current) {
        setTimeColumnHeight(timeColumnRef.current.scrollHeight);
      }
    };

    updateHeight();

    // Optional: Add a resize observer to handle dynamic changes
    const resizeObserver = new ResizeObserver(updateHeight);
    if (timeColumnRef.current) {
      resizeObserver.observe(timeColumnRef.current);
    }

    return () => {
      if (timeColumnRef.current) {
        resizeObserver.unobserve(timeColumnRef.current);
      }
    };
  }, []);

  const addSchedule = () => {
    const newScheduleNumber = schedules.length + 1;
    const newSchedule = {
      id: schedules.length + 1,
      title: `行程${newScheduleNumber}`,
      day: schedules.length + 1,
      attractions: []
    };
    const newSchedules = [...schedules];
    newSchedules.splice(1, 0, newSchedule);
    setSchedules(newSchedules);
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
        <div className="time_column" ref={timeColumnRef}>
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
            containerHeight={timeColumnHeight} // 傳遞高度
          />
        ))}
      </div>
    </div>
  );
};

export default Schedule_container;