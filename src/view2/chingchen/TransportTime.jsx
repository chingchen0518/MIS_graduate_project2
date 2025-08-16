import React, { useImperativeHandle, useState, forwardRef, useEffect } from "react";
import { useDrag } from 'react-dnd';
import { Rnd } from "react-rnd";

// 計算行程所有景點間交通時間的函數
const function1 = async (attractions, s_id, date) => {
    // 行程確認後，計算所有景點間的交通時間
    if (attractions && attractions.length >= 2) {
        
        // 提取景點 ID，從前端的 attractions 陣列中提取所有景點的 ID
        const attractionIds = attractions.map(attraction => {
            const id = attraction.a_id || attraction.id;
            return typeof id === 'string' ? parseInt(id) : id;
        }).filter(id => !isNaN(id) && id > 0); // 過濾掉無效的 ID
        
        console.log(' 提取的景點 IDs:', attractionIds);
        console.log(' 景點 IDs 類型:', attractionIds.map(id => typeof id));
        
        if (attractionIds.length >= 2) {
            try {
                //用這三個資料給API，去計算交通
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
                    return { success: true, message: result.message };
                } else {
                    console.error('交通時間計算失敗:', result.error);
                    return { success: false, error: result.error };
                }
            } catch (error) {
                console.error('調用交通時間計算 API 失敗:', error);
                return { success: false, error: error.message };
            }
        } else {
            console.log('景點數量不足，跳過交通時間計算');
            return { success: false, error: '景點數量不足' };
        }
    } else {
        console.log('⚠️ 無景點或景點數量不足，跳過交通時間計算');
        return { success: false, error: '無景點或景點數量不足' };
    }
};

// TransportTime 組件：顯示每個景點的時間
const TransportTime = ({ editmode=false, intervalHeight,a_id,nextAId }) => {
    var HourIntervalHeight = intervalHeight/60;//計算每個小時這些schedule中的高度（會在render grid里修改）
    const [transport, setTransport] = useState({car:0,bicycle:0,bus:0,walk:0}); //儲存目前放進schedule的attraction
    // if(!nextAId){
    //     setTransport({car:0,bicycle:0,bus:0,walk:0});
    // }
    
    // Use Effect：從DB讀取景點的交通時間（如果有下一個景點要讀取，否則不用）
    useEffect(() => {
        if(nextAId){
            let api = `http://localhost:3001/api/view2_get_transport_time/${a_id}/${nextAId}`;

            fetch(api)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }else{
                    return response.json();
                }
            })
            .then((data) => {
                // 合併所有記錄的交通時間數據，優先使用非null的值
                let new_transport = {car: 0, bicycle: 0, bus: 0, walk: 0};
                
                if (data && data.length > 0) {
                    // 遍歷所有記錄，合併非null的值
                    data.forEach(record => {
                        if (record.car !== null && record.car > 0) new_transport.car = record.car;
                        if (record.bicycle !== null && record.bicycle > 0) new_transport.bicycle = record.bicycle;
                        if (record.bus !== null && record.bus > 0) new_transport.bus = record.bus;
                        if (record.walk !== null && record.walk > 0) new_transport.walk = record.walk;
                    });
                }
                
                console.log('合併後的交通時間:', new_transport);
                setTransport(new_transport);
            })
            .catch((error) => {
                console.error('Error fetching attractions:', error);
            });
        }else {//如果nextAId不存在，則清空transport
            setTransport({ car: 0, bicycle: 0, bus: 0, walk: 0 });
        }
    }, [a_id, nextAId]);

    var maxtime = Math.max(transport.car, transport.bicycle, transport.bus, transport.walk);

    if(editmode){
        console.log("transport", transport);
        console.log("maxtime", maxtime);
        console.log("HourIntervalHeight", HourIntervalHeight);
    }


    return (
        <div className="transport_time" style={{ display: 'flex', height: `${maxtime * HourIntervalHeight}px`, justifyContent: 'space-evenly' }}>
            <div className="car" style={{ height: `${transport.car * HourIntervalHeight}px`, backgroundColor: '#ff914d', width: '10%' }}></div>
            <div className="bicycle" style={{ height: `${transport.bicycle * HourIntervalHeight}px`, backgroundColor: '#65cdca', width: '10%' }}></div>
            <div className="public" style={{ height: `${transport.bus * HourIntervalHeight}px`, backgroundColor: '#428cef', width: '10%' }}></div>
            <div className="walk" style={{ height: `${transport.walk * HourIntervalHeight}px`, backgroundColor: '#7ed957', width: '10%' }}></div>



        </div>
    );
    
};

// 導出函數供其他組件使用
export { function1 };
export default TransportTime;
