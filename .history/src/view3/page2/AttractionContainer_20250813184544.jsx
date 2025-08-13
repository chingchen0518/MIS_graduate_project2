import React, { useState, useEffect } from 'react';

import AttractionDetail from './AttractionDetail.jsx';
import Filter from './Filter.jsx';

import './AttractionContainer.css';

import MapDisplay from './MapDisplay.jsx';
const AttractionContainer = ({ usedAttractions = [], selectedCategories = [], onCategoryChange, t_id }) => {
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

            <div className="map_small_container">
                <MapDisplay selectedAttraction={selectedAttraction} />
            </div>

            {/* <div className="map_small_container">
            <MapDisplay />
            </div> */}
            <AttractionDetail attraction={selectedAttraction} />
        </div>

    );
};

export default AttractionContainer;