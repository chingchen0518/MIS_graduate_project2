import React, { useState, useEffect } from 'react';

import AttractionDetail from './AttractionDetail.jsx';
import Filter from './Filter.jsx';

import './AttractionContainer.css';

import MapDisplay from './MapDisplay.jsx';
const AttractionContainer = ({ usedAttractions = [] }) => {
    //state
    const [selectedTab, setSelectedTab] = useState('選擇文化村');
    const [showTripPlanning, setShowTripPlanning] = useState(false); // 控制是否顯示行程規劃區域

    const [selectedAttraction, setSelectedAttraction] = useState(null);
    const [draggedAttractions, setDraggedAttractions] = useState(new Set());
    const [attractions, setAttractions] = useState([]);

    
//   const handleAddTrip = () => {
//     setShowTripPlanning(true);
//   };

    return (
        <div className="attraction_container">
            <Filter />
            <div className="map_small_container">
                <MapDisplay selectedAttraction={selectedAttraction} />
            </div>

            <AttractionDetail attraction={selectedAttraction} />
        </div>

    );
};

export default AttractionContainer;

// 假設你有從 API 拿到 trip 資料
const [trip, setTrip] = useState(null);

useEffect(() => {
    fetch(`/api/trip/${tripId}`)
        .then(res => res.json())
        .then(data => setTrip(data));
}, [tripId]);

return (
    <div>
        {/* ...existing code... */}
        {trip && (
            <>
                <div>stage_date: {trip.stage_date}</div>
                <div>time: {trip.time}</div>
                <div>
                    deadline: {new Date(trip.deadline).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
                </div>
                <div>剩餘秒數: {trip.remainingTime}</div>
            </>
        )}
        {/* ...existing code... */}
    </div>
);