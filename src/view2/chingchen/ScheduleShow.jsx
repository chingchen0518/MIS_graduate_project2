//不可編輯的schedule
import React, { useState, useEffect, useContext } from 'react';
import { SelectedScheduleContext } from './page1.jsx';
import './schedule.css';
import ScheduleItem from './ScheduleItem.jsx'; // 引入 ScheduleItem 組件


const ScheduleShow = (props) => {
    // state
    const [attractions, setAttractions] = useState(props.initialAttractions || []); //景點
    const [scheduleItems, setScheduleItems] = useState([]);
    const [scheduleWidths, setScheduleWidths] = useState(0);

    const [hovered, setHovered] = useState(false);

    var HourIntervalHeight = props.intervalHeight/60;

    // 定義景點分類顏色映射（邊框顏色）
    const getCategoryColor = (category) => {
        const colorMap = {
            // 根據資料庫實際分類名稱對應
            '歷史文化': 'linear-gradient(135deg, #ffdfba, #ffbf69)', // Culture & Heritage - 橘色漸變
            '自然景觀': 'linear-gradient(135deg, #bae1ff, #baffc9)', // Scenic Spots - 藍綠色漸變
            '交通運輸': 'linear-gradient(135deg, #f9a1bc, #fbc4ab)', // Transport Rides - 粉色漸變
            '探索空間': 'linear-gradient(135deg, #dcd6f7, #a6b1e1)', // Discovery Spaces - 紫色漸變
            '公共廣場': 'linear-gradient(135deg, #c77dff, #ffd6ff)', // Public Squares - 紫粉色漸變
            
            // 保留舊的分類名稱以防萬一
            '文化古蹟': 'linear-gradient(135deg, #ffdfba, #ffbf69)',
            '風景名勝': 'linear-gradient(135deg, #bae1ff, #baffc9)',
            
            // 預設顏色
            'default': 'linear-gradient(135deg, #f0f0f0, #d0d0d0)'
        };
        
        return colorMap[category] || colorMap['default'];
    };

    useEffect(() => {
        const calculateWidth = () => {
            const scheduleTimeline = document.querySelector('.schedule_timeline');
            if (scheduleTimeline) {
                const rect = scheduleTimeline.getBoundingClientRect();
                setScheduleWidths(rect.width);
            }
        };
        calculateWidth();
        window.addEventListener('resize', calculateWidth);
        return () => {
            window.removeEventListener('resize', calculateWidth);
        };
    }, []);

    useEffect(() => {
        let api = `http://localhost:3001/api/view2_schedule_include_show/${props.t_id}/${props.s_id}`;
        fetch(api)
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }else{
                return response.json();
            }
        })
        .then((data) => {
            setScheduleItems(data);
        })
        .catch((error) => {
            console.error('Error fetching attractions:', error);
        });
    }, [props.t_id, props.s_id]);

    const renderGrid = () => {
        const timeColumn = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '23:59'];
        const lines = [];
        const intervalHeight = props.containerHeight / 25;
        timeColumn.forEach((time, index) => {
            lines.push(
                <div
                    key={`schedule-item-${props.s_id}-${index}`}
                    style={{
                        position: 'absolute',
                        top: index * intervalHeight,
                        left: 0,
                        width: '100%',
                        height: '1px',
                        backgroundColor: 'lightgray',
                    }}
                />
            );
        });
        return lines;
    };


    // 點擊與 hover 處理
    // 點擊時將選取狀態交由 Context 控制，並顯示/隱藏路線
    const { selectedScheduleId, setSelectedScheduleId } = useContext(SelectedScheduleContext);
    const handleClick = () => {
        const wasSelected = selectedScheduleId === props.s_id;
        
        if (wasSelected) {
            // 如果點擊的是已選中的行程，則取消選擇並隱藏路線
            setSelectedScheduleId(null);
            if (props.onHideRoute) {
                props.onHideRoute();
            }
            console.log('隱藏路線');
        } else {
            // 選擇新的行程並顯示路線
            setSelectedScheduleId(props.s_id);
            
            // 準備要傳遞給地圖的景點數據
            const routeData = {
                scheduleId: props.s_id,
                tripId: props.t_id,
                title: props.title,
                attractions: scheduleItems.map(item => ({
                    id: item.a_id,
                    name: item.name,
                    sequence: item.sequence,
                    latitude: item.latitude,
                    longitude: item.longitude,
                    address: item.address,
                    category: item.category
                }))
            };
            
            // 調用父組件傳入的回調函數來顯示路線
            if (props.onShowRoute) {
                props.onShowRoute(routeData);
            }
            
            console.log('顯示路線，景點數據：', routeData);
        }
        
        setTimeout(() => {
            // 用 setTimeout 確保 state 已更新
            console.log(`全域 selectedScheduleId: ${selectedScheduleId}，剛點擊: ${props.s_id}`);
        }, 0);
    };
    // 滑鼠移入/移出時切換 hovered 狀態
    const handleMouseEnter = () => setHovered(true);
    const handleMouseLeave = () => setHovered(false);


    //組件的return（顯示單個schedule）
    return (
        //層級1：單個schedule 
        <div
            className={`schedule scheduleShow${props.selectedScheduleId === props.s_id ? ' schedule-selected' : ''}${hovered ? ' schedule-hovered' : ''}`}
            style={{
                position: 'relative',
                height: props.containerHeight,
                overflow: 'hidden',
                maxHeight: props.containerHeight,
                overflowY: 'hidden',
                overflowX: 'hidden',
                cursor: 'pointer',
                transition: 'background 0.2s, box-shadow 0.2s',
                background: props.selectedScheduleId === props.s_id ? '#c3dafe' : hovered ? '#f0f4ff' : 'white',
                borderColor: props.selectedScheduleId === props.s_id ? '#3182ce' : '#e0e0e0',
                boxShadow: props.selectedScheduleId === props.s_id
                    ? '0 6px 24px rgba(49, 130, 206, 0.22)'
                    : hovered
                        ? '0 4px 16px rgba(66, 139, 255, 0.18)'
                        : '0 1px 3px rgba(0, 0, 0, 0.1)',
                zIndex: props.selectedScheduleId === props.s_id ? 2 : hovered ? 1 : 0,
                transform: hovered ? 'scale(1.04)' : 'scale(1)',
            }}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* //層級2：schedule的header  */}
            <div className="schedule_header">

                    {/* 路線圖標已隱藏 - 現在點擊行程即可顯示路線 */}
                    {/* <div className="route_show" style={{ display: 'none' }}>
                        <img src={routeIcon} alt="Route" />
                    </div> */}
                    
                    <div className="user_avatar">
                        <img alt="User" src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png"/>
                    </div>
                    
                    {/* <div className="budget_display">$350</div> */}
                    
                    <span className="schedule_date">{props.title}</span>
            </div>

            {/* //層級3：schedule放内容的地方 */}
            <div className="schedule_timeline" style={{ position: 'relative', overflow: 'hidden', maxHeight: props.containerHeight }}>
                {renderGrid()}

                {/* 顯示景點（已經在資料庫的） */}
                {scheduleItems.map((scheduleItem) => (
                    <ScheduleItem
                        key={`schedule-item-${scheduleItem.id}-${scheduleItem.a_id}`}
                        a_id={scheduleItem.a_id}
                        s_id={scheduleItem.id}
                        name={scheduleItem.name}
                        position={{ x: scheduleItem.x, y: scheduleItem.y }} // x和y的位置，傳入object
                        width={scheduleWidths} // 使用計算出的寬度
                        height={scheduleItem.height} // 使用從資料庫獲取的高度
                        editable={false} // 不可編輯
                        intervalHeight={props.intervalHeight}
                        nextAId={scheduleItems.find(a => a.sequence === scheduleItem.sequence + 1)?.a_id ?? null}
                        transport_method={scheduleItem.transport_method}
                        categoryColor={getCategoryColor(scheduleItem.category)} // 傳遞分類顏色
                        category={scheduleItem.category} // 傳遞分類名稱
                    />
                ))}
            </div>
        </div>
    );
};

export default ScheduleShow;
