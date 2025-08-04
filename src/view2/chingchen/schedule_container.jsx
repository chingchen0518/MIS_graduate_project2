import React, { useState, useEffect, useRef } from 'react';
import Schedule from './schedule.jsx';
import './schedule_container.css';
import DateSelector from '../Liu/DateSelector';


const Schedule_container = ({ t_id,usedAttractions = [], onAttractionUsed }) => {
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
    
    let api = 'http://localhost:3001/api/view2_schedule_list';
    if (selectedDate) {
      api += `?date=${encodeURIComponent(selectedDate)}`;
      console.log('🔍 按日期載入 Schedule:', selectedDate);
    }
    
    fetch(api)
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

    // 創建一個臨時的草稿行程，不立即存到資料庫
    const tempScheduleId = `temp_${Date.now()}`; // 使用時間戳作為臨時ID
    const newTempSchedule = {
      id: tempScheduleId,
      title: `行程${schedules.length + 1}`,
      day: schedules.length + 1,
      date: selectedDate,
      attractions: [],
      isDraft: true // 標記為草稿狀態
    };

    console.log('✅ 創建草稿行程:', newTempSchedule);
    
    // 在前端添加草稿行程，不調用後端API
    setSchedules(prev => [newTempSchedule, ...prev]);
  };

  const handleAttractionUsed = (attractionName) => {
    if (onAttractionUsed) {
      onAttractionUsed(attractionName);
    }
  };

  // 處理行程確認的函數
  const handleScheduleConfirm = async (scheduleId, scheduleData) => {
    try {
      console.log('📝 確認行程:', scheduleId, scheduleData);
      
      // 構建要發送的數據
      const requestData = {
        title: scheduleData.title,
        day: scheduleData.day,
        date: scheduleData.date,
        attractions: scheduleData.attractions || []
      };
      
      console.log('📤 發送的數據:', requestData);
      
      // 發送到後端API創建正式的行程
      const response = await fetch('http://localhost:3001/api/view2_schedule_list_insert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('📥 響應狀態:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 行程保存成功:', data);
        
        // 更新前端狀態，將草稿行程替換為正式行程
        setSchedules(prev => prev.map(schedule => 
          schedule.id === scheduleId 
            ? {
                ...schedule,
                id: data.s_id || data.insertId,
                isDraft: false
              }
            : schedule
        ));
        
        alert('行程已成功保存！');
      } else {
        // 嘗試讀取錯誤訊息
        const errorData = await response.text();
        console.error('❌ 響應錯誤:', errorData);
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }
    } catch (error) {
      console.error('❌ 保存行程失敗:', error);
      alert(`保存失敗：${error.message}`);
    }
  };

  // 處理行程取消的函數
  const handleScheduleCancel = (scheduleId) => {
    console.log('🗑️ 取消行程:', scheduleId);
    // 從列表中移除草稿行程
    setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
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
          // key
          s_id="add-schedule"
          t_id={t_id} // 使用傳入這個page目前在哪一個trip的 t_id
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
              key={'schedule-' + schedule.id}
              s_id={schedule.id}
              t_id={t_id}
              title={schedule.title}
              day={schedule.day}
              scheduleId={schedule.id}
              scheduleData={schedule}
              attractions={schedule.attractions}
              isFirst={false}
              isDraft={schedule.isDraft}
              containerHeight={timeColumnHeight}
              usedAttractions={usedAttractions}
              onAttractionUsed={handleAttractionUsed}
              onScheduleConfirm={handleScheduleConfirm}
              onScheduleCancel={handleScheduleCancel}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Schedule_container;