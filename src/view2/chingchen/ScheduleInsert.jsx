import React, { useState, useRef, lazy, Suspense, useEffect } from 'react';
import { useDrop, useDragLayer } from 'react-dnd';
import './schedule.css';
import { function1 } from './TransportTime';
import { fetchAttractions, buildPrompt, scheduleGenerate } from './AI_generate_schedule.js'; 

// 使用 lazy 進行按需加載
const ScheduleItem = lazy(() => import('./ScheduleItem'));

const ScheduleInsert = ({
        t_id,
        date, 
        title, 
        initialAttractions,
        day, 
        scheduleId,
        isDraft = true,
        containerHeight, 
        handleNewSchedule,
        onAttractionUsed,//處理已經被使用的景點（回傳父組件）
        ScheduleInsertShow,
        intervalHeight,
    }) => {
    
    var u_id = 1; // @==@假設用戶ID為1，實際應根據您的應用邏輯獲取
    var HourIntervalHeight = intervalHeight/60;//計算每個小時這些schedule中的高度（會在render grid里修改）
    var all_attraction;
    let TheNewSchedule = {};
    
    //state
    const [attractions, setAttractions] = useState([]); //儲存目前放進schedule的attraction
    const [loading, setLoading] = useState(false);

    // var finalScheduleItems = {}; // 儲存最終的行程項目
    const dropRef = useRef(null);

    // 動態管理所有 ScheduleItem 和 TransportBar 的 ref
    const scheduleItemRefs = useRef([]);
    const transportBarRefs = useRef([]);

    // barCollide 狀態：每個ScheduleItem有4個Bar
    const [barCollide, setBarCollide] = useState([]);

    // barHeightLimits 狀態：每個ScheduleItem的maxBarHeight
    const [barHeightLimits, setBarHeightLimits] = useState([]);

    // 碰撞檢查工具
    function isRectOverlap(r1, r2) {
        if (!r1 || !r2) return false;
        return (
            r1.left < r2.right &&
            r1.right > r2.left &&
            r1.top < r2.bottom &&
            r1.bottom > r2.top
        );
    }

    // 檢查所有 bar 與所有 schedule_item（非自己）碰撞
    const checkAllBarScheduleItemCollision = () => {
        setBarCollide(prev => {
            const updated = attractions.map((_, i) => Array(4).fill(false));
            for (let i = 0; i < attractions.length; i++) {
                for (let j = 0; j < 4; j++) {
                    const barRef = transportBarRefs.current[i]?.[j];
                    if (!barRef?.current) continue;
                    const barRect = barRef.current.getBoundingClientRect();
                    let collide = false;
                    for (let k = 0; k < attractions.length; k++) {
                        if (k === i) continue;
                        const itemRef = scheduleItemRefs.current[k];
                        if (!itemRef?.current) continue;
                        const itemRect = itemRef.current.getBoundingClientRect();
                        if (isRectOverlap(itemRect, barRect)) {
                            collide = true;
                            break;
                        }
                    }
                    updated[i][j] = collide;
                }
            }
            return updated;
        });
    };


    // 監聽 attractions 變動時初始化 barCollide 與 barHeightLimits
    useEffect(() => {
        setBarCollide(attractions.map(() => Array(4).fill(false)));

        // 計算每個item的maxBarHeight
        const limits = attractions.map((attraction, index) => {
            if (index < attractions.length - 1) {
                const curY = attraction.y;
                const curH = attraction.height;
                const nextY = attractions.find(a => a.sequence === attraction.sequence + 1)?.y;
                if (typeof nextY === 'number') {
                    let maxBarHeight = nextY - (curY + curH) + 1;
                    if (maxBarHeight < 0) maxBarHeight = 0;
                    return maxBarHeight;
                }
            }
            return null;
        });
        setBarHeightLimits(limits);
    }, [attractions]);

    // 監聽拖曳/resize時觸發碰撞檢查（只在attractions有變化時）
    useEffect(() => {
        checkAllBarScheduleItemCollision();
    }, [attractions]);

    // function 1:把新的行程新增到資料庫
    const db_insert_schedule = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/view2_schedule_list_insert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ t_id, date, u_id, day, title }),
            });
            const data = await res.json();
            console.log('🧐🧐API response:', data);
            //記錄這個新的行程
            TheNewSchedule = {"date": data.date, "day": 1, "title": data.title, "s_id": data.s_id};
            return data; // 回傳含 s_id 的物件
        } catch (error) {
            console.error('Error executing API:', error);
            throw error;
        }
    };

    // function 2:把單個景點插入到資料庫
    const db_insert_schedule_item = async (s_id) => {
        // 用 attractions 陣列 map 方式插入資料
        console.log('🚖🚖🚖 attraction:', attractions);
        try {
            await Promise.all(
                attractions.map(async (attraction) => {
                    // console.log('🚖🚖🚖 attraction:', attraction);
                    await fetch('http://localhost:3001/api/view2_schedule_include_insert', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            a_id: attraction.a_id,
                            t_id: t_id,
                            s_id: s_id,
                            x: attraction.x,
                            y: attraction.y,
                            height: attraction.height,
                            sequence:attraction.sequence,
                            transport_method: attraction.transport_method, // 新增交通方式
                        }),
                    });
                })
            );
        } catch (error) {
            console.error('Error executing API for item:', error);
            throw error;
        }
    };

    // function 3:取得Schedule Item的資料（這是callback function更新後馬上取得）
    const getChildData = (func_height, func_x, func_y,func_a_id) => {
        // 更新指定 a_id 的 y/height，並排序+sequence
        setAttractions(prev => {
            // 先更新 y/height
            const updated = prev.map(item => item.a_id === func_a_id ? { ...item, y: func_y, height: func_height } : item);
            // 依照 y 值大小，依序給 sequence（但不改陣列順序）
            const sorted = [...updated].sort((a, b) => a.y - b.y);
            const seqMap = new Map(sorted.map((item, idx) => [item.a_id, idx + 1]));
            return updated.map(item => ({ ...item, sequence: seqMap.get(item.a_id) }));
        });

        // console.log(attractions);
    };

    // function 4:確認行程(button點擊事件)
    const handleConfirm = async () => {
        if (isDraft && ScheduleInsertShow) {
            // 如果是草稿狀態，確認整個行程
            if (confirm('已經確認了嗎，是否還要修改。')) {
                ScheduleInsertShow(false); //確認了就讓insert的這個消失
                const scheduleData = await db_insert_schedule();//插入schedule
                const s_id = scheduleData.s_id;

                //顯示最新的schedule
                handleNewSchedule(TheNewSchedule);

                await db_insert_schedule_item(s_id);//插入schedule中的細項
                
                //告訴attraction_card恢復可drag
                attractions.forEach(attraction => {
                    onAttractionUsed(attraction.a_id,false); // false 表示標記為未使用
                });

                // 行程確認後，計算所有景點間的交通時間
                const result = await function1(attractions, s_id, date);
                if (result.success) {
                    console.log('交通時間計算完成:', result.message);
                } else {
                    console.error('交通時間計算失敗:', result.error);
                }
            }
        } else {
            alert('此行程已經確認');
        }
    };

    // function 5:取消行程(button點擊事件)
    const handleCancel = () => {
        if (isDraft && ScheduleInsertShow) {
            if (confirm('確定要取消這個行程嗎？所有內容都會被刪除。')) {
                //告訴attraction_card恢復可drag
                attractions.forEach(attraction => {
                    onAttractionUsed(attraction.a_id,false); // false 表示標記為未使用
                });
                ScheduleInsertShow(false);
                
            }
        } else {
            alert('已確認的行程無法取消');
        }
    };

    // function 6:重新排序行程（還沒套用）
    const handleReorder = () => {
        console.log("Dragging");
        const sorted = [...attractions].sort((a, b) => a.y - b.y);
        console.log("目前attractions：", sorted.map(a => ({ y: a.y, name: a.name, sequence: a.sequence })));
        // 按照排序結果更新 sequence
        const updated = sorted.map((item, idx) => ({ ...item, sequence: idx + 1 }));
        setAttractions(updated);
    };

    // function 7:取得某個景點的交通方式
    const getTransportMethod = (a_id_for_function, value) => {
        setAttractions(prev => prev.map(item =>
            item.a_id === a_id_for_function
                ? { ...item, transport_method: value }
                : item
        ));
        console.log('🅰️景點', a_id_for_function);
        console.log('🚖目前選擇的交通方式:', value);
    };

    // function8:AI
    const handleGenerate = async () => {
        setLoading(true);
        all_attraction = await fetchAttractions();
        const prompt = buildPrompt(all_attraction, { startTime: '09:00', endTime: '17:00', attraction_count: 7 });
        const originalResponse = await scheduleGenerate(prompt, 1);
        try {
            // 解析 AI 回傳的 JSON 字串
            const arr = JSON.parse(originalResponse);
            // 逐一建立 NewAttraction 並添加到 setAttractions
            arr.forEach(item => {
                // 計算時間和00:00的差距
                const [sh, sm] = "00:00".split(':').map(Number);
                const [eh, em] = item.arrival_time.split(':').map(Number);
                const timeDiff = (eh * 60 + em) - (sh * 60 + sm);
                
                const calculated_y = timeDiff * HourIntervalHeight; // 計算 y 座標

                const NewAttraction = {
                    a_id: item.a_id,
                    name: item.name,
                    sequence: item.sequence,
                    transport_method: 0,
                    height: item.stay_minutes * HourIntervalHeight,
                    width: 180,
                    x: 0,
                    y: calculated_y,
                    position: { x: 0, y: calculated_y },
                };
                setAttractions(prev => [...prev, NewAttraction]);
            });
        } catch (e) {
            console.warn('解析AI回傳行程失敗', e);
        }
        console.log(originalResponse);
        setLoading(false);
    }



    //function 9:顯示某個景點的營業時間
    const showOperatingTime = () => {
        //還沒收到前面的時間
    };

    //use Drop(處理drag and drop事件),還沒確認的
    const [{ isOver }, drop] = useDrop({
        accept: "card",
        drop: (item, monitor) => {
            console.log('拖拽的 a_id:', item.a_id);

            if (!dropRef.current) {
                console.error("Drop target not found!");
                return;
            }

        // 使用 getClientOffset 獲取拖放預覽的位置，而不是原始元素的位置
        console.log("Monitor methods:", {
            getClientOffset: monitor.getClientOffset(),
            getSourceClientOffset: monitor.getSourceClientOffset(),
            getDifferenceFromInitialOffset: monitor.getDifferenceFromInitialOffset()
        });
        
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) {
            console.error("Client offset not found!");
            return;
        }

        const dropTarget = dropRef.current.querySelector('.schedule_timeline');
        if (!dropTarget) {
            console.error("Drop target element not found!");
            return;
        }

        const dropTargetRect = dropTarget.getBoundingClientRect();

        // 獲取鼠標相對於drop目標的位置（相對於schedule_timeline的左上角）
        // 將 x 坐標設為 0，讓元素總是從左邊開始
        const x = 0; // 固定為 0，總是從左邊開始
        const y = clientOffset.y - dropTargetRect.top;
      
        // console.log('clientOffset:', clientOffset);
        // console.log('dropTargetRect:', dropTargetRect);

        // 確保拖放位置不超出容器範圍
        // x 已經固定為 0，所以不需要修正
        const correctedX = x;
        const correctedY = Math.max(0, Math.min(y, dropTargetRect.height));

             const dropTargetId = dropTarget.getAttribute('data-id'); // 獲取 Drop Target 的 ID
        
        if (monitor.getItemType() === "card") {       
            // 處理從 attraction_card 拖動
            const newAttraction = {
                a_id: item.a_id,
                name: item.name, //把名字也加入Attraction
                x: correctedX, // 固定為 0，總是從左邊開始
                y: correctedY, // 使用計算後的 y 坐標
                position: { x: correctedX, y: correctedY },
                height: 35, // 調整高度，與 schedule_item.jsx 保持一致 @==@調整成真正的高度
                width: 180, // 調整寬度，與 schedule_item.jsx 保持一致
                sequence: attractions.length + 1, // 新增的景點序號
                transport_method: 0 // 初始交通方式為 0
            };
            
            // setAttractions((prevAttractions) => [...prevAttractions, newAttraction]);
            
            setAttractions((prevAttractions) => {
                let new_attraction_list = [...prevAttractions, newAttraction];
                // 依照 y 值大小，依序給 sequence（但不改陣列順序）
                const sorted = [...new_attraction_list].sort((a, b) => a.y - b.y);
                const seqMap = new Map(sorted.map((item, idx) => [item.a_id, idx + 1]));
                return new_attraction_list.map(item => ({ ...item, sequence: seqMap.get(item.a_id) }));
            });

            // 通知父組件該景點已被使用
            if (onAttractionUsed) {
                onAttractionUsed(item.a_id,true); // true 表示標記為已使用
            }

        } 
    },
    collect: (monitor) => ({
        isOver: monitor.isOver(),
    }),
  });

    // 綁定 dropRef
    drop(dropRef);

    // 渲染時間線格線
    const renderGrid = () => {
        const timeColumn = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00',
                            '08:00', '09:00', '10:00', '11:00', '12:00','13:00', '14:00', '15:00', 
                            '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00','23:59'
                            ];
        const lines = [];
        const intervalHeight = containerHeight / 25; // 調整為空間/25
        // HourIntervalHeight = intervalHeight;

        timeColumn.forEach((time, index) => {
            lines.push(
                <div key={index} style={{ position: "absolute", top: index * intervalHeight, left: 0, width: "100%", height: "1px", backgroundColor: "lightgray" }} />
            );
        });

        return lines;
    };

    // console.log("🚖attractions:", attractions);

    return (
        <div ref={dropRef} className={`schedule ${isOver ? 'highlight' : ''}`} style={{ position: 'relative', height: containerHeight, overflow: 'hidden', maxHeight: containerHeight, overflowY: 'hidden', overflowX: 'hidden' }}>
            <div className="schedule_header">

                <div className="budget_display">$350</div>
                
                <div className="button_display">
                    <button className="cancel_btn" onClick={handleCancel}>取消</button>
                    <button className="confirm_btn" onClick={handleConfirm}>完成</button>
                    <button className="generate_btn" onClick={handleGenerate}>AI</button>
                </div>

                <span className="schedule_date">{title}</span>
            </div>
        
            <div className="schedule_timeline" style={{ position: 'relative', overflow: 'hidden', maxHeight: containerHeight }}>
                {renderGrid()}
                
                {/* 顯示景點 - 現在只會在草稿狀態下執行 */}
                {attractions && attractions.length > 0 ? (
                <Suspense fallback={<div>Loading...</div>}>
                    {attractions.map((attraction, index) => {
                        // 動態建立ref
                        if (!scheduleItemRefs.current[index]) scheduleItemRefs.current[index] = React.createRef();
                        if (!transportBarRefs.current[index]) transportBarRefs.current[index] = [React.createRef(), React.createRef(), React.createRef(), React.createRef()];

                        return (
                            <ScheduleItem
                                scheduleItemRef={scheduleItemRefs.current[index]}
                                height={attraction.height}
                                a_id={attraction.a_id}
                                key={`attraction-${index}`}
                                name={attraction.name}
                                position={attraction.position}
                                width={attraction.width}
                                index={index}
                                scheduleId={scheduleId}
                                isDraft={isDraft}
                                onValueChange={(height, x, y,a_id) => { getChildData(height, x, y,a_id); checkAllBarScheduleItemCollision(); }}
                                editable={true}
                                onDragStop={() => { handleReorder(); setTimeout(checkAllBarScheduleItemCollision, 0); }}
                                getTransportMethod={(a_id,value) => getTransportMethod(a_id,value)}
                                intervalHeight={intervalHeight}
                                nextAId={attractions.find(a => a.sequence === attraction.sequence + 1)?.a_id ?? null}
                                editmode={true}
                                transport_method={attraction.transport_method}
                                barRefs={transportBarRefs.current[index]}
                                barCollide={barCollide[index] || [false, false, false, false]}
                                maxBarHeight={barHeightLimits[index]}
                            />
                        );
                    })}
                </Suspense>
                ) : (
                <div className="schedule_empty">
                    <span>{loading ? "行程生成中..." : "拖拽景點到這裡"}</span>

                </div>
                )}
            </div>
        </div>
    );
};

const CustomDragPreview = () => {
    const { item, currentOffset, isDragging } = useDragLayer((monitor) => ({
        item: monitor.getItem(),
        currentOffset: monitor.getClientOffset(),
        isDragging: monitor.isDragging(),
    }));
    
    const scheduleRef = document.querySelector('.schedule');
    const scheduleWidth = scheduleRef ? scheduleRef.offsetWidth : 0;

    if (!isDragging || !currentOffset || scheduleWidth === 0) {
        return null;
    }

    // 移除預覽的水平偏移
    const x = currentOffset.x - (scheduleWidth / 2);
    const y = currentOffset.y;

    return (
        <div
        style={{
            position: 'fixed',
            pointerEvents: 'none',
            transform: `translate(${x}px, ${y}px)`,
            // left: `${x - scheduleWidth * 0.45}px`, // 調整 x 坐標，讓鼠標位於預覽圖中心
            // top: `${y - 50}px`, // 調整 y 坐標，讓鼠標位於預覽圖中心
            width: `${scheduleWidth * 0.9}px`, // 基於 schedule 的寬度
            backgroundColor: '#f0f0f0',
            border: '1px solid black',
            borderRadius: '5px',
            padding: '10px',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
            zIndex: 100,
        }}
        >
            <div className="attraction_name" style={{ fontWeight: 'bold', color: '#333' }}>
                {item?.name || item?.id || '景點名稱'}
            </div>
        </div>
    );
};

export default ScheduleInsert;

export { CustomDragPreview };