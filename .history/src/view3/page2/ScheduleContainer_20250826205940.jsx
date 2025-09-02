import React, { useState, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';



import ScheduleShow from './ScheduleShow.jsx';
import DateSelector from './DateSelector.jsx';
import SortSelector from './SortSelector.jsx';
import AttractionConnector from './AttractionConnector.jsx';
import './ScheduleContainer.css';

const ScheduleContainer = ({ t_id, usedAttractions = [], onAttractionUsed, filterConditions }) => {
    //State
    const [schedules, setSchedules] = useState([]); //儲存DB讀取的schedule
    const [sortedSchedules, setSortedSchedules] = useState([]); //儲存排序後的schedule
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

    // function 4：處理排序選擇變更
    const handleSortChange = (newSortBy) => {
        setSortBy(newSortBy);
    };

    // function 5：為每個行程計算統計資料
    const calculateScheduleStats = async (schedule) => {
        try {
            const response = await fetch(`http://localhost:3001/api/view2_schedule_include_show/${t_id}/${schedule.s_id}`);
            if (response.ok) {
                const scheduleItems = await response.json();
                
                // 計算景點數量
                const attractionsCount = scheduleItems.length;
                
                // 計算總遊玩時間 (y軸總長度)
                const totalDuration = scheduleItems.reduce((sum, item) => sum + (item.height || 0), 0);
                
                // 計算類別數量
                const categories = new Set(scheduleItems.map(item => item.category).filter(Boolean));
                const categoriesCount = categories.size;
                
                return {
                    ...schedule,
                    attractionsCount,
                    totalDuration,
                    categoriesCount,
                    categories: Array.from(categories)
                };
            }
        } catch (error) {
            console.error('Error calculating schedule stats:', error);
        }
        return {
            ...schedule,
            attractionsCount: 0,
            totalDuration: 0,
            categoriesCount: 0,
            categories: []
        };
    };

    // function 6：排序行程
    const sortSchedules = (schedulesToSort, sortMethod) => {
        if (sortMethod === 'default') {
            return schedulesToSort;
        }

        return [...schedulesToSort].sort((a, b) => {
            switch (sortMethod) {
                case 'attractions_count':
                    return (b.attractionsCount || 0) - (a.attractionsCount || 0);
                case 'total_duration':
                    return (b.totalDuration || 0) - (a.totalDuration || 0);
                case 'categories_count':
                    return (b.categoriesCount || 0) - (a.categoriesCount || 0);
                default:
                    return 0;
            }
        });
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
            .then(async (data) => {
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

                    // 倒序排列，讓最新的行程在最前面（最左邊）
                    formattedSchedules.reverse();

                    // 計算每個行程的統計資料
                    const schedulesWithStats = await Promise.all(
                        formattedSchedules.map(schedule => calculateScheduleStats(schedule))
                    );

                    setSchedules(schedulesWithStats);

                    // console.log('✅ 載入的 Schedule 數量:', schedulesWithStats.length);
                    // console.log('📋 載入的行程數據:', schedulesWithStats);
                    // **關鍵修正**: 只將草稿行程中的景點標記為已使用，已確認的行程中的景點不標記為已使用
                    if (onAttractionUsed) {
                        const draftAttractions = new Set();
                        schedulesWithStats.forEach(schedule => {
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

    //【useEffect 3】排序行程，當排序方式或行程資料變更時重新排序
    useEffect(() => {
        const sorted = sortSchedules(schedules, sortBy);
        setSortedSchedules(sorted);
    }, [schedules, sortBy]);

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
                <div className="date-selector-wrapper">
                    <DateSelector
                        t_id={1} //@==@記得改掉@==@
                        onDateChange={handleDateChange}
                    />
                    <SortSelector
                        sortBy={sortBy}
                        onSortChange={handleSortChange}
                    />
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
                ) : sortedSchedules.length === 0 ? (
                    <div className="empty-message">
                        <p>沒有找到行程</p>
                    </div>
                ) : (
                    <>
                        {sortedSchedules.map((schedule) => (
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
                            schedules={sortedSchedules}
                            containerRef={scheduleListRef}
                            timeColumnWidth={150} // 時間欄寬度，可以根據實際情況調整
                            key={`connector-${sortedSchedules.length}-${selectedDate}`} // 強制重新渲染
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default ScheduleContainer;