import React, { useState, useRef, lazy, Suspense } from 'react';
import { useDrop, useDragLayer } from 'react-dnd';
import './schedule.css';

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
    
    let TheNewSchedule = {};

    //state
    const [attractions, setAttractions] = useState([]); //儲存目前放進schedule的attraction
    // var finalScheduleItems = {}; // 儲存最終的行程項目
    const dropRef = useRef(null);

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
                if (attractions && attractions.length >= 2) {
                    // console.log(' 開始計算行程交通時間...');
                    // console.log(' Attractions 陣列內容:', attractions);
                    // console.log(' Attractions 長度:', attractions.length);
                    
                    // // 檢查每個景點的結構
                    // attractions.forEach((attraction, index) => {
                    //     console.log(`景點 ${index}:`, attraction);
                    //     console.log(`  - id: ${attraction.id}`);
                    //     console.log(`  - a_id: ${attraction.a_id}`);
                    //     console.log(`  - name: ${attraction.name}`);
                    //     console.log(`  - latitude: ${attraction.latitude}`);
                    //     console.log(`  - longitude: ${attraction.longitude}`);
                        
                    //     // 警告：如果沒有經緯度
                    //     if (!attraction.latitude || !attraction.longitude) {
                    //         console.warn(`⚠️  警告：景點 ${attraction.name} 缺少經緯度資訊！`);
                    //     }
                    // });
                    
                    // 提取景點 ID，從前端的 attractions 陣列中提取所有景點的 ID
                    const attractionIds = attractions.map(attraction => {
                        const id = attraction.a_id || attraction.id;
                        return typeof id === 'string' ? parseInt(id) : id;
                    }).filter(id => !isNaN(id) && id > 0); // 過濾掉無效的 ID
                    
                    console.log(' 提取的景點 IDs:', attractionIds);
                    console.log(' 景點 IDs 類型:', attractionIds.map(id => typeof id));
                    
                    if (attractionIds.length >= 2) {
                        try {
                            //用這三個資料給aAPI，去計算交通
                            const requestData = {
                                attractionIds: attractionIds,
                                scheduleId: s_id, // 使用剛插入的 schedule ID
                                date: date || new Date().toISOString().split('T')[0] // 使用行程日期或今天的日期
                            };
                            
                            console.log(' 發送交通時間計算 API 請求資料:', requestData);
                            
                            //發送 API 請求，調用後端的交通時間計算 API
                            const response = await fetch('http://localhost:3001/api/calculate-schedule-transport-times', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(requestData)
                            });
                            
                            console.log(' 交通時間 API 回應狀態:', response.status);
                            
                            const result = await response.json();
                            console.log(' 交通時間 API 回應內容:', result);
                            
                            if (result.success) {
                                console.log('交通時間計算完成:', result.message);
                            } else {
                                console.error('交通時間計算失敗:', result.error);
                            }
                        } catch (error) {
                            console.error('調用交通時間計算 API 失敗:', error);
                        }
                    } else {
                        console.log('景點數量不足，跳過交通時間計算');
                    }
                } else {
                    console.log('⚠️ 無景點或景點數量不足，跳過交通時間計算');
                }

                
                // db_insert_schedule_item(s_id);//插入schedule中的細項
                
                // await ()=>{handleNewSchedule(scheduleData)};//把新增的行程傳回去給schedule_container.jsx

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

    //function 7:顯示某個景點的營業時間
    const showOperatingTime = () => {
        //還沒收到前面的時間
    };


    //use Drop(處理drag and drop事件),還沒確認的
    const [{ isOver }, drop] = useDrop({
        accept: "card",
        drop: (item, monitor) => {
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

        // console.log('Item dropped:', item, 'at position:', { x: correctedX, y: correctedY });
        // 可能有錯誤---------------------------------------------------------------------------------
        // const t_id = item.id || 1; // 使用 attraction_card 的 ID 作為 trip ID，默認為 1
        const dropTargetId = dropTarget.getAttribute('data-id'); // 獲取 Drop Target 的 ID
        // const s_id = dropTargetId || 1; // 使用 Drop Target 的 ID 作為 schedule ID，默認為 1
        // 可能有錯---------------------------------------------------------------------------------
        // const a_id = item.a_id || 1; // 景點 ID，默認為 1

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
                    <button className="confirm_btn" onClick={handleConfirm}>確認</button>
                    <button className="cancel_btn" onClick={handleCancel}>取消</button>
                </div>

                <span className="schedule_date">{title}</span>
            </div>
        
            <div className="schedule_timeline" style={{ position: 'relative', overflow: 'hidden', maxHeight: containerHeight }}>
                {renderGrid()}
                
                {/* 顯示景點 - 現在只會在草稿狀態下執行 */}
                {attractions && attractions.length > 0 ? (
                <Suspense fallback={<div>Loading...</div>}>
                    {attractions.map((attraction, index) => (
                        <ScheduleItem
                            height={HourIntervalHeight} // 使用計算的高度
                            a_id={attraction.a_id}
                            key={`attraction-${index}`}
                            name={attraction.name}
                            position={attraction.position}
                            width={attraction.width}
                            index={index} //目前第幾個，暫時用的（用於後面識別schedule_item）
                            scheduleId={scheduleId}
                            isDraft={isDraft}
                            onValueChange={(height, x, y,a_id) => getChildData(height, x, y,a_id)}
                            editable={true}
                            onDragStop={() => handleReorder}
                            intervalHeight={intervalHeight}
                            nextAId={attractions.find(a => a.sequence === attraction.sequence + 1)?.a_id ?? null}
                            editmode={true}
                        />
                    ))}
                </Suspense>
                ) : (
                <div className="schedule_empty">
                    <span>拖拽景點到這裡</span>
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