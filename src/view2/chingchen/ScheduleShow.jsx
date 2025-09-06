//不可編輯的schedule
import React, { useState, useEffect, useContext, useRef, useLayoutEffect } from 'react';

import { SelectedScheduleContext } from './page1.jsx';
import styles from './Schedule.module.css';
import ScheduleItem from './ScheduleItem.jsx'; // 引入 ScheduleItem 組件

let HOST_URL = import.meta.env.VITE_API_URL;
let NGROK_URL = import.meta.env.VITE_NGROK_URL;
const PORT = import.meta.env.PORT || 3001;
let BASE_URL = NGROK_URL || `http://${HOST_URL}:${PORT}`;


const ScheduleShow = (props) => {
    // state
    const [attractions, setAttractions] = useState(props.initialAttractions || []); //景點
    const [scheduleItems, setScheduleItems] = useState([]);
    const [scheduleWidths, setScheduleWidths] = useState(0);

    const [hovered, setHovered] = useState(false);
    
    var HourIntervalHeight = props.intervalHeight/60;

    // 新增：建立 refs 陣列（效仿 ScheduleInsert）
    // 動態管理所有 ScheduleItem 和 TransportBar 的 ref
    const scheduleItemRefs = useRef([]); // 每個 ScheduleItem 的 ref
    const transportBarRefs = useRef([]); // 每個 ScheduleItem 的 4 個 bar refs

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
        let api = `${BASE_URL}/api/view2_schedule_include_show/${props.t_id}/${props.s_id}`;
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

    // function 1:處理時間線
    const renderGrid = () => {
        const timeColumn = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '23:59'];
        const lines = [];
        const intervalHeight = props.containerHeight*0.9 / 25;
        // console.log("inverval height in schedule SHOW",props.intervalHeight);
        // console.log("containerHeight in schedule SHOW",props.containerHeight);
        // console.log("intervalHeight in schedule SHOW",props.intervalHeight);
        console.log("✅props.containerHeight",props.containerHeight,"*0.9 / 25 = ",intervalHeight);

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
                    data-time={time}
                />
            );
        });
        return lines;
    };

    //function 2:碰撞檢查工具
        function isRectOverlap(r1, r2) {
            if (!r1 || !r2) return false;
            // console.log("r1:",r1);
            // console.log("r2:",r2);
            return (
                r1.left < r2.right &&
                r1.right > r2.left &&
                r1.top < r2.bottom &&
                r1.bottom > r2.top
            );
        }
        
    //function 3:高度更新工具
    const updateBarHeights = (current_barRef,current_itemRect,originalBarHeight) => {
        let distance = null;
        // barRect 在 itemRect 上方
        if (current_barRef.top < current_itemRect.top) {
            distance = current_itemRect.top - current_barRef.top;
        } else if (current_barRef.bottom > current_itemRect.bottom) {
            distance = current_barRef.bottom - current_itemRect.bottom;
        } else {
            // bar 在 item 內部或完全重疊
            distance = 0;
        }
        // 取最小距離
        let minDistance = null;
        if (minDistance === null || distance < minDistance) {
            minDistance = distance;
        }

        return Math.min(minDistance, originalBarHeight)
    };

    // function 4:處理高度和顔色
    // 參考 ScheduleInsert 的碰撞偵測寫法
    const checkAllBarScheduleItemCollision = () => {
        for (let i = 0; i < scheduleItems.length; i++) {
            
            for (let j = 0; j < 4; j++) {
                const barRef = transportBarRefs.current[i]?.[j];

               
                if (!barRef?.current) continue;

                // 先還原高度和 class
                if (barRef.current.children[0]) {
                    // barRef.current.children[0].style.height = '';
                    barRef.current.children[0].classList.remove('bar_collide');
                }

                const barRect = barRef.current.getBoundingClientRect();
                let collided = false;
                for (let k = 0; k < scheduleItems.length; k++) {

                    if (k === i) continue;

                    const itemRef = scheduleItemRefs.current[k];
                    
                    if (!itemRef?.current) continue;
                    const itemRect = itemRef.current.getBoundingClientRect();
                    // console.log("itemRect:",itemRect)
                    // console.log("barRect",barRect);
                    // if (isRectOverlap(itemRect, barRect)){
                    if (isRectOverlap(itemRect, barRect)){    
                        // 碰撞時
                        if (barRef.current.children[0]) {
                            barRef.current.children[0].classList.add('bar_collide');
                            // 如需高度調整可加上：
                            barRef.current.children[0].style.height = updateBarHeights(barRect, itemRect, 99999) + 'px';
                        }
                        collided = true;
                        break;
                    }
                }
                // 無碰撞時已還原高度與 class，無需額外處理
            }
        }
    };


    useLayoutEffect(() => {
        if (scheduleItems.length > 0) {
            checkAllBarScheduleItemCollision();
            // 再多偵測幾次，確保圖片等載入完成
            setTimeout(() => checkAllBarScheduleItemCollision(), 1000);
            setTimeout(() => checkAllBarScheduleItemCollision(), 3000);
        }
    }, [scheduleItems, scheduleWidths]);

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
            className={[
                styles.schedule,
                styles.scheduleShow,
                props.selectedScheduleId === props.s_id ? styles['schedule-selected'] : '',
                hovered ? styles['schedule-hovered'] : ''
            ].filter(Boolean).join(' ')}
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
            <div className={styles.schedule_header}>

                    {/* 路線圖標已隱藏 - 現在點擊行程即可顯示路線 */}
                    {/* <div className="route_show" style={{ display: 'none' }}>
                        <img src={routeIcon} alt="Route" />
                    </div> */}
                    
                    <div className={styles.user_avatar}>
                        <img alt="User" src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png"/>
                    </div>
                    
                    {/* <div className="budget_display">$350</div> */}
                    
                    <span className={styles.schedule_date}>{props.title}</span>
            </div>

            {/* //層級3：schedule放内容的地方 */}
            <div className={styles.schedule_timeline} style={{ position: 'relative', overflow: 'hidden', maxHeight: props.containerHeight }}>
                {renderGrid()}

                {/* 顯示景點（已經在資料庫的） */}
                {scheduleItems.map((scheduleItem, index) => {
                    // 動態建立ref（效仿 ScheduleInsert）
                    if (!scheduleItemRefs.current[index]) scheduleItemRefs.current[index] = React.createRef();
                    if (!transportBarRefs.current[index]) transportBarRefs.current[index] = [React.createRef(), React.createRef(), React.createRef(), React.createRef()];
                    return (
                        <ScheduleItem
                            key={`schedule-item-${scheduleItem.id}-${scheduleItem.a_id}`}
                            a_id={scheduleItem.a_id}
                            s_id={scheduleItem.id}
                            name={scheduleItem.name}
                            sequence={scheduleItem.sequence}
                            position={{ x: scheduleItem.x, y: scheduleItem.y }} // x和y的位置，傳入object
                            width={scheduleWidths} // 使用計算出的寬度
                            height={scheduleItem.height} // 使用從資料庫獲取的高度
                            editable={false} // 不可編輯
                            intervalHeight={props.intervalHeight}
                            nextAId={scheduleItems.find(a => a.sequence === scheduleItem.sequence + 1)?.a_id ?? null}
                            transport_method={scheduleItem.transport_method}
                            categoryColor={getCategoryColor(scheduleItem.category)} // 傳遞分類顏色
                            category={scheduleItem.category} // 傳遞分類名稱
                            scheduleItemRef={scheduleItemRefs.current[index]}
                            barRefs={transportBarRefs.current[index]}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default ScheduleShow;
