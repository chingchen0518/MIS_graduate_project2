import React, { useState, useEffect, useRef } from 'react';
import Schedule from './schedule.jsx';
import './schedule_container.css';
import DateSelector from '../Liu/DateSelector';


const Schedule_container = ({ usedAttractions = [], onAttractionUsed }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  const timeColumnRef = useRef(null);
  const [timeColumnHeight, setTimeColumnHeight] = useState(0);

  // 處理日期選擇變更
  const handleDateChange = (date) => {
    setSelectedDate(date);
    console.log('選擇的日期:', date);
    // 這裡可以根據選擇的日期來篩選或更新行程資料
  };

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

  useEffect(() => {
    // 從 API 獲取行程數據，如果有選擇日期則按日期過濾
    setLoading(true);
    
    let url = 'http://localhost:3001/api/view2_schedule_list';
    if (selectedDate) {
      url += `?date=${encodeURIComponent(selectedDate)}`;
      console.log('🔍 按日期載入 Schedule:', selectedDate);
    }
    
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data) {
          // 格式化後端返回的數據
          const formattedSchedules = data.map(schedule => ({
            id: schedule.s_id,
            title: schedule.title || `行程${schedule.s_id}`,
            day: schedule.day || schedule.s_id,
            date: schedule.date,
            attractions: schedule.attractions || []
          }));
          // 倒序排列，讓最新的行程在最前面（最左邊）
          formattedSchedules.reverse();
          setSchedules(formattedSchedules);
          console.log('✅ 載入的 Schedule 數量:', formattedSchedules.length);
        }
      })
      .catch(error => {
        console.error('Error fetching schedules:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedDate]); // 當 selectedDate 變更時重新載入

  const addSchedule = () => {
    // 檢查是否有選擇日期
    if (!selectedDate) {
      alert('請先選擇日期');
      return;
    }

    // 取得最大 ID + 1 作為新行程的 ID
    const newId = schedules.length > 0 
      ? Math.max(...schedules.map(s => s.id)) + 1 
      : 1;
    
    const newSchedule = {
      id: newId,
      title: `行程${newId}`,
      day: newId,
      date: selectedDate,
      attractions: []
    };

    // 使用 GET 方法調用 API，包含選擇的日期
    console.log('正在發送新行程數據，使用 GET 方法');
    console.log('選擇的日期:', selectedDate);
    
    // 添加參數到 URL，包含日期
    const url = `http://localhost:3001/api/view2_schedule_list_insert?title=${encodeURIComponent(newSchedule.title)}&day=${encodeURIComponent(newSchedule.day)}&date=${encodeURIComponent(selectedDate)}`;
    
    console.log('請求 URL:', url);
    
    // 發送 GET 請求
    fetch(url)
      .then(response => {
        console.log('收到伺服器響應:', response.status, response.statusText);
        if (!response.ok) {
          throw new Error(`伺服器響應錯誤: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('解析的JSON數據:', data);
        console.log('完整的 data 對象:', JSON.stringify(data, null, 2));
        
        // 檢查不同的響應格式
        let scheduleId = null;
        if (data.s_id) {
          // Sequelize 格式
          scheduleId = data.s_id;
          console.log('✅ 使用 Sequelize 格式, s_id:', scheduleId);
        } else if (data.insertId) {
          // MySQL 原生格式
          scheduleId = data.insertId;
          console.log('✅ 使用 MySQL 原生格式, insertId:', scheduleId);
        }
        
        // 如果後端返回了新創建的行程，使用後端返回的數據
        if (scheduleId) {
          const createdSchedule = {
            id: scheduleId,
            title: data.title || `行程${scheduleId}`,
            day: data.day || scheduleId,
            date: data.date || selectedDate,
            attractions: []
          };
          console.log('✅ 使用後端返回的數據創建行程:', createdSchedule);
          // 在當前行程列表的最前面添加新的行程（而不是末尾）
          setSchedules(prev => [createdSchedule, ...prev]);
        } else {
          console.log('❌ 後端沒有返回有效的ID，使用前端生成的數據');
          console.log('❌ 檢查: data:', data);
          // 如果後端沒有返回數據，使用前端創建的數據，同樣添加到最前面
          const scheduleWithDate = { ...newSchedule, date: selectedDate };
          setSchedules(prev => [scheduleWithDate, ...prev]);
        }
      })
      .catch(error => {
        console.error('創建新行程失敗:', error.message);
        // 即使 API 調用失敗，也更新 UI，添加到最前面，包含日期
        const scheduleWithDate = { ...newSchedule, date: selectedDate };
        setSchedules(prev => [scheduleWithDate, ...prev]);
      });
  };

  const handleAttractionUsed = (attractionName) => {
    if (onAttractionUsed) {
      onAttractionUsed(attractionName);
    }
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
        <div className="date-selector-wrapper">
          <DateSelector 
            tripId={1} 
            onDateChange={handleDateChange}
          />
        </div>
      </div>
      <div className="schedule_list">
        <div className="time_column" ref={timeColumnRef}>
          {timeSlots.map((time) => (
            <div key={time} className="time_slot">
              {time}
            </div>
          ))}
        </div>
        
        {/* 添加行程按鈕永遠顯示在最前面 */}
        <Schedule
          key="add-schedule"
          isFirst={true}
          onAddSchedule={addSchedule}
          containerHeight={timeColumnHeight}
        />
        
        {loading ? (
          <div className="loading-message">載入中...</div>
        ) : schedules.length === 0 ? (
          <div className="empty-message">
            <p>沒有找到行程</p>
          </div>
        ) : (
          schedules.map((schedule) => (
            <Schedule
              key={schedule.id}
              title={schedule.title}
              day={schedule.day}
              attractions={schedule.attractions}
              isFirst={false}
              containerHeight={timeColumnHeight} // 傳遞高度
              usedAttractions={usedAttractions}
              onAttractionUsed={handleAttractionUsed}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Schedule_container;