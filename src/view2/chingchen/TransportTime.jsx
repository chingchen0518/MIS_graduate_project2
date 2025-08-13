import React, { useImperativeHandle, useState, forwardRef, useEffect } from "react";
import { useDrag } from 'react-dnd';
import { Rnd } from "react-rnd";

// TransportTime 組件：顯示每個景點的時間
const TransportTime = ({ editmode=false, intervalHeight,a_id,nextAId }) => {
    var HourIntervalHeight = intervalHeight/60;//計算每個小時這些schedule中的高度（會在render grid里修改）
    const [transport, setTransport] = useState({car:0,bicycle:0,bus:0,walk:0}); //儲存目前放進schedule的attraction

    // if(!nextAId){
    //     setTransport({car:0,bicycle:0,bus:0,walk:0});
    // }
    
    
    //讀取資料庫
    // Use Effect 1:從DB讀取景點的交通時間（如果有下一個才景點要讀取，否則不用）
    
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
                let new_transport={car: data[0].car || 0, bicycle: data[0].bicycle || 0, bus: data[0].bus || 0, walk: data[0].walk || 0};
                
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

export default TransportTime;
