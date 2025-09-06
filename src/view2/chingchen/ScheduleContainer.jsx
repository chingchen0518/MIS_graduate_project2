let HOST_URL = import.meta.env.VITE_API_URL;
let NGROK_URL = import.meta.env.VITE_NGROK_URL;
const PORT = import.meta.env.PORT || 3001;
let BASE_URL = NGROK_URL || `http://${HOST_URL}:${PORT}`;

import React, { useState, useEffect, useRef, useContext } from 'react';
import { SelectedScheduleContext } from './page1.jsx';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import ScheduleNew from './scheduleNew.jsx';
import ScheduleInsert from './ScheduleInsert.jsx';
import ScheduleShow from './ScheduleShow.jsx';
import DateSelector from '../Liu/DateSelector';
import styles from './ScheduleContainer.module.css';
import scheduleStyles from './Schedule.module.css';

const user = JSON.parse(localStorage.getItem('user'));
const trip = JSON.parse(localStorage.getItem('trip'))
// console.log('ScheduleContainer user:', user.uid);

const ScheduleContainer = ({ t_id,usedAttractions = [], onAttractionUsed, onShowRoute, onHideRoute }) => {
    //State
    const [schedules, setSchedules] = useState([]); //儲存DB讀取的schedule
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(''); // 儲存目前選擇的Date
    const [timeColumnHeight, setTimeColumnHeight] = useState(0); // 儲存時間欄的高度
    const [showScheduleInsert, setShowScheduleInsert] = useState(false); //要不要顯示ScheduleInsert
    const [scheduleListHeight, setScheduleListHeight] = useState(0); // schedule_list高度
    // 從 Context 取得 selectedScheduleId 狀態
    const { selectedScheduleId, setSelectedScheduleId } = useContext(SelectedScheduleContext);

    const timeColumnRef = useRef(null);
    const scheduleListRef = useRef(null);

    // console.log(user, trip)
    
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

    //【useEffect 1】計算timeColumn的高度+schedule_list高度+更新到State
    useEffect(() => {
        const updateHeights = () => {
            if (timeColumnRef.current) {
                setTimeColumnHeight(timeColumnRef.current.scrollHeight);
            }
            if (scheduleListRef.current) {
                setScheduleListHeight(scheduleListRef.current.offsetHeight);
            }
        };

        updateHeights();

        // Optional: Add a resize observer to handle dynamic changes
        const resizeObserver = new ResizeObserver(updateHeights);
        if (timeColumnRef.current) {
            resizeObserver.observe(timeColumnRef.current);
        }
        if (scheduleListRef.current) {
            resizeObserver.observe(scheduleListRef.current);
        }

        return () => {
            if (timeColumnRef.current) {
                resizeObserver.unobserve(timeColumnRef.current);
            }
            if (scheduleListRef.current) {
                resizeObserver.unobserve(scheduleListRef.current);
            }
        };
    }, []);

    //【useEffect 2】從 API 獲取行程(如有日期則按日期過濾)
    useEffect(() => {
        setLoading(true);

        let api = `${BASE_URL}/api/view2_schedule_list?t_id=${trip.tid}`;
        
        //添加日期
        if (selectedDate) {
            api += `&date=${encodeURIComponent(selectedDate)}`;
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

    // 參考 ScheduleInsert.jsx 的 renderGrid 寫法
    const renderTimeColumnGrid = (latestScheduleListHeight) => {
        const lines = [];
        let intervalHeight1 = latestScheduleListHeight*0.9 / 25;
        // console.log("latestScheduleListHeight in schedule Container",latestScheduleListHeight);
        // console.log("interval height in schedule Container",intervalHeight);
        // console.log("🅰️latestScheduleListHeight",latestScheduleListHeight,"*0.9 / 25 = ",intervalHeight1);


        timeSlots.forEach((time, index) => {
            lines.push(
                <div key={time} style={{
                    position: 'absolute',
                    top: index * intervalHeight1,
                    left: 0,
                    width: '100%',
                    height: '1px',
                    // backgroundColor: 'lightgray',
                    display: 'flex',
                    alignItems: 'center',
                    zIndex: 1
                }}>
                    <span style={{
                        position: 'absolute',
                        left: 0,
                        top: '-10px',
                        fontSize: '15px',
                        color: '#888',
                        // background: '#E7F1FF',
                        padding: '0 2px',
                        zIndex: 2
                    }}>{time}</span>
                </div>
            );
        });
        return (
            <div style={{ position: 'relative', height: latestScheduleListHeight, width: '100%' }}>
                {lines}
            </div>
        );
    };


    // 讓latestTimeColumnHeight等於schedule_list的高度
    const latestScheduleListHeight = scheduleListHeight*1.5;
    //components的最終return
    return (
    <div className={styles.schedule_container}>
            <div className={styles.schedule_container_header}>
                <h2 className={styles.schedule_container_title}>🚩旅遊行程</h2>
                <div className={styles['date-selector-wrapper']}>
                <DateSelector 
                    t_id={trip.tid} //@==@記得改掉@==@
                    onDateChange={handleDateChange}
                />
                </div>
            </div>

            <div className={styles.schedule_list} ref={scheduleListRef}>
                <div className={styles.time_column} ref={timeColumnRef} style={{ height: latestScheduleListHeight, top: '10%' }}>
                    <div style={{ height: "10%", marginTop: "10px" }} className={`${scheduleStyles.schedule_header} nothing`}></div>
                    {renderTimeColumnGrid(latestScheduleListHeight)}

                    {/* <div className="time_grid"></div> */}
                </div>

                <ScheduleNew 
                    containerHeight={latestScheduleListHeight} 
                    onAddNewSchedule={handleShowScheduleInsert}
                    isBlinking={(!loading && schedules.length === 0)}
                />
            
            {showScheduleInsert && (
                <ScheduleInsert
                    t_id={trip.tid} //@==@t_id要替換
                    u_id={user.uid}
                    date = {selectedDate}
                    ScheduleInsertShow={handleShowScheduleInsert}
                    handleNewSchedule={getNewSchedule}
                    containerHeight={latestScheduleListHeight}
                    intervalHeight={latestScheduleListHeight / (timeSlots.length + 1)}
                    //用於告訴attraction_container哪一些景點已被使用
                    onAttractionUsed={onAttractionUsed} 
                />)
            }

            {loading ? (
            <div className="loading-message">行程載入中...</div>
            ) : schedules.length === 0 ? (
            <div className="empty-message">
                <p>目前還沒有行程哦，點擊新增行程</p>
            </div>
            ) : (

            
            
            schedules.map((schedule) => (
                <ScheduleShow
                    key={'schedule-' + schedule.s_id}
                    u_id={user.uid}
                    t_id={trip.tid}
                    s_id={schedule.s_id}
                    title={schedule.title}
                    day={schedule.day}
                    intervalHeight={latestScheduleListHeight / (timeSlots.length + 1)}
                    containerHeight={latestScheduleListHeight}
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