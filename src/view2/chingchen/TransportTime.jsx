import React from "react";
import { useDrag } from 'react-dnd';
import { Rnd } from "react-rnd";

// TransportTime 組件：顯示每個景點的時間
const TransportTime = ({ intervalHeight }) => {
    var HourIntervalHeight = intervalHeight/60;//計算每個小時這些schedule中的高度（會在render grid里修改）
    var transport={car:20,bicycle:21,public:50,walk:70};

    return (
        <div className="transport_time" style={{ display: 'flex', height: '100%', justifyContent: 'space-evenly' }}>
            <div className="car" style={{ height: `${transport.car * HourIntervalHeight}px`, border: '1px solid red', backgroundColor: 'red', width: '10%' }}></div>
            <div className="bicycle" style={{ height: `${transport.bicycle * HourIntervalHeight}px`, border: '1px solid green', backgroundColor: 'green', width: '10%' }}></div>
            <div className="walk" style={{ height: `${transport.walk * HourIntervalHeight}px`, border: '1px solid blue', backgroundColor: 'blue', width: '10%' }}></div>
            <div className="public" style={{ height: `${transport.public * HourIntervalHeight}px`, border: '1px solid orange', backgroundColor: 'orange', width: '10%' }}></div>
        </div>
    );
};

export default TransportTime;
