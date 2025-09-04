let HOST_URL = import.meta.env.VITE_API_URL;
let NGROK_URL = import.meta.env.VITE_NGROK_URL;
const PORT = import.meta.env.PORT || 3001;
let BASE_URL = NGROK_URL || `http://${HOST_URL}:${PORT}`;

import React, { useState, useEffect } from 'react';
import Header from './header.jsx';
import Backend from '../view3/page1/Backend.jsx';
import ChooseAttraction from '../view1/part2.jsx';
import Page1 from '../view2/chingchen/page1.jsx';
import Page2 from '../view3/page2/page2.jsx';
import Page3 from '../view3/page3/Page3.jsx';


const Vistor = () => {
    const storedTrip = localStorage.getItem('trip');
    const trip = storedTrip ? JSON.parse(storedTrip) : {};

    const [tripId, setTripId] = useState(trip.tid || 1);
    const [stage, setStage] = useState(trip.stage || 'A'); // 預設 A

    const fetchTripData = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/trip/${tripId}`);
            const data = await res.json();
            setTripId(data.tid || data.tripId);
            setStage(data.stage || '未知');
        } catch (e) {
            console.error('API 錯誤:', e);
        }
    };

    useEffect(() => {
        fetchTripData(); // 🚨 這裡一開始也要呼叫一次，確保有資料

        const handleStageUpdate = () => {
            fetchTripData();
        };
        window.addEventListener('stageUpdated', handleStageUpdate);
        return () => window.removeEventListener('stageUpdated', handleStageUpdate);
    }, [tripId]); // 依賴 tripId


    let content;
    if (stage === 'A') content = <Backend />;
    else if (stage === 'B') content = <ChooseAttraction />;
    else if (stage === 'C') content = <Page1 />;
    else if (stage === 'D') content = <Page2 />;
    else if (stage === 'E') content = <Page3 />;
    else content = <div>未知階段</div>;

    return (
        <>
            <Header />
            {content}
        </>
    );
};

export default Vistor;