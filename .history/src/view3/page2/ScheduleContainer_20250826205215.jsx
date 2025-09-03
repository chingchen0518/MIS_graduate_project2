import React, { useState, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';



import ScheduleShow from './ScheduleShow.jsx';
import DateSelector from './DateSelector.jsx';
import AttractionConnector from './AttractionConnector.jsx';
import './ScheduleContainer.css';

const ScheduleContainer = ({ t_id, usedAttractions = [], onAttractionUsed, filterConditions }) => {
    //State
    const [schedules, setSchedules] = useState([]); //儲存DB讀取的schedule
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(''); // 儲存目前選擇的Date
    const [timeColumnHeight, setTimeColumnHeight] = useState(0); // 儲存時間欄的高度
    const [sortBy, setSortBy] = useState('default'); // 儲存排序方式

    const timeColumnRef = useRef(null);
    const scheduleListRef = useRef(null); // 新增：用於AttractionConnector的ref

    // function 1：處理日期選擇變更
    const handleDateChange = (date) => {
        setSelectedDate(date);
        // console.log('選擇的日期:', date);
        // 這裡可以根據選擇的日期來篩選或更新行程資料
    };

    // function 2：設置是否顯示 ScheduleInsert
    function handleShowScheduleInsert(show = false) {
        setShowScheduleInsert(show);
    }

    // function 3：取得新增的schedule
    function getNewSchedule(NewSchedule) {

        if (NewSchedule) {
            setSchedules(prevSchedules => [NewSchedule, ...prevSchedules]);
        }
    }

    // function 4：處理排序方式變更
    const handleSortChange = (sortType) => {
        setSortBy(sortType);
    };

    // function 5：獲取行程統計數據
    const getScheduleStats = async (scheduleId, date) => {
        try {
            const response = await fetch(`http://localhost:3001/api/schedule_stats/${scheduleId}/${date}`);
            if (response.ok) {
                const data = await response.json();
                return {
                    attractionCount: data.attraction_count || 0,
                    totalDuration: data.total_duration || 0,
                    categoryCount: data.category_count || 0
                };
            }
        } catch (error) {
            console.error('Error fetching schedule stats:', error);
        }
        return { attractionCount: 0, totalDuration: 0, categoryCount: 0 };
    };

    // function 6：排序行程
    const sortSchedules = (schedulesData) => {
        const sortedSchedules = [...schedulesData];
        
        switch (sortBy) {
            case 'attractionCount':
                return sortedSchedules.sort((a, b) => (b.stats?.attractionCount || 0) - (a.stats?.attractionCount || 0));
            case 'totalDuration':
                return sortedSchedules.sort((a, b) => (b.stats?.totalDuration || 0) - (a.stats?.totalDuration || 0));
            case 'categoryCount':
                return sortedSchedules.sort((a, b) => (b.stats?.categoryCount || 0) - (a.stats?.categoryCount || 0));
            default:
                return sortedSchedules; // 預設順序
        }
    };

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
            .then(async data => {
                if (data) {
                    // 格式化後端返回的數據
                    const formattedSchedules = data.map(schedule => ({
                        s_id: schedule.s_id,
                        u_id: schedule.u_id,
                        title: schedule.title || `行程${schedule.s_id}`,
                        day: schedule.day || schedule.s_id,
                        date: schedule.date,
                        // attractions: schedule.attractions || []
                    }));

                    // 獲取每個行程的統計數據
                    const schedulesWithStats = await Promise.all(
                        formattedSchedules.map(async (schedule) => {
                            const stats = await getScheduleStats(schedule.s_id, selectedDate || schedule.date);
                            return { ...schedule, stats };
                        })
                    );

                    // 倒序排列，讓最新的行程在最前面（最左邊）
                    schedulesWithStats.reverse();
                    
                    // 應用排序
                    const sortedSchedules = sortSchedules(schedulesWithStats);
                    setSchedules(sortedSchedules);

                    // console.log('✅ 載入的 Schedule 數量:', sortedSchedules.length);
                    // console.log('📋 載入的行程數據:', sortedSchedules);
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

    //【useEffect 3】當排序方式變更時重新排序
    useEffect(() => {
        if (schedules.length > 0) {
            const sortedSchedules = sortSchedules(schedules);
            setSchedules(sortedSchedules);
        }
    }, [sortBy]); // 當 sortBy 變更時重新排序

    const timeSlots = [
        '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00',
        '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '16:00',
        '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '23:59'
    ];



    //components的最終return
    return (
        <div className="schedule_container">
            <div className="schedule_container_header">
                <h2 className="schedule_container_title">旅遊行程</h2>
                <div className="controls-wrapper">
                    <div className="sort-selector">
                        <label htmlFor="sort-select">排序方式:</label>
                        <select 
                            id="sort-select"
                            value={sortBy} 
                            onChange={(e) => handleSortChange(e.target.value)}
                            className="sort-dropdown"
                        >
                            <option value="default">預設順序</option>
                            <option value="attractionCount">總景點數</option>
                            <option value="totalDuration">總遊玩時間</option>
                            <option value="categoryCount">總類別數</option>
                        </select>
                    </div>
                    <div className="date-selector-wrapper">
                        <DateSelector
                            t_id={1} //@==@記得改掉@==@
                            onDateChange={handleDateChange}
                        />
                    </div>
                </div>
            </div>

            <div className="schedule_list attraction-connector-container" ref={scheduleListRef} style={{ position: 'relative' }}>
                <div className="time_column" ref={timeColumnRef} style={{ height: timeColumnHeight }}>
                    {timeSlots.map((time) => (
                        <div key={time} className="time_slot">
                            {time}
                        </div>
                    ))}
                </div>
                {loading ? (
                    <div className="loading-message">載入中...</div>
                ) : schedules.length === 0 ? (
                    <div className="empty-message">
                        <p>沒有找到行程</p>
                    </div>
                ) : (
                    <>
                        {schedules.map((schedule) => (
                            <ScheduleShow
                                key={'schedule-' + schedule.s_id}
                                s_id={schedule.s_id}
                                t_id={t_id}
                                u_id={schedule.u_id}
                                title={schedule.title}
                                day={schedule.day}
                                date={selectedDate}
                                intervalHeight={timeColumnHeight / (timeSlots.length + 1)}
                                containerHeight={timeColumnHeight}
                                filterConditions={filterConditions}
                            />
                        ))}

                        {/* 景點連線組件 */}
                        <AttractionConnector
                            schedules={schedules}
                            containerRef={scheduleListRef}
                            timeColumnWidth={150} // 時間欄寬度，可以根據實際情況調整
                            key={`connector-${schedules.length}-${selectedDate}`} // 強制重新渲染
                        />
                    </>
                )}




            </div>
        </div>
    );
};

export default ScheduleContainer;