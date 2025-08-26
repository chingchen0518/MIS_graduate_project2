import React, { useState, useEffect, useRef, useContext } from 'react';
import { SelectedScheduleContext } from './page1.jsx';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import ScheduleNew from './scheduleNew.jsx';    
import ScheduleInsert from './ScheduleInsert.jsx';
import ScheduleShow from './ScheduleShow.jsx';
import DateSelector from '../Liu/DateSelector';
import './ScheduleContainer.css';

const ScheduleContainer = ({ t_id,usedAttractions = [], onAttractionUsed, onShowRoute, onHideRoute }) => {
    //State
    const [schedules, setSchedules] = useState([]); //儲存DB讀取的schedule
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(''); // 儲存目前選擇的Date
    const [timeColumnHeight, setTimeColumnHeight] = useState(0); // 儲存時間欄的高度
    const [showScheduleInsert, setShowScheduleInsert] = useState(false); //要不要顯示ScheduleInsert
    // 從 Context 取得 selectedScheduleId 狀態
    const { selectedScheduleId, setSelectedScheduleId } = useContext(SelectedScheduleContext);

    const timeColumnRef = useRef(null);

    // function 1：處理日期選擇變更
    const handleDateChange = (date) => {
        setSelectedDate(date);
        // console.log('選擇的日期:', date);
        // 這裡可以根據選擇的日期來篩選或更新行程資料
    };

    // function 2：設置是否顯示 ScheduleInsert
    function handleShowScheduleInsert(show=false) {
        setShowScheduleInsert(show);
    }

    // function 3：取得新增的schedule
    function getNewSchedule(NewSchedule) {
        
        if(NewSchedule){
            setSchedules(prevSchedules => [NewSchedule,...prevSchedules]);
        }
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
            // console.log('🔍 按日期載入 Schedule:', selectedDate);
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
                    s_id: schedule.s_id,
                    title: schedule.title || `行程${schedule.s_id}`,
                    day: schedule.day || schedule.s_id,
                    date: schedule.date,
                    // attractions: schedule.attractions || []
                }));

                // 倒序排列，讓最新的行程在最前面（最左邊）
                formattedSchedules.reverse();
                setSchedules(formattedSchedules);

                // console.log('✅ 載入的 Schedule 數量:', formattedSchedules.length);
                // console.log('📋 載入的行程數據:', formattedSchedules);
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
                
                // console.log('🔄 同步草稿行程的景點狀態:', [...draftAttractions]);
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

    const timeSlots = [
        '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00','08:00', 
        '09:00', '10:00', '11:00', '12:00','13:00', '14:00', '15:00','16:00', 
        '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00','23:59'
    ];



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
                <div className="time_column" ref={timeColumnRef} style={{ height: timeColumnHeight}}>
                {timeSlots.map((time) => (
                    <div key={time} className="time_slot">
                        {time}
                    </div>
                ))}
            </div>

            <ScheduleNew 
                containerHeight = {timeColumnHeight} 
                onAddNewSchedule={handleShowScheduleInsert}
            />
            
            {showScheduleInsert && (
                <ScheduleInsert
                    t_id={1} //@==@t_id要替換
                    date = {selectedDate}
                    ScheduleInsertShow={handleShowScheduleInsert}
                    handleNewSchedule={getNewSchedule}
                    containerHeight={timeColumnHeight}
                    intervalHeight={timeColumnHeight / (timeSlots.length + 1)}
                    //用於告訴attraction_container哪一些景點已被使用
                    onAttractionUsed={onAttractionUsed} 
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
                    key={'schedule-' + schedule.s_id}
                    s_id={schedule.s_id}
                    t_id={t_id}
                    title={schedule.title}
                    day={schedule.day}
                    intervalHeight={timeColumnHeight / (timeSlots.length + 1)}
                    containerHeight={timeColumnHeight}
                    onShowRoute={onShowRoute}
                    onHideRoute={onHideRoute}
                    selectedScheduleId={selectedScheduleId}
                    setSelectedScheduleId={setSelectedScheduleId}
                />
            ))
            )}
        </div>
        </div>
    );
};

export default ScheduleContainer;