import React, { useState, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import ScheduleShow from './ScheduleShow.jsx';
import DateSelector from './DateSelector.jsx';
import AttractionConnector from './AttractionConnector.jsx';
import './ScheduleContainer.css';

const ScheduleContainer = ({ t_id, usedAttractions = [], onAttractionUsed, onShowRoute, onHideRoute, onAttractionSelect, filterConditions }) => {
    // 從 localStorage 獲取用戶和行程信息
    const user = JSON.parse(localStorage.getItem('user'));
    const trip = JSON.parse(localStorage.getItem('trip'));
    const currentUserId = user?.u_id;
    const currentTripId = trip?.tid;

    //State
    const [schedules, setSchedules] = useState([]); //儲存DB讀取的schedule
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(''); // 儲存目前選擇的Date
    const [timeColumnHeight, setTimeColumnHeight] = useState(0); // 儲存時間欄的高度
    const [sortBy, setSortBy] = useState('latest'); // 儲存排序方式

    const timeColumnRef = useRef(null);
    const scheduleListRef = useRef(null); // 新增：用於AttractionConnector的ref

    // function 1：處理日期選擇變更
    const handleDateChange = (date) => {
        setSelectedDate(date);
        // 這裡可以根據選擇的日期來篩選或更新行程資料
    };

    // function 2：處理排序方式變更
    const handleSortChange = (event) => {
        setSortBy(event.target.value);
    };

    // function 3：設置是否顯示 ScheduleInsert
    function handleShowScheduleInsert(show = false) {
        setShowScheduleInsert(show);
    }

    // function 4：取得新增的schedule
    function getNewSchedule(NewSchedule) {
        if (NewSchedule) {
            setSchedules(prevSchedules => [NewSchedule, ...prevSchedules]);
        }
    }

    // function 5：排序行程函數
    const sortSchedules = async (schedulesToSort, sortMethod) => {
        if (!schedulesToSort || schedulesToSort.length === 0) return schedulesToSort;

        // 如果按最新排序，直接返回
        if (sortMethod === 'latest') {
            return [...schedulesToSort].reverse();
        }

        // 為每個行程獲取詳細數據用於排序
        const schedulesWithDetails = await Promise.all(
            schedulesToSort.map(async (schedule) => {
                try {
                    const response = await fetch(`http://localhost:3001/api/view2_schedule_include_show/${t_id}/${schedule.s_id}`);
                    if (response.ok) {
                        const attractions = await response.json();

                        // 計算統計數據
                        const totalAttractions = attractions.length;
                        const totalDuration = attractions.reduce((sum, item) => sum + (item.height || 0), 0);
                        const categories = [...new Set(attractions.map(item => item.category).filter(Boolean))];
                        const totalCategories = categories.length;

                        return {
                            ...schedule,
                            attractions,
                            totalAttractions,
                            totalDuration,
                            totalCategories
                        };
                    }
                } catch (error) {
                    // Error handling without console output
                }

                return {
                    ...schedule,
                    attractions: [],
                    totalAttractions: 0,
                    totalDuration: 0,
                    totalCategories: 0
                };
            })
        );

        // 根據排序方式排序
        return schedulesWithDetails.sort((a, b) => {
            switch (sortMethod) {
                case 'attractions':
                    return b.totalAttractions - a.totalAttractions;
                case 'duration':
                    return b.totalDuration - a.totalDuration;
                case 'categories':
                    return b.totalCategories - a.totalCategories;
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
        const fetchAndSortSchedules = async () => {
            setLoading(true);

            let api = 'http://localhost:3001/api/view2_schedule_list';
            if (selectedDate) {
                api += `?date=${encodeURIComponent(selectedDate)}`;
            }

            try {
                const response = await fetch(api);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                if (data) {
                    // 格式化後端返回的數據
                    const formattedSchedules = data.map(schedule => ({
                        s_id: schedule.s_id,
                        u_id: schedule.u_id,
                        title: schedule.title || `行程${schedule.s_id}`,
                        day: schedule.day || schedule.s_id,
                        date: schedule.date,
                        t_id: schedule.t_id || t_id
                    }));

                    // 根據排序方式排序
                    const sortedSchedules = await sortSchedules(formattedSchedules, sortBy);
                    setSchedules(sortedSchedules);

                    // 處理已使用景點的邏輯
                    if (onAttractionUsed) {
                        const draftAttractions = new Set();
                        sortedSchedules.forEach(schedule => {
                            if (schedule.isDraft && schedule.attractions && schedule.attractions.length > 0) {
                                schedule.attractions.forEach(attraction => {
                                    draftAttractions.add(attraction.name);
                                });
                            }
                        });

                        draftAttractions.forEach(attractionName => {
                            onAttractionUsed(attractionName, true);
                        });
                    }
                }
            } catch (error) {
                // Error handling without console output
            } finally {
                setLoading(false);
            }
        };

        fetchAndSortSchedules();
    }, [selectedDate, sortBy]);

    //【useEffect 3】當排序方式改變時重新排序現有數據
    useEffect(() => {
        const applySorting = async () => {
            if (schedules.length > 0) {
                setLoading(true);
                const sortedSchedules = await sortSchedules(schedules, sortBy);
                setSchedules(sortedSchedules);
                setLoading(false);
            }
        };

        applySorting();
    }, [sortBy]);

    const timeSlots = [
        '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00',
        '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
        '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '23:59'
    ];

    //components的最終return
    return (
        <div className="schedule_container">
            <div className="schedule_container_header">
                <h2 className="schedule_container_title">Trip</h2>
                <div className="controls-wrapper">
                    <div className="date-selector-wrapper">
                        <DateSelector
                            t_id={t_id}
                            onDateChange={handleDateChange}
                        />
                    </div>
                    <div className="sort-selector-wrapper">
                        <select
                            value={sortBy}
                            onChange={handleSortChange}
                            className="sort-selector"
                        >
                            <option value="latest">Latest Trip</option>
                            <option value="attractions">Total Attractions</option>
                            <option value="duration">Total Duration</option>
                            <option value="categories">Total Categories</option>
                        </select>
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
                                onAttractionSelect={onAttractionSelect}
                                onShowRoute={onShowRoute}
                                onHideRoute={onHideRoute}
                            />
                        ))}

                        {/* 景點連線組件 */}
                        <AttractionConnector
                            schedules={schedules}
                            containerRef={scheduleListRef}
                            timeColumnWidth={150}
                            key={`connector-${schedules.length}-${selectedDate}`}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default ScheduleContainer;