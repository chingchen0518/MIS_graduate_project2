import React, { useImperativeHandle, useState, forwardRef, useEffect } from "react";
import './TransportTime.css'

// function1:計算行程所有景點間交通時間的函數
const function1 = async (attractions, s_id, date) => {
    // 行程確認後，計算所有景點間的交通時間
    if (attractions && attractions.length >= 2) {

        // 提取景點 ID，從前端的 attractions 陣列中提取所有景點的 ID
        const attractionIds = attractions.map(attraction => {
            const id = attraction.a_id || attraction.id;
            return typeof id === 'string' ? parseInt(id) : id;
        }).filter(id => !isNaN(id) && id > 0); // 過濾掉無效的 ID

        if (attractionIds.length >= 2) {
            try {
                //用這三個資料給API，去計算交通
                const requestData = {
                    attractionIds: attractionIds,
                    scheduleId: s_id, // 使用剛插入的 schedule ID
                    date: date || new Date().toISOString().split('T')[0] // 使用行程日期或今天的日期
                };

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

// 單一交通方式的 bar，hover 時顯示分鐘數
const TransportBar = React.forwardRef(function TransportBar({ a_id, type, value, color, height, unit = '分鐘', onBarClick, selected }, ref) {
    const [showTip, setShowTip] = useState(false);
    const handleBarClick = () => {
        if (onBarClick) {
            onBarClick(a_id, value);
        }
    };
    return (
        <div
            ref={ref}
            className={`transport_method_bar`}
            style={{
                height: `${height}px`,
                // backgroundColor: color,
                width: '10%',
                position: 'relative',
                cursor: value > 0 ? 'pointer' : 'default',
                margin: '0 2px',
            }}
            onMouseEnter={() => value > 0 && setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
            onClick={handleBarClick}
        >
            {/* bar */}
            <div
                className={`bar transport_bar ${type}`}
                style={{
                    height: `${height}px`,
                    // backgroundColor: color,
                    width: '100%',
                    position: 'relative',
                    cursor: value > 0 ? 'pointer' : 'default',
                    margin: '0 2px',
                    opacity: selected ? 1 : 0.2
                }}
            >
            </div>

            {/* tooltip */}
            {showTip && value > 0 && (
                <div style={{
                    position: 'absolute',
                    top: -28,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#222',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 13,
                    whiteSpace: 'nowrap',
                    zIndex: 2,
                    opacity: 1

                }}>
                    {value}m
                </div>
            )}

        </div>
    );
});

// TransportTime 組件：顯示每個景點的時間
const TransportTime = ({ transport_method, editmode = false, intervalHeight = 60, a_id, nextAId, getTransportMethod = () => { }, barRefs = null, barCollide = [false, false, false, false], maxBarHeight = 100 }) => {
    var HourIntervalHeight = intervalHeight / 60;//計算每個小時這些schedule中的高度（會在render grid里修改）
    const [transport, setTransport] = useState({ car: 0, bicycle: 0, bus: 0, walk: 0, method: 0 }); //儲存目前放進schedule的attraction

    // Use Effect：從DB讀取景點的交通時間（如果有下一個景點要讀取，否則不用）
    useEffect(() => {
        if (nextAId) {
            let api = `http://localhost:3001/api/view2_get_transport_time/${a_id}/${nextAId}`;

            fetch(api)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    } else {
                        return response.json();
                    }
                })
                .then((data) => {
                    // 合併所有記錄的交通時間數據，優先使用非null的值
                    let new_transport = { car: 0, bicycle: 0, bus: 0, walk: 0 };

                    if (data && data.length > 0) {
                        // 遍歷所有記錄，合併非null的值
                        data.forEach(record => {
                            if (record.car !== null && record.car > 0) new_transport.car = record.car;
                            if (record.bicycle !== null && record.bicycle > 0) new_transport.bicycle = record.bicycle;
                            if (record.bus !== null && record.bus > 0) new_transport.bus = record.bus;
                            if (record.walk !== null && record.walk > 0) new_transport.walk = record.walk;
                        });
                    } else {
                        // 如果沒有數據，設置一些默認值進行測試顯示
                        console.log(`⚠️ 沒有找到從景點 ${a_id} 到 ${nextAId} 的交通時間資料，使用默認值`);
                        new_transport = { car: 15, bicycle: 30, bus: 20, walk: 45 };
                    }

                    // console.log('合併後的交通時間:', new_transport);
                    setTransport(new_transport);
                })
                .catch((error) => {
                    console.error('Error fetching attractions:', error);
                });
        } else {//如果nextAId不存在，則清空transport
            setTransport({ car: 0, bicycle: 0, bus: 0, walk: 0 });
        }
    }, [a_id, nextAId]);

    var maxtime = Math.max(transport.car, transport.bicycle, transport.bus, transport.walk);

    const handleClick = (a_id, value) => {
        console.log('🅰️景點', a_id);
        console.log('選擇的交通方式 value:', value);
        getTransportMethod(a_id, value);
    };

    // 定義每個交通方式的 value
    const barValues = {
        car: 1,
        bicycle: 2,
        bus: 3,
        walk: 4
    };

    // 計算每個交通方式的 bar 實際高度（加上 maxBarHeight 限制）
    const getLimitedHeight = (h) => {
        if (typeof maxBarHeight === 'number' && maxBarHeight >= 0 && h > maxBarHeight) return maxBarHeight;
        return h;
    };
    return (
        <div className="transport_time" style={{ display: 'flex', height: `${maxtime * HourIntervalHeight}px`, justifyContent: 'space-evenly', position: 'relative', zIndex: 1 }}>
            <TransportBar ref={barRefs && barRefs[0]} type="car" value={barValues.car} color={barCollide && barCollide[0] ? '#f44' : "#ff914d"} height={getLimitedHeight(transport.car * HourIntervalHeight)} onBarClick={handleClick} selected={transport_method === 1} a_id={a_id} />
            <TransportBar ref={barRefs && barRefs[1]} type="bicycle" value={barValues.bicycle} color={barCollide && barCollide[1] ? '#f44' : "#65cdca"} height={getLimitedHeight(transport.bicycle * HourIntervalHeight)} onBarClick={handleClick} selected={transport_method === 2} a_id={a_id} />
            <TransportBar ref={barRefs && barRefs[2]} type="bus" value={barValues.bus} color={barCollide && barCollide[2] ? '#f44' : "#428cef"} height={getLimitedHeight(transport.bus * HourIntervalHeight)} onBarClick={handleClick} selected={transport_method === 3} a_id={a_id} />
            <TransportBar ref={barRefs && barRefs[3]} type="walk" value={barValues.walk} color={barCollide && barCollide[3] ? '#f44' : "#7ed957"} height={getLimitedHeight(transport.walk * HourIntervalHeight)} onBarClick={handleClick} selected={transport_method === 4} a_id={a_id} />
        </div>
    );

};

// 導出函數供其他組件使用
export { function1 };
export default TransportTime;
