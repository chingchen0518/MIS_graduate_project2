import React, { useState, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import Schedule from './schedule.jsx';
import ScheduleNew from './scheduleNew.jsx';    
import ScheduleInsert from './ScheduleInsert.jsx';
import ScheduleShow from './ScheduleShow.jsx';
import './schedule_container.css';
import DateSelector from '../Liu/DateSelector';

const Schedule_container = ({ t_id,usedAttractions = [], onAttractionUsed }) => {
    //State
    const [schedules, setSchedules] = useState([]); //儲存DB讀取的schedule
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(''); // 儲存目前選擇的Date
    const [timeColumnHeight, setTimeColumnHeight] = useState(0); // 儲存時間欄的高度
    const [showScheduleInsert, setShowScheduleInsert] = useState(false);

    const timeColumnRef = useRef(null);

    // function 1：處理日期選擇變更
    const handleDateChange = (date) => {
        setSelectedDate(date);
        console.log('選擇的日期:', date);
        // 這裡可以根據選擇的日期來篩選或更新行程資料
    };

    // function 2：設置是否顯示 ScheduleInsert
    function handleShowScheduleInsert(show=false) {
        setShowScheduleInsert(show);
    }

    //【useEffect 1】計算timeColumn的高度+更新到State
    useEffect(() => {
        const updateTimeColumnHeight = () => {
            if (timeColumnRef.current) {
                setTimeColumnHeight(timeColumnRef.current.scrollHeight);
            }
        };

        updateTimeColumnHeight();

        // Optional: Add a resize observer to handle dynamic changes
        const resizeObserver = new ResizeObserver(updateTimeColumnHeight);
        if (timeColumnRef.current) {
        resizeObserver.observe(timeColumnRef.current);
        }

        return () => {
            if (timeColumnRef.current) {
                resizeObserver.unobserve(timeColumnRef.current);
            }
        };
    }, []);

    //【useEffect 2】從 API 獲取行程(如有日期則按日期過濾)
    useEffect(() => {
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
            
            // **關鍵修正**: 只將草稿行程中的景點標記為已使用，已確認的行程中的景點不標記為已使用
            if (onAttractionUsed) {
                const draftAttractions = new Set();
                formattedSchedules.forEach(schedule => {
                    // 只處理草稿行程中的景點
                    if (schedule.isDraft && schedule.attractions && schedule.attractions.length > 0) {
                        schedule.attractions.forEach(attraction => {
                            draftAttractions.add(attraction.name);
                        });
                    }
                });
                
                // 將草稿行程中的景點標記為已使用
                draftAttractions.forEach(attractionName => {
                onAttractionUsed(attractionName, true);
                });
                
                console.log('🔄 同步草稿行程的景點狀態:', [...draftAttractions]);
            }
            }
        })
        .catch(error => {
            console.error('Error fetching schedules:', error);
        })
        .finally(() => {
            setLoading(false);
        });
  }, [selectedDate]); // 當 selectedDate 變更時重新載入

  //【useEffect 3】從 API 獲取行程(如有日期則按日期過濾)

//   const addSchedule = () => {
//     // 檢查是否有選擇日期
//     if (!selectedDate) {
//       alert('請先選擇日期');
//       return;
//     }

//     // 創建一個臨時的草稿行程，不立即存到資料庫
//     const tempScheduleId = `temp_${Date.now()}`; // 使用時間戳作為臨時ID
//     const newTempSchedule = {
//       id: tempScheduleId,
//       title: `行程${schedules.length + 1}`,
//       day: schedules.length + 1,
//       date: selectedDate,
//       attractions: [],
//       isDraft: true // 標記為草稿狀態
//     };

//     console.log('✅ 創建草稿行程:', newTempSchedule);
    
//     // 在前端添加草稿行程，不調用後端API
//     setSchedules(prev => [newTempSchedule, ...prev]);
//   };

//   const handleAttractionUsed = (attractionName, isUsed = true) => {
//     if (onAttractionUsed) {
//       onAttractionUsed(attractionName, isUsed);
//     }
//   };

  // 處理行程確認的函數
//   const handleScheduleConfirm = async (scheduleId, scheduleData) => {
//     try {
//       console.log('📝 確認行程:', scheduleId, scheduleData);
      
//       // 構建要發送的數據
//       const requestData = {
//         title: scheduleData.title,
//         day: scheduleData.day,
//         date: scheduleData.date,
//         attractions: scheduleData.attractions || []
//       };
      
//       console.log('📤 發送的數據:', requestData);
      
//       // 發送到後端API創建正式的行程
//     //   const response = await fetch('http://localhost:3001/api/view2_schedule_list_insert', {
//     //     method: 'POST',
//     //     headers: {
//     //       'Content-Type': 'application/json',
//     //     },
//     //     body: JSON.stringify(requestData)
//     //   });

//       console.log('📥 響應狀態:', response.status, response.statusText);
      
//       if (response.ok) {
//         const data = await response.json();
//         console.log('✅ 行程保存成功:', data);
        
//         // 獲取當前要確認的行程數據
//         const currentSchedule = schedules.find(s => s.id === scheduleId);
//         console.log('📋 當前行程數據:', currentSchedule);
        
//         // 更新前端狀態，將草稿行程替換為正式行程，保持景點數據
//         setSchedules(prev => prev.map(schedule => 
//           schedule.id === scheduleId 
//             ? {
//                 ...schedule,
//                 id: data.s_id || data.insertId,
//                 isDraft: false,
//                 // 明確保持原有的景點數據
//                 attractions: currentSchedule?.attractions || schedule.attractions || []
//               }
//             : schedule
//         ));
        
//         console.log('✅ 行程已確認，景點數據已保留');
        
//         // 確認行程後，釋放該草稿行程中景點的已使用狀態
//         // 因為已確認的行程中的景點不算"已使用"，可以被拖拽到其他新的草稿行程
//         if (onAttractionUsed && currentSchedule?.attractions) {
//           console.log('🔄 釋放已確認行程的景點使用狀態:', currentSchedule.attractions.map(a => a.name));
//           currentSchedule.attractions.forEach(attraction => {
//             onAttractionUsed(attraction.name, false); // false 表示釋放使用狀態
//           });
//         }
        
//         alert('行程已成功保存！景點卡片已恢復可選狀態。');
//       } else {
//         // 嘗試讀取錯誤訊息
//         const errorData = await response.text();
//         console.error('❌ 響應錯誤:', errorData);
//         throw new Error(`HTTP ${response.status}: ${errorData}`);
//       }
//     } catch (error) {
//       console.error('❌ 保存行程失敗:', error);
//       alert(`保存失敗：${error.message}`);
//     }
//   };

  // 處理行程取消的函數
//   const handleScheduleCancel = (scheduleId) => {
//     console.log('🗑️ 取消行程:', scheduleId);
//     // 從列表中移除草稿行程
//     setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
//   };

    const timeSlots = [
        '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00',
        '08:00', '09:00', '10:00', '11:00', '12:00','13:00', '14:00', '15:00',
        '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00','23:59'
    ];

    console.log('🔍 當前行程:', schedules);

    //components的最終return
    return (
        <div className="schedule_container">
            <div className="schedule_container_header">
                <h2 className="schedule_container_title">旅遊行程</h2>
                <div className="date-selector-wrapper">
                <DateSelector 
                    t_id={1} //@==@記得改掉@==@
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

            <ScheduleNew 
                containerHeight={timeColumnHeight} 
                onAddNewSchedule={handleShowScheduleInsert}
            />
            
            {showScheduleInsert && (
                <ScheduleInsert
                    t_id={1} //@==@t_id要替換
                    date = {selectedDate}
                    ScheduleInsertShow={handleShowScheduleInsert}
                />)
            }

            {loading ? (
            <div className="loading-message">載入中...</div>
            ) : schedules.length === 0 ? (
            <div className="empty-message">
                <p>沒有找到行程</p>
            </div>
            ) : (
            schedules.map((schedule) => (
                <ScheduleShow
                    key={'schedule-' + schedule.id}
                    s_id={schedule.id}
                    t_id={t_id}
                    title={schedule.title}
                    day={schedule.day}
                    scheduleId={schedule.id}
                    scheduleData={schedule}
                    initialAttractions={schedule.attractions}
                    isFirst={false}
                    isDraft={schedule.isDraft}
                    containerHeight={timeColumnHeight}
                    usedAttractions={usedAttractions}
                    // onAttractionUsed={handleAttractionUsed}
                    // onScheduleConfirm={handleScheduleConfirm}
                    // onScheduleCancel={handleScheduleCancel}
                />
            ))
            )}
        </div>
        </div>
    );
};

export default Schedule_container;