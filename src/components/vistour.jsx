import React, { useState, useEffect } from 'react';
import Header from './header.jsx';
import Login from '../view3/page1/login.jsx';
import Profile from '../view3/page1/profile.jsx';
import Page1 from '../view2/chingchen/page1.jsx';
import Page2 from '../view3/page2/page2.jsx';
import Page3 from '../view3/page3/Page3.jsx';


const Vistor = () => {
    const trip = JSON.parse(localStorage.getItem('trip'));
    const [stage, setStage] = useState('A');
    const [tripId, setTripId] = useState(trip.tid || 1);//之後要修改

    // 取得旅程資料
    const fetchTripData = async () => {
        try {
            const res = await fetch(`/api/trip/${tripId}`);
            const data = await res.json();
            setTripId(data.tripId);
            setStage(data.stage);
        } catch (e) {
            console.error('API 錯誤:', e);
        }
    };
    useEffect(() => {
        const handleStageUpdate = () => {
            fetchTripData();
        };
        window.addEventListener('stageUpdated', handleStageUpdate);
        return () => window.removeEventListener('stageUpdated', handleStageUpdate);
    }, []);

    let content;
    if (stage === 'A') content = <Login />;
    else if (stage === 'B') content = <Profile />;
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